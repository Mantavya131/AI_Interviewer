import {OpenAIApi, Configuration} from 'openai-edge';

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(config)
export async function getEmbeddings(text:string) {
    try {
        const response = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input: text.replace(/\n/g, ' ')
        })
        const result = await response.json()
        return result.data[0].embedding as number[]
    } catch (error) {
        console.log('error calling openai embedding api', error)
        throw error 
    }
    
}








// import { OpenAIApi, Configuration } from 'openai-edge';

// const config = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function getEmbeddings(text: string) {
//     try {
//         const response = await openai.createEmbedding({
//             model: 'text-embedding-ada-002',
//             input: text.replace(/\n/g, ' '),
//         });
        
//         // Assuming response.json() is not needed or incorrect in this SDK version. Adjust if necessary.
//         if (!response || !response.data || response.data.length === 0) {
//             console.log('No data returned from the OpenAI API');
//             return []; // Or handle this case as needed
//         }

//         if (!response.data[0].embedding) {
//             console.log('No embedding found in the response');
//             return []; // Or handle this case as needed
//         }

//         return response.data[0].embedding as number[];
//     } catch (error) {
//         console.log('Error calling OpenAI embedding API:', error);
//         throw error;
//     }
// }





// import { OpenAIApi, Configuration } from 'openai-edge';

// const config = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

// export async function getEmbeddings(text: string) {
//     try {
//         const response = await openai.createEmbedding({
//             model: 'text-embedding-3-small',
//             input: text.replace(/\n/g, ' '),
//         });

//         // Assuming response.json() successfully retrieves the expected JSON structure
//         const result = await response.json();

//         // Simple success check based on the presence of an embeddings array
//         if (!result || !result.embeddings || result.embeddings.length === 0) {
//             console.log('API call was successful, but no embeddings were returned.');
//             return []; // Handle as appropriate for your application
//         }

//         // Proceed assuming the 'embeddings' array is properly populated
//         return result.embeddings[0];
//     } catch (error) {
//         console.log('Error calling OpenAI embedding API:', error);
//         throw error;
//     }
// }

