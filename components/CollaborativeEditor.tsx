"use client"
import React, { useCallback, useRef, useEffect } from 'react'
import { useMyPresence, useOthers, useMutation, useStorage } from '@/lib/liveblocks'
import { useUser } from '@clerk/nextjs'

interface CollaborativeEditorProps {
  roomId: string
}

// Get user color
const getUserColor = (name: string): string => {
  const colors = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Fast cursor component
function Cursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
      style={{ left: x - 10, top: y - 10 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        className="absolute top-4 left-1 px-1.5 py-0.5 text-xs text-white rounded whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}

function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { user } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const [, updateMyPresence] = useMyPresence()
  const others = useOthers()
  
  // Get content with fallback
  const content = useStorage((root) => root?.content || "")
  
  // Fast content update
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  // Set user presence
  useEffect(() => {
    if (user) {
      const userName = user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
      updateMyPresence({
        name: userName,
        color: getUserColor(userName),
        cursor: null,
      })
    }
  }, [user, updateMyPresence])

  // Handle cursor movement
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    updateMyPresence({
      cursor: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    })
  }, [updateMyPresence])

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

  // Handle text changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateContent(event.target.value)
  }, [updateContent])

  const connectedUsers = others.filter(other => other.presence?.name)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            {connectedUsers.length === 0 ? "Editing solo" : `${connectedUsers.length + 1} editing`}
          </span>
        </div>
        <div className="flex -space-x-1">
          <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
            {user?.firstName?.charAt(0) || 'Y'}
          </div>
          {connectedUsers.slice(0, 4).map(({ connectionId, presence }) => (
            <div
              key={connectionId}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: presence?.color || '#6b7280' }}
            >
              {(presence?.name || 'U').charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div 
        ref={containerRef}
        className="relative bg-white rounded-lg shadow-sm border overflow-hidden"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Cursors */}
        {others.map(({ connectionId, presence }) => {
          if (!presence?.cursor || !presence?.name) return null
          return (
            <Cursor
              key={connectionId}
              x={presence.cursor.x}
              y={presence.cursor.y}
              name={presence.name}
              color={presence.color || '#6b7280'}
            />
          )
        })}

        <textarea
          value={content || ""}
          onChange={handleTextChange}
          placeholder="Start writing... Open this in another tab to see real-time collaboration!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
        />
      </div>

      <div className="text-center text-xs text-gray-400">
        Real-time collaboration • Room: {roomId}
      </div>
    </div>
  )
}

export default CollaborativeEditor
