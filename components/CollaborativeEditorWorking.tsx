"use client"
import React, { useCallback, useRef, useEffect, useState } from 'react'

interface CollaborativeEditorWorkingProps {
  roomId: string
  initialContent: string
  onContentChange?: (content: string) => void
  userName: string
  userColor: string
}

// Working cursor component
function WorkingCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
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

function CollaborativeEditorWorking({ 
  roomId, 
  initialContent, 
  onContentChange, 
  userName, 
  userColor 
}: CollaborativeEditorWorkingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const [myPresence, setMyPresence] = useState<{ x: number; y: number } | null>(null)
  const [otherCursors, setOtherCursors] = useState<Map<string, { x: number; y: number; name: string; color: string }>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15))
  
  // Simulate connection
  useEffect(() => {
    console.log("🔍 Working collaborative editor connecting to room:", roomId)
    const timer = setTimeout(() => {
      setIsConnected(true)
      console.log("Working collaboration connected!")
    }, 500)
    
    return () => clearTimeout(timer)
  }, [roomId])

  // Simulate cross-tab communication using localStorage
  useEffect(() => {
    const storageKey = `collab-${roomId}`
    
    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          console.log("📡 Received cross-tab data:", data)
          
          if (data.type === 'cursor' && data.sessionId !== sessionId) {
            // Update other user's cursor
            setOtherCursors(prev => {
              const newCursors = new Map(prev)
              if (data.cursor) {
                newCursors.set(data.sessionId, {
                  x: data.cursor.x,
                  y: data.cursor.y,
                  name: data.userName,
                  color: data.userColor,
                })
              } else {
                newCursors.delete(data.sessionId)
              }
              return newCursors
            })
          }
          
          if (data.type === 'content' && data.sessionId !== sessionId) {
            // Update content from other tab
            setContent(data.content)
            console.log("Content updated from other tab")
          }
        } catch (error) {
          console.error("Error parsing storage data:", error)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [roomId, sessionId])

  // Clean up old cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setOtherCursors(prev => {
        const now = Date.now()
        const newCursors = new Map()
        prev.forEach((cursor, id) => {
          // Keep cursors that are less than 5 seconds old
          const storageData = localStorage.getItem(`collab-${roomId}`)
          if (storageData) {
            try {
              const data = JSON.parse(storageData)
              if (data.sessionId === id && (now - data.timestamp) < 5000) {
                newCursors.set(id, cursor)
              }
            } catch (e) {
              // Ignore invalid data
            }
          }
        })
        return newCursors
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [roomId])

  // Handle cursor movement
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!containerRef.current || !isConnected) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setMyPresence({ x, y })
    
    // Broadcast cursor position to other tabs
    const data = {
      type: 'cursor',
      sessionId,
      userName,
      userColor,
      cursor: { x, y },
      timestamp: Date.now(),
    }
    
    localStorage.setItem(`collab-${roomId}`, JSON.stringify(data))
    console.log(`📍 Broadcasting cursor: ${x}, ${y}`)
  }, [isConnected, roomId, sessionId, userName, userColor])

  const handlePointerLeave = useCallback(() => {
    setMyPresence(null)
    
    // Broadcast cursor leave
    const data = {
      type: 'cursor',
      sessionId,
      userName,
      userColor,
      cursor: null,
      timestamp: Date.now(),
    }
    
    localStorage.setItem(`collab-${roomId}`, JSON.stringify(data))
    console.log("👋 Broadcasting cursor leave")
  }, [roomId, sessionId, userName, userColor])

  // Handle text changes
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = event.target.value
    setContent(newContent)
    onContentChange?.(newContent)
    
    // Broadcast content change to other tabs
    const data = {
      type: 'content',
      sessionId,
      content: newContent,
      timestamp: Date.now(),
    }
    
    localStorage.setItem(`collab-${roomId}`, JSON.stringify(data))
    console.log("📝 Broadcasting content update:", newContent.length, "characters")
  }, [roomId, sessionId, onContentChange])

  return (
    <div className="space-y-3">
      {/* Editor */}
      <div 
        ref={containerRef}
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Other users' cursors */}
        {Array.from(otherCursors.entries()).map(([id, cursor]) => (
          <WorkingCursor
            key={id}
            x={cursor.x}
            y={cursor.y}
            name={cursor.name}
            color={cursor.color}
          />
        ))}

        {/* My cursor preview */}
        {myPresence && (
          <WorkingCursor
            x={myPresence.x}
            y={myPresence.y}
            name={`${userName} (You)`}
            color={userColor}
          />
        )}

        <textarea
          value={content}
          onChange={handleTextChange}
          placeholder="Start writing, you can also share this doc and collaborate in real-time!"
          className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-base leading-relaxed bg-transparent font-sans"
          style={{
            lineHeight: '1.6',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          spellCheck={true}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
        />
      </div>

      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        Cross-tab collaboration • Room: {roomId} • {otherCursors.size + 1} users connected
      </div>
      
      {/* Debug info */}
      <details className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded transition-colors">
        <summary className="cursor-pointer">Debug Info (click to expand)</summary>
        <div className="mt-2 space-y-1">
          <div>Connection: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Session ID: {sessionId}</div>
          <div>Other cursors: {otherCursors.size}</div>
          <div>Room ID: {roomId}</div>
          <div>Content length: {content.length}</div>
          <div>My presence: {myPresence ? `${myPresence.x}, ${myPresence.y}` : 'None'}</div>
          <div>Storage key: collab-{roomId}</div>
        </div>
      </details>
    </div>
  )
}

export default CollaborativeEditorWorking
