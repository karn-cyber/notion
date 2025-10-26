"use client"
import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { StatusIndicator } from './ui/status-indicators'
import { UserAvatar } from './ui/user-avatar'
import { cn } from '@/lib/utils'
import { 
  Mouse, 
  Users, 
  Wifi, 
  Activity,
  Eye,
  MessageSquare
} from 'lucide-react'

interface CollaborativeEditorWorkingProps {
  roomId: string
  initialContent: string
  onContentChange?: (content: string) => void
  userName: string
  userColor: string
}

// Premium cursor component
function PremiumCursor({ x, y, name, color }: { x: number; y: number; name: string; color: string }) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-150 ease-out"
      style={{ left: x - 12, top: y - 12 }}
    >
      <div className="relative">
        {/* Cursor SVG with enhanced styling */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
          <path
            d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            className="filter drop-shadow-sm"
          />
        </svg>
        
        {/* User name badge with premium styling */}
        <div
          className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap shadow-lg border border-white/20 backdrop-blur-sm"
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
            <span className="font-medium">{name}</span>
          </div>
        </div>
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
    <div className="space-y-4">
      {/* Premium Editor Card */}
      <Card className="shadow-lg border-2 border-border/50 hover:border-primary/20 transition-all duration-300 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative bg-linear-to-br from-card via-card to-card/80 transition-colors group"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Other users' cursors */}
          {Array.from(otherCursors.entries()).map(([id, cursor]) => (
            <PremiumCursor
              key={id}
              x={cursor.x}
              y={cursor.y}
              name={cursor.name}
              color={cursor.color}
            />
          ))}

          {/* My cursor preview */}
          {myPresence && (
            <PremiumCursor
              x={myPresence.x}
              y={myPresence.y}
              name={`${userName} (You)`}
              color={userColor}
            />
          )}

          <textarea
            value={content}
            onChange={handleTextChange}
            placeholder="✨ Start writing your ideas... This document supports real-time collaboration across tabs!"
            className={cn(
              "w-full h-96 p-8 border-none outline-none resize-none",
              "text-foreground placeholder-muted-foreground/70 text-base leading-relaxed bg-transparent",
              "font-sans transition-all duration-200",
              "focus:placeholder-muted-foreground/50",
              "selection:bg-primary/20"
            )}
            style={{
              lineHeight: '1.7',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
            }}
            spellCheck={true}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
          />
        </div>
      </Card>

      {/* Status Bar */}
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <StatusIndicator 
                status={isConnected ? 'connected' : 'disconnected'} 
                text={isConnected ? 'Live sync active' : 'Connecting...'}
                size="sm"
              />
              
              <Badge variant="outline" className="flex items-center space-x-1.5">
                <Users size={12} />
                <span className="text-sm font-medium">
                  {otherCursors.size + 1} participant{otherCursors.size !== 0 ? 's' : ''}
                </span>
              </Badge>
              
              <Badge variant="secondary" className="flex items-center space-x-1.5">
                <Activity size={12} />
                <span className="text-sm">Room: {roomId.slice(0, 8)}...</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Eye size={12} />
                <span>{content.length} characters</span>
              </div>
              {myPresence && (
                <div className="flex items-center space-x-1">
                  <Mouse size={12} />
                  <span>({myPresence.x}, {myPresence.y})</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Debug Panel - Premium Collapsible */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-muted/50 hover:bg-muted/80 rounded-lg border border-border/50 transition-colors">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Development Tools</span>
            <Badge variant="outline" className="ml-auto text-xs">Debug</Badge>
          </div>
        </summary>
        
        <Card className="mt-2 bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-foreground">Connection Status</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Status: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
                  <div>Session ID: {sessionId}</div>
                  <div>Storage Key: collab-{roomId}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium text-foreground">Activity Metrics</div>
                <div className="space-y-1 text-muted-foreground">
                  <div>Active Cursors: {otherCursors.size}</div>
                  <div>Content Length: {content.length}</div>
                  <div>My Position: {myPresence ? `${myPresence.x}, ${myPresence.y}` : 'None'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </details>
    </div>
  )
}

export default CollaborativeEditorWorking
