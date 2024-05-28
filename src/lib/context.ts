// import {Pinecone} from "@pinecone-database/pinecone"
// // import { convertToAscii } from "./utils";
// import { get } from "http";
// import { getEmbeddings } from "./embeddings";
// import { match } from "assert";


// export function convertToAscii(inputString: string) {
//     // This example regex replaces any character outside the range of space (ASCII 32) to tilde (ASCII 126) with an underscore,
//     // and then replaces any whitespace with underscores, ensuring all characters are ASCII-printable.
//     return inputString.replace(/[^ -~]+/g, "").replace(/\s+/g, "_");
// }

// export async function getMatchesFromEmbeddings(embeddings:number[], fileKey:string) {

    

//     try {

//         const pinecone = new Pinecone({
//             // environment: process.env.PINECONE_ENVIORNMENT!,
//             apiKey: process.env.PINECONE_API_KEY!,
//         });

//         const Index = await pinecone.index('chatpdf-yt')

        

//         const namespace = Index.namespace(convertToAscii(fileKey))
//         const queryResult = await namespace.query({
//             topK: 5,
//             vector: embeddings,
//             includeMetadata: true,
            


//         })
//         return queryResult.matches || [];
//     } catch (error) {
//         console.log('error querying embeddings', error)
//         throw error
//     }
    
    
// }
  

// export async function getContext(query: string, fileKey: string) {
//     const queryEmbeddings = await getEmbeddings(query)
//     const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey)

//     const qualifyingDocs = matches.filter(
//         (match) => match.score && match.score>0.7
//     )

//     type Metadata = {
//         text: string,
//         pageNumber: number


//     }

//     let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)
//     return docs.join("\n").substring(0,3000)
// }
// ---------------------------------------------------------------------------------------------------------------------------------------------

import { Pinecone } from "@pinecone-database/pinecone";
// import { convertToAscii } from "./utils";
import { getEmbeddings } from "./embeddings";

export function convertToAscii(inputString: string) {
    // This example regex replaces any character outside the range of space (ASCII 32) to tilde (ASCII 126) with an underscore,
    // and then replaces any whitespace with underscores, ensuring all characters are ASCII-printable.
    return inputString.replace(/[^ -~]+/g, "").replace(/\s+/g, "_");
}

export async function getMatchesFromEmbeddings(embeddings: number[], fileKey: string) {
    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        const Index = await pinecone.index('chatpdf-yt')
        const namespace = Index.namespace(convertToAscii(fileKey))
        
        const queryResult = await namespace.query({
            topK: 5,
            vector: embeddings,
            includeMetadata: true,
        });

        return queryResult.matches || [];
    } catch (error) {
        console.log('error querying embeddings', error);
        throw error;
    }
}

// export async function getContext(query: string, fileKey: string) {
//     const queryEmbeddings = await getEmbeddings(query);
//     const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);

//     const queryKeywords = query.toLowerCase().split(" "); // Simple keyword extraction from query
    
//     // Filter for high-relevance matches and ensure metadata exists
//     const qualifyingDocs = matches
//       .filter(match => match.score && match.score > 0.7 && match.metadata)
//       .map(match => {
//         const text = match.metadata?.text ? String(match.metadata?.text) : ""; // Safe access with fallback to empty string
//         const keywordRelevance = queryKeywords.reduce((acc, keyword) => acc + (text.toLowerCase().includes(keyword) ? 1 : 0), 0);
//         return { text, relevance: keywordRelevance };
//       })
//       .sort((a, b) => b.relevance - a.relevance);

//     // Select and concatenate the most relevant texts based on ranking
//     let context = qualifyingDocs
//       .map(match => match.text)
//       .join("\n")
//       .substring(0, 3000);

//     return context;
// }

//---------------------------------------------------------------------------------------------------------------------------------------


import { extractKeyPhrases, calculateSegmentRelevance } from './textAnalysisUtils';

export async function getContext(query: string, fileKey: string) {
    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey);
    const keyPhrases = extractKeyPhrases(query); 

    type ContextSegment = {
        segment: string;
        relevanceScore: number;
      };

      let contextSegments: ContextSegment[] = [];


    for (const match of matches) {
        if (match.score !== undefined && match.score > 0.7 && match.metadata) {
            const text = String(match.metadata.text);
            // Break down the text into segments (e.g., sentences or paragraphs)
            const segments = text.split('\n').map(segment => segment.trim()).filter(segment => segment.length > 0);

            segments.forEach(segment => {
                const relevanceScore = calculateSegmentRelevance(segment, keyPhrases);
                contextSegments.push({ segment, relevanceScore });
            });
        }
    }

    // Sort segments by relevance and assemble the context
    contextSegments.sort((a, b) => b.relevanceScore - a.relevanceScore);
    let context = contextSegments.map(({ segment }) => segment).join("\n").substring(0, 70000);

    return context;
}


//----------------------------------------------------------------------------------------------------------------------


// import {calculateSegmentRelevance} from './textAnalysisUtils';

// type ContextSegment = {
//     segment: string;
//     relevanceScore: number;
// };

// export async function getContext(query: string, fileKey: string) {
//     // Fetch embeddings for the query
//     const queryEmbeddings = await getEmbeddings(query); // This should return number[]
//     const matches = await getMatchesFromEmbeddings(queryEmbeddings, fileKey); // Ensure this function is correctly implemented to fetch document matches

//     let contextSegments: ContextSegment[] = [];

//     for (const match of matches) {
//         if (match.score !== undefined && match.score > 0.7 && match.metadata) {
//             const text = String(match.metadata.text);
//             // Split the text into manageable segments
//             const segments = text.split('\n').map(segment => segment.trim()).filter(segment => segment.length > 0);

//             for (const segment of segments) {
//                 // Calculate the relevance of each segment to the query
//                 const relevanceScore = await calculateSegmentRelevance(segment, query);
//                 contextSegments.push({ segment, relevanceScore });
//             }
//         }
//     }

//     // Sort segments by relevance and assemble the context
//     contextSegments.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
//     // Adjust limit to 5000 characters as discussed, ensuring it fits your model's token constraints
//     let context = contextSegments
//                     .map(({ segment }) => segment)
//                     .join("\n")
//                     .substring(0, 70000);

//     return context;
// }
