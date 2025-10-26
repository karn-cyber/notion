"use client"
import React from 'react'

interface CollaborativeEditorProps {
  roomId: string
}

function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="mb-4 text-sm text-gray-600">
        Real-time Editor (Room: {roomId})
      </div>
      <textarea
        placeholder="Start writing... Real-time collaboration will be added shortly!"
        className="w-full h-96 p-4 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default CollaborativeEditor
