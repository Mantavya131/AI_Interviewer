import {Configuration,OpenAIApi} from 'openai-edge'
import {OpenAIStream, StreamingTextResponse} from 'ai'
import { getContext } from '@/lib/context'
import { db } from '@/lib/db'
import { chats, messages as _messages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { Message } from 'ai/react'

export const runtime = 'edge'

const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(config)

export async function POST(req:Request) {
    try {
        const {messages, chatId} =await req.json()
        const _chats = await db.select().from(chats).where(eq(chats.id,chatId))
        if (_chats.length != 1){
            return NextResponse.json({'error': 'chat not found'}, {status:404})
        }
        const fileKey = _chats[0].fileKey
        const lastMessage = messages[messages.length -1];
        const context = await getContext(lastMessage.content, fileKey)

        // Log the context to verify its content
        console.log(`PDF Context for ${fileKey}:`, context);

        const prompt = {
            role: 'system',
            content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
            The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
            AI is a well-behaved and well-mannered individual.
            AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
            AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
            AI assistant is a big fan of Pinecone and Vercel.
            START CONTEXT BLOCK
            ${context}
            END OF CONTEXT BLOCK
            AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
            If initially unable to find an answer within the CONTEXT BLOCK, the AI assistant should re-examine the provided documentation, considering different perspectives or related information that might not have been immediately apparent. The goal is to provide the most accurate and helpful response possible, even if it requires additional thought or a more thorough review of the available information.
            AI assistant will not give previous question's context.
            AI assistant will not invent anything that is not drawn directly from the context.
            `,
        };

        
        // Logging the constructed prompt for verification
        console.log(`Prompt sent to OpenAI:`, JSON.stringify(prompt, null, 2));


        // console.log(`Prompt sent to OpenAI:`, prompt.content.substring(prompt.content.length - 500)); // Log last 500 chars to ensure context is appended

        // Logging the messages array just before the createChatCompletion call
        console.log("Messages sent to OpenAI:", {
            prompt, 
            userMessages: messages.filter((message: Message) => message.role === 'user')
        });


        const response = await openai.createChatCompletion({
            model:'gpt-3.5-turbo',
            messages: [
                prompt, 
                ...messages.filter((message: Message) => message.role==='user')

            ],
            stream: true
        })

        // Log the response from OpenAI for review
        console.log(`Response from OpenAI:`, JSON.stringify(response, null, 2));


        const stream = OpenAIStream(response, {
            onStart: async () => {
                // Save user query into database. 
                await db.insert(_messages).values({
                    chatId,
                    content: lastMessage.content,
                    role: 'user'
                })

               

            },
            onCompletion: async (completion) => {
                // Save response into database. 
                await db.insert(_messages).values({
                    chatId,
                    content: completion,
                    role: 'system'
                })
            }
        })
        return new StreamingTextResponse(stream)
    } catch (error) {
        // Enhanced error handling: Log any errors encountered during the process
        console.error(`Error while calling OpenAI API:`, error);
        // Return an error response or handle it as needed
        return NextResponse.json({ 'error': 'An error occurred while processing your request' }, { status: 500 });
    }
}
