import ChatComponent from '@/components/ChatComponent'
import ChatSideBar from '@/components/ChatSideBar'
import PDFViewer from '@/components/PDFViewer'
import { db } from '@/lib/db'
import { chats } from '@/lib/db/schema'
import { checkSubscription } from '@/lib/subscription'
import { auth } from '@clerk/nextjs'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
    params:{
        chatId: string
    }
}

const ChatPage = async ({params:{chatId}}: Props) => {
    const {userId} = await auth()
    if (!userId) {
        return redirect('/chat-id')
    }

    const _chats = await db.select().from(chats).where(eq(chats.userId,userId))
    if (!chats) {
        return redirect('/')
    }

    if (!_chats.find(chat => chat.id===parseInt(chatId))) {
        return redirect('/')
    }

    const currentChat = _chats.find(chat => chat.id===parseInt(chatId));
    

    return (
        <div className="flex max-h-screen">
          <div className="flex w-full">
            {/* chat sidebar */}
            <div className="flex-[1] max-w-xs overflow-y-auto">
                <ChatSideBar chats={_chats} chatId={parseInt(chatId)}/> 
            </div>
            {/* pdf viewer */}
            <div className="p-4 overflow-y-auto flex-[5]">
              <PDFViewer pdf_url={currentChat?.pdfUrl || ''}/>
            </div>
            {/* chat component */}
            <div className="flex-[3] border-l-4 border-l-slate-200 overflow-y-auto">
              <ChatComponent chatId={parseInt(chatId)}/>
            </div>
          </div>
        </div>
      )
      
}

export default ChatPage