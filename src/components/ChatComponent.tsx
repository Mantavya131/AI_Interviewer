'use client'
import React from 'react'
import { Input } from './ui/input'
import {useChat} from 'ai/react'
import { Button } from './ui/button'
import { Send } from 'lucide-react'
import MessageList from './MessageList'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Message } from 'ai'

type Props = {chatId: number};



const ChatComponent = ({chatId}: Props) => {

    const { data } = useQuery({
        queryKey: ["chat", chatId],
        queryFn: async () => {
          const response = await axios.post<Message[]>("/api/get-messages", {
            chatId,
          });
          return response.data;
        },
      });



    const {input,handleInputChange,handleSubmit, messages} = useChat({
        api: '/api/chat',
        body: {
            chatId
        },
        initialMessages: data || [],
    })

    React.useEffect(() => {
        const messageContainer = document.getElementById('message-container')
        if (messageContainer) {
            messageContainer.scrollTo({
                top: messageContainer.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages])

    return (
        <div className='relative h-screen overflow-y-auto bg-gray-100' id='message-container'>
            <div className='sticky top-0 inset-x-0 p-2 bg-white h-fit shadow z-10'>
                <h3 className='text-xl font-bold'>Chat</h3>
            </div>

            <div className='my-4 mx-2 p-2 bg-white border border-gray-300 rounded-lg shadow'>
                <MessageList messages={messages}/>
            </div>


            <div className='sticky bottom-0 inset-x-0 p-4 bg-white shadow'>
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <Input value={input} onChange={handleInputChange} placeholder='Ask any question...' className='w=full'/>
                        <Button className='bg-blue-600'>
                            <Send className='h-4 w-4'/>
                        </Button>
                    </div>
                </form>
            </div>

        </div>

    
    )
    
}

export default ChatComponent