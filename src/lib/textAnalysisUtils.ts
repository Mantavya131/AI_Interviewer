import nlp from 'compromise';

/**
 * Extracts key phrases and keywords using NLP.
 * @param {string} query - The user's query.
 * @returns {Array<string>} An array of identified key phrases and keywords.
 */
function extractKeyPhrases(query: string): Array<string> {
    let doc = nlp(query);
    // Extracting nouns and verbs as key phrases/words. Adjust as needed.
    let nouns = doc.nouns().out('array');
    let verbs = doc.verbs().out('array');
    // Combining and removing duplicates
    let combined = Array.from(new Set([...nouns, ...verbs]));

    return combined;
}

/**
 * Calculates relevance of a text segment based on NLP analysis.
 * @param {string} segment - A segment of text to evaluate.
 * @param {Array<string>} keyPhrases - Extracted key phrases and keywords.
 * @returns {number} A score representing the segment's relevance.
 */
function calculateSegmentRelevance(segment: string, keyPhrases: Array<string>): number {
    let doc = nlp(segment);
    let score = 0;
    keyPhrases.forEach(phrase => {
        // Using NLP to find the occurrence of each phrase within the segment.
        if (doc.has(phrase)) {
            score += 1; // Increment score for each key phrase found. Could be weighted differently based on needs.
        }
    });
    return score;
}

export { extractKeyPhrases, calculateSegmentRelevance };



//---------------------------------------------------------------------------------------------------------------------------------------------


// import {OpenAIApi, Configuration} from 'openai-edge';

// const config = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY
// });

// const openai = new OpenAIApi(config);

// /**
//  * Fetches embeddings for a given text using OpenAI's API and correctly handles the response.
//  * @param {string} text - Text to embed.
//  * @returns {Promise<number[]>} - The embedding vector as an array of numbers.
//  */
// export async function fetchEmbeddings(text: string): Promise<number[]> {
//     try {
//         const response = await openai.createEmbedding({
//             model: 'text-embedding-ada-002',
//             input: text.replace(/\n/g, ' ') // Replacing new lines with spaces for consistent embeddings.
//         });
//         const result = await response.json(); // Correctly parsing the JSON response.
//         return result.data[0].embedding; // Accessing the embedding.
//     } catch (error) {
//         console.error('Error fetching embeddings:', error);
//         throw error;
//     }
// }

// function cosineSimilarity(vecA: number[], vecB: number[]): number {
//     const dotProduct = vecA.reduce((acc, cur, idx) => acc + cur * vecB[idx], 0);
//     const magA = Math.sqrt(vecA.reduce((acc, cur) => acc + cur ** 2, 0));
//     const magB = Math.sqrt(vecB.reduce((acc, cur) => acc + cur ** 2, 0));
//     return dotProduct / (magA * magB);
// }

// export async function calculateSegmentRelevance(segment: string, query: string): Promise<number> {
//     const segmentEmbedding = await fetchEmbeddings(segment);
//     const queryEmbedding = await fetchEmbeddings(query);
//     return cosineSimilarity(segmentEmbedding, queryEmbedding);
// }
