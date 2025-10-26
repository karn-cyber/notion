"use client"
import React from 'react'
import { useParams } from 'next/navigation'
import DocumentWithRealCollab from '@/components/DocumentWithRealCollab'
import { RoomProvider } from '@/lib/liveblocks'

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
        blocks: "[]" 
      }}
    >
      <div className="flex flex-col flex-1 min-h-screen">
        <DocumentWithRealCollab id={id} />
      </div>
    </RoomProvider>
  )
}

export default DocumentPage;