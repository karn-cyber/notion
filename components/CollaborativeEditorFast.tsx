"use client"
import React, { useCallback } from 'react'
import { useOthers, useMutation, useStorage } from '@/lib/liveblocks'

interface CollaborativeEditorProps {
  roomId: string
}

function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const others = useOthers()
  
  // Get content with fallback
  const content = useStorage((root) => root?.content || "")
  
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(event.target.value)
  }, [updateContent])

  const connectedUsers = others.filter(other => other.presence?.name)

  return (
    <div className="space-y-3">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-green-700">
            {connectedUsers.length === 0 ? "Editing solo" : `${connectedUsers.length + 1} users editing`}
          </span>
        </div>
        <div className="flex -space-x-1">
          {connectedUsers.slice(0, 5).map(({ connectionId, presence }) => (
            <div
              key={connectionId}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: presence?.color || '#6b7280' }}
              title={presence?.name || 'User'}
            >
              {(presence?.name || 'U').charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <textarea
          value={content || ""}
          onChange={handleTextChange}
          placeholder="Start writing... Open this document in another tab to see real-time collaboration in action!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base leading-relaxed"
        />
      </div>

      <div className="text-center text-xs text-gray-400">
        ✨ Real-time collaboration powered by Liveblocks • Room: {roomId}
      </div>
    </div>
  )
}

export default CollaborativeEditor
