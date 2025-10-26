"use client"
import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { client } from '@/lib/liveblocks'

interface DirectCollaborativeEditorProps {
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

// Direct cursor component
function DirectCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
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

function DirectCollaborativeEditor({ roomId, initialContent = "", onContentChange }: DirectCollaborativeEditorProps) {
  const { user } = useUser()
  const containerRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; name: string; color: string }>>(new Map())
  const [myPresence, setMyPresence] = useState<{ x: number; y: number } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [room, setRoom] = useState<any>(null)
  const [connectedUsers, setConnectedUsers] = useState<any[]>([])
  
  // User info
  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
  const userColor = getUserColor(userName)
  const userId = user?.id || 'anonymous'

  // Direct Liveblocks connection
  useEffect(() => {
    let currentRoom: any = null
    
    const connectToRoom = async () => {
      try {
        console.log("🔍 Direct connection to Liveblocks room:", roomId)
        
        // Enter room directly
        currentRoom = client.enterRoom(roomId, {
          initialPresence: {
            cursor: null,
          },
        })
        
        setRoom(currentRoom)
        
        // Set initial presence
        currentRoom.updatePresence({
          cursor: null,
          name: userName,
          color: userColor,
        })
        
        // Listen for presence changes
        currentRoom.subscribe("my-presence", (presence: any) => {
          console.log("👤 My presence updated:", presence)
        })
        
        currentRoom.subscribe("others", (others: any) => {
          console.log("👥 Others updated:", others.length)
          setConnectedUsers(others)
          
          // Update cursors
          const newCursors = new Map()
          others.forEach((other: any) => {
            if (other.presence?.cursor && other.presence?.name) {
              newCursors.set(other.connectionId, {
                x: other.presence.cursor.x,
                y: other.presence.cursor.y,
                name: other.presence.name,
                color: other.presence.color || '#6b7280',
              })
            }
          })
          setCursors(newCursors)
        })
        
        // Listen for storage changes
        currentRoom.subscribe("storage", (storage: any) => {
          const newContent = storage.content || ""
          console.log("💾 Storage updated:", newContent.length, "characters")
          setContent(newContent)
          onContentChange?.(newContent)
        })
        
        setIsConnected(true)
        console.log("✅ Direct connection established to room:", roomId)
        
      } catch (error) {
        console.error("❌ Failed to connect to room:", error)
        setIsConnected(false)
      }
    }
    
    connectToRoom()
    
    return () => {
      if (currentRoom) {
        console.log("🔌 Disconnecting from room:", roomId)
        currentRoom.leave()
      }
    }
  }, [roomId, userName, userColor, initialContent, onContentChange])

  // Handle cursor movement
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current || !room) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setMyPresence({ x, y })
    
    // Update presence in room
    room.updatePresence({
      cursor: { x, y },
    })
    
    console.log(`📍 Direct cursor moved to: ${x}, ${y}`)
  }, [room])

  const handlePointerLeave = useCallback(() => {
    setMyPresence(null)
    
    if (room) {
      room.updatePresence({
        cursor: null,
      })
    }
    
    console.log("👋 Direct cursor left the editor")
  }, [room])

  // Handle text changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    setContent(newContent)
    
    if (room) {
      // Update storage directly
      room.updateStorage({
        content: newContent,
      })
    }
    
    onContentChange?.(newContent)
    console.log("📝 Direct content updated:", newContent.length, "characters")
  }, [room, onContentChange])

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm font-medium">
            {isConnected 
              ? `${connectedUsers.length + 1} editing (DIRECT CONNECTION)` 
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
        {Array.from(cursors.entries()).map(([id, cursor]) => (
          <DirectCursor
            key={id}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        ))}

        {/* My cursor preview */}
        {myPresence && (
          <DirectCursor
            x={myPresence.x}
            y={myPresence.y}
            name={`${userName} (You)`}
            color={userColor}
          />
        )}

        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Start writing... Open this in another tab to see DIRECT real-time collaboration!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
        />
      </div>

      <div className="text-center text-xs text-gray-400">
        Direct Liveblocks connection • Room: {roomId} • {connectedUsers.length + 1} users connected
      </div>
      
      {/* Debug info */}
      <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <summary>Debug Info (click to expand)</summary>
        <div className="mt-2 space-y-1">
          <div>Connection status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Room: {room ? '✅ Active' : '❌ None'}</div>
          <div>Others count: {connectedUsers.length}</div>
          <div>Cursors: {cursors.size}</div>
          <div>Room ID: {roomId}</div>
          <div>Content length: {content.length}</div>
          <div>My presence: {myPresence ? `${myPresence.x}, ${myPresence.y}` : 'None'}</div>
        </div>
      </details>
    </div>
  )
}

export default DirectCollaborativeEditor
