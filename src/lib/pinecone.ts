import {Pinecone, PineconeRecord, RecordMetadata} from '@pinecone-database/pinecone'
import { downloadFromS3 } from './s3-server';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'
import {Document, RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter'
import { getEmbeddings } from './embeddings';
import md5 from 'md5'
import { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
// import { convertToAscii } from './utils';

let pinecone: Pinecone | null = null;

// export const getPineconeClient = async() => {
//     if (!pinecone) {
//         pinecone = new Pinecone({
//             apiKey: process.env.PINECONE_API_KEY!,
//            });
//     }
//     return pinecone
// }
export async function getPineconeClient() {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return pinecone;
}


type PDFPage = {
    pageContent: string;
    metadata: {
        loc: {pageNumber: number}
    }
}

export function convertToAscii(inputString: string) {
    // This example regex replaces any character outside the range of space (ASCII 32) to tilde (ASCII 126) with an underscore,
    // and then replaces any whitespace with underscores, ensuring all characters are ASCII-printable.
    return inputString.replace(/[^ -~]+/g, "").replace(/\s+/g, "_");
}

// export async function loadS3IntoPinecone(fileKey:string) {
//     // 1) Obtain the pdf.
//     console.log('downloading S3 into filesystem')
//     const file_name = await downloadFromS3(fileKey);
//     if (!file_name){
//         throw new Error('could not download from S3')
//     }
    export async function loadS3IntoPinecone(fileKey: string) {
        console.log('Downloading S3 object into memory');
        const fileBuffer = await downloadFromS3(fileKey);
        if (!fileBuffer) {
            throw new Error('Could not download from S3');
        }
        // Convert Buffer to Blob if necessary
        const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
        const loader = new PDFLoader(fileBlob, { splitPages: true }); 
        const pages = (await loader.load()) as PDFPage[]; 

    const documents = await Promise.all(pages.map(prepareDocument));

    const vectors = await Promise.all(documents.flat().map(embedDocument))

    // 4) Upload to Pinecone

    const client = await getPineconeClient()
    const pineconeIndex = client.index('chatpdf-yt')

    console.log('Inserting vectors into pinecone')
    const namespace = convertToAscii(fileKey)

    // // Filter out undefined values from the vectors array
    // const filteredVectors = vectors.filter((vector): vector is Vector => vector !== undefined);

    // // Proceed with upsert using the filtered array, ensuring no undefined values are included
    // await pineconeIndex.namespace(namespace).upsert(filteredVectors as PineconeRecord<RecordMetadata>[]);

    //await pineconeIndex.namespace(namespace).upsert(vectors);
    const filteredVectors = vectors.filter((vector): vector is Vector => vector !== undefined);
    await pineconeIndex.namespace(namespace).upsert(filteredVectors as PineconeRecord<RecordMetadata>[]);

    return documents[0]
    

}

// 3) Vectorize the docs

async function embedDocument(doc:Document) {
    try {
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)

        return{
            id: hash,
            values: embeddings,
            metadata:{
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber
            }

        } as Vector
    } catch (error) {
        console.log('error embedding the document', error)
    }
}


    // 2) Split and segment the pdf.

    export const truncateStringByBytes = (str: string, bytes: number)=>{
        const enc = new TextEncoder()
        return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes))
    }

    async function prepareDocument(page: PDFPage) {
        let {pageContent, metadata} =  page
        pageContent = pageContent.replace(/\n/g, '')

        // Split the docs
        const splitter =  new RecursiveCharacterTextSplitter()
        const docs = await splitter.splitDocuments([
            new Document({
                pageContent,
                metadata: {
                    pageNumber: metadata.loc.pageNumber,
                    text: truncateStringByBytes(pageContent, 36000)
                }
            })
        ])
        return docs
    }