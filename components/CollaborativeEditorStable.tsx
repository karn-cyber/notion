"use client"
import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface CollaborativeEditorStableProps {
  roomId: string
  initialContent?: string
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

// Cursor component
function Cursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
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

function CollaborativeEditorStable({ roomId, initialContent = "", onContentChange }: CollaborativeEditorStableProps) {
  const { user } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; name: string; color: string }>>(new Map())
  const [myPresence, setMyPresence] = useState<{ x: number; y: number } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set())
  
  // User info
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
  const userColor = getUserColor(userName)
  const userId = user?.id || 'anonymous'

  // Simulate connection (in real app, this would be Liveblocks)
  useEffect(() => {
    console.log("🔍 Collaborative Editor connecting to room:", roomId)
    
    // Simulate connection delay
    const timer = setTimeout(() => {
      setIsConnected(true)
      setConnectedUsers(prev => new Set([...prev, userId]))
      console.log("✅ Connected to collaborative room:", roomId)
    }, 500)

    return () => clearTimeout(timer)
  }, [roomId, userId])

  // Handle cursor movement
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current || !isConnected) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setMyPresence({ x, y })
    
    // In a real app, this would broadcast to other users
    console.log(`📍 Cursor moved to: ${x}, ${y}`)
  }, [isConnected])

  const handlePointerLeave = useCallback(() => {
    setMyPresence(null)
    console.log("👋 Cursor left the editor")
  }, [])

  // Handle text changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    setContent(newContent)
    onContentChange?.(newContent)
    
    // In a real app, this would sync with other users
    console.log("📝 Content updated:", newContent.length, "characters")
  }, [onContentChange])

  // Simulate other users' cursors (for demo)
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      // Simulate other users moving their cursors
      const simulatedUsers = ['Alice', 'Bob', 'Charlie']
      const newCursors = new Map()
      
      simulatedUsers.forEach((name, index) => {
        if (Math.random() > 0.3) { // 70% chance of cursor being visible
          newCursors.set(`user-${index}`, {
            x: Math.random() * 400 + 50,
            y: Math.random() * 200 + 100,
            name,
            color: getUserColor(name),
          })
        }
      })
      
      setCursors(newCursors)
    }, 2000)

    return () => clearInterval(interval)
  }, [isConnected])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">
            {isConnected 
              ? `${connectedUsers.size + cursors.size} editing` 
              : "Connecting..."
            }
          </span>
          {!isConnected && <span className="text-xs text-gray-500">(Demo mode)</span>}
        </div>
        <div className="flex -space-x-1">
          {/* Current user */}
          <div className="w-7 h-7 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Other users */}
          {Array.from(cursors.entries()).slice(0, 4).map(([id, cursor]) => (
            <div
              key={id}
              className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name.charAt(0).toUpperCase()}
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
        {/* Other users' cursors */}
        {Array.from(cursors.entries()).map(([id, cursor]) => (
          <Cursor
            key={id}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        ))}

        {/* My cursor (for demo) */}
        {myPresence && (
          <Cursor
            x={myPresence.x}
            y={myPresence.y}
            name={`${userName} (You)`}
            color={userColor}
          />
        )}

        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Start writing... Open this in another tab to see simulated collaboration!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
        />
      </div>

      <div className="text-center text-xs text-gray-400">
        {isConnected ? `Collaborative editing • Room: ${roomId}` : "Connecting to collaboration..."}
      </div>
    </div>
  )
}

export default CollaborativeEditorStable
