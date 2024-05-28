'use client'
import { DrizzleChat } from '@/lib/db/schema'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { MessageCircle, PlusCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { RiDeleteBin6Line } from 'react-icons/ri'; 

type Props = {
    chats: DrizzleChat[]
    chatId: number
}

const ChatSideBar = ({ chats, chatId }: Props) => {
    const [chatList, setChatList] = React.useState(chats); // Initialize the local state with chats
    const [loading, setLoading] = React.useState(false);

    const handleSubscription = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/stripe');
            window.location.href = response.data.url;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        const updatedChats = chatList.filter(chat => chat.id !== id);
        setChatList(updatedChats); // Update the state to trigger a re-render
    };

    return (
        <div className='relative w-full min-h-screen p-4 text-gray-200 bg-gray-900'>
            <Link href='/'>
                <Button className='w-full border-dashed border-white border'>
                    <PlusCircleIcon className='mr-2 w-4 h-4'/>
                    New Chat
                </Button>
            </Link>

            <div className="flex flex-col gap-2 mt-4 pb-32" style={{ overflowY: 'auto' }}>
                {chatList.map(chat => ( // Ensure to use chatList from state here
                    <div key={chat.id} className="flex justify-between items-center">
                        <Link href={`/chat/${chat.id}`}>
                            <div className= {cn("rounded-lg p-3 text-slate-300 flex items-center", {
                                    "bg-blue-600 text-white": chat.id === chatId,
                                    "hover:text-white": chat.id !== chatId,
                                })}>
                                <MessageCircle className='mr-2'/>
                                <p className='w-full overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'>{chat.pdfName}</p>
                            </div>
                        </Link>
                        <button onClick={() => handleDelete(chat.id)} className="text-red-500 hover:text-red-700">
                            <RiDeleteBin6Line size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <div className='absolute bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700'>
                <div className='flex items-center justify-center gap-2 text-sm text-slate-500 flex-wrap'>
                    <Link href={'/'}>Home</Link>
                    <Link href={'/'}>Logo</Link>  
                </div>

                {/* <div className="flex justify-center w-full">
                    <Button className="mt-2 text-white bg-slate-700" disabled={loading} onClick={handleSubscription}>
                        Upgrade To Pro!
                    </Button>
                </div> */}
            </div>

        </div>
    );
};

export default ChatSideBar;

