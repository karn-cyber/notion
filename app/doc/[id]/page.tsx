"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import DocumentWithRealCollab from '@/components/DocumentWithRealCollab'
import CollaboratorChat from '@/components/CollaboratorChat'
import { RoomProvider } from '@/lib/liveblocks'
import { ClientSideSuspense } from '@liveblocks/react/suspense'

function DocumentPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <RoomProvider 
      id={id} 
      initialPresence={{ 
        cursor: null, 
        name: undefined, 
        color: undefined, 
        isTyping: false, 
        lastSeen: undefined 
      }} 
      initialStorage={{ 
        content: "", 
        blocks: "[]",
        chatMessages: "[]"
      }}
    >
      <div className="flex flex-col flex-1 min-h-screen">
        <DocumentWithRealCollab id={id} />
        <ClientSideSuspense fallback={<div />}>
          <CollaboratorChat />
        </ClientSideSuspense>
      </div>
    </RoomProvider>
  )
}

export default DocumentPage;