"use client"
import React, { useCallback, useEffect, useState } from 'react'
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
import { 
  useMyPresence, 
  useOthers, 
  useMutation, 
  useStorage,
  useSelf,
  useRoom
} from '@/lib/liveblocks'

interface LiveCollaborativeEditorProps {
  roomId: string
  initialContent: string
  onContentChange?: (content: string) => void
  userName: string
  userColor: string
}

// Premium cursor component with enhanced animations
function PremiumCursor({ x, y, name, color, isTyping }: { 
  x: number; 
  y: number; 
  name: string; 
  color: string; 
  isTyping?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-100 ease-out"
      style={{ 
        left: x - 12, 
        top: y - 12,
        transform: 'translate3d(0, 0, 0)' // Force hardware acceleration
      }}
    >
      <div className="relative">
        {/* Cursor SVG with enhanced styling and glow effect */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg filter">
          <defs>
            <filter id={`glow-${name}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/> 
              </feMerge>
            </filter>
          </defs>
          <path
            d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            className="filter drop-shadow-sm"
            filter={`url(#glow-${name})`}
          />
        </svg>
        
        {/* User name badge with premium styling and animation */}
        <div
          className={cn(
            "absolute top-5 left-2 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap shadow-lg border border-white/20 backdrop-blur-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-200",
            isTyping && "animate-pulse"
          )}
          style={{ backgroundColor: color }}
        >
          <div className="flex items-center space-x-1">
            <div 
              className={cn(
                "w-1.5 h-1.5 bg-white/80 rounded-full",
                isTyping ? "animate-ping" : "animate-pulse"
              )}
              style={{ animationDuration: isTyping ? '1s' : '2s' }}
            ></div>
            <span className="font-medium text-shadow-sm">
              {name}
              {isTyping && " is typing..."}
            </span>
          </div>
        </div>
        
        {/* Cursor trail effect - more active when typing */}
        <div 
          className={cn(
            "absolute -inset-1 bg-gradient-radial from-transparent to-transparent opacity-20 rounded-full",
            isTyping ? "animate-ping" : "animate-pulse"
          )}
          style={{ 
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            animationDuration: isTyping ? '0.8s' : '1.5s'
          }}
        />
      </div>
    </div>
  )
}

function LiveCollaborativeEditor({ 
  roomId, 
  initialContent, 
  onContentChange, 
  userName, 
  userColor 
}: LiveCollaborativeEditorProps) {
  const room = useRoom()
  const [myPresence, updateMyPresence] = useMyPresence()
  const others = useOthers()
  const self = useSelf()
  const content = useStorage((root) => root.content) || initialContent
  
  const [localContent, setLocalContent] = useState(content)
  const [isConnected, setIsConnected] = useState(false)
  
  // Update content in Liveblocks
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  // Check connection status
  useEffect(() => {
    if (room) {
      // Use the room status observable for connection status
      const handleConnectionChange = (status: any) => {
        setIsConnected(status === "connected")
      }
      
      // Subscribe to status events
      const unsubscribe = room.events.status.subscribe(handleConnectionChange)
      
      // Initial status
      setIsConnected(room.getStatus() === "connected")
      
      return unsubscribe
    }
  }, [room])

  // Handle mouse movement for cursor tracking with throttling
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Only update if cursor moved significantly (reduces network calls)
    updateMyPresence({
      cursor: { x, y },
      name: userName,
      color: userColor,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor])

  // Handle mouse leave with fade out
  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ 
      cursor: null,
      name: userName,
      color: userColor,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor])

  // Handle focus events for better presence tracking
  const handleFocus = useCallback(() => {
    updateMyPresence({
      cursor: myPresence.cursor,
      name: userName,
      color: userColor,
      isTyping: true,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor, myPresence.cursor])

  const handleBlur = useCallback(() => {
    updateMyPresence({
      cursor: myPresence.cursor,
      name: userName,
      color: userColor,
      isTyping: false,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor, myPresence.cursor])

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    updateContent(newContent)
    onContentChange?.(newContent)
  }, [updateContent, onContentChange])

  // Sync local content with Liveblocks content
  useEffect(() => {
    if (content !== undefined && content !== localContent) {
      setLocalContent(content)
      onContentChange?.(content)
    }
  }, [content, localContent, onContentChange])

  // Set initial presence
  useEffect(() => {
    updateMyPresence({
      cursor: null,
      name: userName,
      color: userColor
    })
  }, [updateMyPresence, userName, userColor])

  return (
    <div className="relative h-full">
      {/* Collaboration status bar - Mobile Responsive */}
      <Card className="mb-4">
        <CardContent className="p-1 sm:p-3">
          {/* Ultra Compact Layout for mobile screens */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="text-xs text-muted-foreground truncate">
                  {isConnected ? 'Live' : 'Off'} • {others.length + 1}
                </span>
              </div>
              
              <div className="flex items-center space-x-1 shrink-0">
                <div className="flex items-center -space-x-1">
                  <UserAvatar
                    name={userName}
                    color={userColor}
                    size="sm"
                    className="w-5 h-5 ring-1 ring-primary"
                  />
                  {others.slice(0, 1).map((other) => (
                    <UserAvatar
                      key={other.connectionId}
                      name={other.presence?.name || 'Anonymous'}
                      color={other.presence?.color || '#6366f1'}
                      size="sm"
                      className="w-5 h-5 ring-1 ring-background"
                    />
                  ))}
                  {others.length > 1 && (
                    <div className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center ring-1 ring-background">
                      +{others.length - 1}
                    </div>
                  )}
                </div>
                {others.some(other => other.presence?.isTyping) && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <StatusIndicator 
                status={isConnected ? 'connected' : 'disconnected'} 
                text={isConnected ? 'Live Collaboration' : 'Connecting...'} 
                size="sm"
              />
              
              <div className="flex items-center -space-x-2">
                <UserAvatar
                  name={userName}
                  color={userColor}
                  size="sm"
                  showStatus={true}
                  status="online"
                  className="ring-2 ring-primary border-2 border-background"
                />
                
                {others.slice(0, 4).map((other) => (
                  <UserAvatar
                    key={other.connectionId}
                    name={other.presence?.name || 'Anonymous'}
                    color={other.presence?.color || '#6366f1'}
                    size="sm"
                    showStatus={true}
                    status="online"
                    className="ring-2 ring-background"
                  />
                ))}
                
                {others.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{others.length - 4}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users size={16} />
                <span>{others.length + 1} collaborator{others.length === 0 ? '' : 's'}</span>
              </div>
              
              {others.some(other => other.presence?.isTyping) && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>
                    {others.filter(other => other.presence?.isTyping).map(other => other.presence?.name || 'Someone').slice(0, 2).join(', ')} 
                    {' '}typing...
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main editor area */}
      <Card className="h-full">
        <CardContent className="p-0 relative h-full">
          <div
            className="relative h-full overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Text editor */}
            <textarea
              className="w-full h-full p-6 border-none outline-none resize-none bg-transparent text-foreground"
              value={localContent}
              onChange={handleContentChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Start typing your document..."
              style={{ minHeight: '500px' }}
            />
            
            {/* Other users' cursors */}
            {others.map((other) => {
              if (!other.presence?.cursor) return null
              
              return (
                <PremiumCursor
                  key={other.connectionId}
                  x={other.presence.cursor.x}
                  y={other.presence.cursor.y}
                  name={other.presence.name || 'Anonymous'}
                  color={other.presence.color || '#6366f1'}
                  isTyping={other.presence.isTyping}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LiveCollaborativeEditor
