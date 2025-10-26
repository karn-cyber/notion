"use client"
import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useMyPresence, useOthers, useMutation, useStorage } from '@/lib/liveblocks'
import { useUser } from '@clerk/nextjs'

interface RealCollaborativeEditorProps {
  roomId: string
  onContentChange?: (content: string) => void
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

// Real cursor component
function RealCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-100 ease-out"
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

function RealCollaborativeEditor({ roomId, onContentChange }: RealCollaborativeEditorProps) {
  const { user } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const [myPresence, updateMyPresence] = useMyPresence()
  const others = useOthers()
  const [isConnected, setIsConnected] = useState(false)
  
  // User info
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
  const userColor = getUserColor(userName)

  // Get content from Liveblocks storage
  const content = useStorage((root) => root?.content || "")
  
  // Update content in Liveblocks
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  // Set initial presence when component mounts
  useEffect(() => {
    console.log("🔍 Real Collaborative Editor connecting to room:", roomId)
    console.log("🔍 User info:", { userName, userColor })
    
    updateMyPresence({
      name: userName,
      color: userColor,
      cursor: null,
    })
    
    setIsConnected(true)
    console.log("✅ Connected to real collaborative room:", roomId)
  }, [roomId, userName, userColor, updateMyPresence])

  // Debug log other users
  useEffect(() => {
    console.log("👥 Other users in room:", others.length)
    others.forEach((other, index) => {
      console.log(`  User ${index + 1}:`, {
        connectionId: other.connectionId,
        name: other.presence?.name,
        color: other.presence?.color,
        hasCursor: !!other.presence?.cursor
      })
    })
  }, [others])

  // Handle cursor movement
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    updateMyPresence({
      cursor: { x, y },
    })
    
    console.log(`📍 Real cursor moved to: ${x}, ${y}`)
  }, [updateMyPresence])

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
    console.log("👋 Real cursor left the editor")
  }, [updateMyPresence])

  // Handle text changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    updateContent(newContent)
    onContentChange?.(newContent)
    
    console.log("📝 Real content updated:", newContent.length, "characters")
  }, [updateContent, onContentChange])

  // Filter users with valid presence
  const connectedUsers = others.filter(other => other.presence?.name)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">
            {isConnected 
              ? `${connectedUsers.length + 1} editing (REAL-TIME)` 
              : "Connecting..."
            }
          </span>
        </div>
        <div className="flex -space-x-1">
          {/* Current user */}
          <div 
            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: userColor }}
            title={`${userName} (You)`}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Other real users */}
          {connectedUsers.slice(0, 4).map((other) => (
            <div
              key={other.connectionId}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: other.presence?.color || '#6b7280' }}
              title={other.presence?.name || 'Unknown User'}
            >
              {(other.presence?.name || 'U').charAt(0).toUpperCase()}
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
        {/* Real users' cursors */}
        {others.map((other) => {
          if (!other.presence?.cursor || !other.presence?.name) return null
          
          return (
            <RealCursor
              key={other.connectionId}
              x={other.presence.cursor.x}
              y={other.presence.cursor.y}
              name={other.presence.name}
              color={other.presence.color || '#6b7280'}
            />
          )
        })}

        <textarea
          value={content || ""}
          onChange={handleTextChange}
          placeholder="Start writing... Open this in another tab to see REAL collaboration!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
        />
      </div>

      <div className="text-center text-xs text-gray-400">
        Real-time collaboration • Room: {roomId} • {connectedUsers.length + 1} users connected
      </div>
      
      {/* Debug info */}
      <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <summary>Debug Info (click to expand)</summary>
        <div className="mt-2 space-y-1">
          <div>My presence: {JSON.stringify(myPresence)}</div>
          <div>Others count: {others.length}</div>
          <div>Connected users: {connectedUsers.length}</div>
          <div>Room ID: {roomId}</div>
          <div>Content length: {(content || "").length}</div>
        </div>
      </details>
    </div>
  )
}

export default RealCollaborativeEditor
