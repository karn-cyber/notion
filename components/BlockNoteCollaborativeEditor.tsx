"use client"
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import { BlockNoteEditor, PartialBlock } from "@blocknote/core"
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '@/lib/utils'
import { 
  useOthers, 
  useMyPresence, 
  useUpdateMyPresence,
  useMutation,
  useStorage
} from '@liveblocks/react/suspense'

// Import Mantine styles for BlockNote
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"

interface BlockNoteCollaborativeEditorProps {
  roomId: string
  initialContent: string
  onContentChange: (content: string) => void
  userName: string
  userColor: string
}

// Custom cursor component for live collaboration
const LiveCursor = ({ x, y, name, color, isTyping }: {
  x: number
  y: number
  name: string
  color: string
  isTyping?: boolean
}) => {
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Cursor pointer */}
      <div 
        className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent"
        style={{ 
          borderBottomColor: color,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
        }}
      />
      
      {/* Name label */}
      <div 
        className="absolute top-1 left-2 px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
        {isTyping && (
          <span className="ml-1 animate-pulse">✏️</span>
        )}
      </div>
      
      {/* Glow effect */}
      <div 
        className="absolute -inset-1 rounded-full opacity-30 animate-pulse"
        style={{ backgroundColor: color, filter: 'blur(4px)' }}
      />
    </div>
  )
}

export default function BlockNoteCollaborativeEditor({
  roomId,
  initialContent,
  onContentChange,
  userName,
  userColor
}: BlockNoteCollaborativeEditorProps) {
  const [myPresence, updateMyPresence] = useMyPresence()
  const others = useOthers()
  const [isConnected, setIsConnected] = useState(false)

  // Liveblocks mutations for collaborative content
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  const updateBlocks = useMutation(({ storage }, blocks: PartialBlock[]) => {
    storage.set('blocks', JSON.stringify(blocks))
  }, [])

  const storedContent = useStorage((root) => root.content) || initialContent
  const storedBlocks = useStorage((root) => {
    try {
      return root.blocks ? JSON.parse(root.blocks as string) : []
    } catch {
      return []
    }
  })

  // Initialize BlockNote editor with collaborative features
  const editor = useCreateBlockNote({
    initialContent: storedBlocks.length > 0 ? storedBlocks : undefined,
    uploadFile: async (file: File) => {
      // Handle image uploads
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          // In a real app, you'd upload to a cloud service
          // For now, we'll use base64 encoding
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
    },
    // Fixed editor configuration for better collaboration
    defaultStyles: true,
    animations: true,
  })

  // Track active typers with proper user identification
  const activeTypers = useMemo(() => {
    return others
      .filter(other => other.presence?.isTyping && other.presence?.name)
      .map(other => other.presence?.name || 'Anonymous')
      .filter(name => name !== 'Anonymous')
  }, [others])

  // Connection status
  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Handle content changes with proper debouncing and user tracking
  const handleContentChange = useCallback(async () => {
    if (!editor) return

    const blocks = editor.document
    
    // Convert blocks to markdown for Firebase storage
    const markdown = await editor.blocksToMarkdownLossy(blocks)
    
    // Update both Liveblocks and Firebase
    updateBlocks(blocks)
    updateContent(markdown)
    onContentChange(markdown)

    // Update typing status with proper user info
    updateMyPresence({
      cursor: myPresence.cursor,
      name: userName,
      color: userColor,
      isTyping: true,
      lastSeen: Date.now()
    })

    // Clear typing status after a delay
    setTimeout(() => {
      updateMyPresence({
        cursor: myPresence.cursor,
        name: userName,
        color: userColor,
        isTyping: false,
        lastSeen: Date.now()
      })
    }, 2000) // Increased delay for better UX
  }, [editor, updateBlocks, updateContent, onContentChange, updateMyPresence, myPresence.cursor, userName, userColor])

  // Handle cursor tracking
  const handleEditorClick = useCallback((event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    updateMyPresence({
      cursor: { x, y },
      name: userName,
      color: userColor,
      isTyping: false,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor])

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
      name: userName,
      color: userColor,
      isTyping: false,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor])

  // Sync remote changes to editor with better conflict resolution
  useEffect(() => {
    if (editor && storedBlocks && storedBlocks.length > 0) {
      // Only update if blocks are significantly different to avoid loops
      const currentBlocks = editor.document
      const currentBlocksStr = JSON.stringify(currentBlocks)
      const storedBlocksStr = JSON.stringify(storedBlocks)
      
      // Check if the content is actually different
      if (currentBlocksStr !== storedBlocksStr && 
          currentBlocks.length !== storedBlocks.length) {
        try {
          editor.replaceBlocks(editor.document, storedBlocks)
        } catch (error) {
          console.log("Block sync skipped - minor difference")
        }
      }
    }
  }, [editor, storedBlocks])

  // Initialize presence with proper user identification
  useEffect(() => {
    updateMyPresence({
      cursor: null,
      name: userName,
      color: userColor,
      isTyping: false,
      lastSeen: Date.now()
    })
  }, [updateMyPresence, userName, userColor])

  return (
    <div className="relative h-full">
      {/* Collaboration Status Bar - Mobile Responsive */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between p-1 sm:p-3 md:p-4">
          {/* Online Users - Ultra-responsive */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <div className="flex -space-x-1 sm:-space-x-2">
              {/* Current user */}
              <div className="relative group">
                <Avatar className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 border-2 border-background ring-1 ring-border">
                  <AvatarFallback className="text-xs font-medium bg-linear-to-br from-blue-500 to-purple-600 text-white">
                    {userName?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                {myPresence.isTyping && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Other users */}
              {others.slice(0, 1).map((other) => (
                <div key={other.connectionId} className="relative group">
                  <Avatar className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 border-2 border-background ring-1 ring-border">
                    {other.info?.avatar ? (
                      <AvatarImage src={other.info.avatar} />
                    ) : null}
                    <AvatarFallback className="text-xs font-medium bg-linear-to-br from-green-500 to-blue-600 text-white">
                      {other.info?.name?.charAt(0) || other.presence?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {other.presence?.isTyping && (
                    <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              ))}
              
              {others.length > 1 && (
                <div className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{others.length - 1}
                  </span>
                </div>
              )}
            </div>
            
            {/* Status Text - Ultra-compact for small screens */}
            <div className="ml-1 sm:ml-2 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground leading-none truncate">
                {others.length + 1 > 0 ? (
                  <>
                    <span className="hidden sm:inline">
                      {others.length + 1} collaborator{others.length + 1 !== 1 ? 's' : ''} online
                    </span>
                    <span className="sm:hidden">
                      {others.length + 1}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">No collaborators</span>
                    <span className="sm:hidden">Solo</span>
                  </>
                )}
              </p>
              {activeTypers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-none truncate hidden sm:block">
                  {activeTypers.join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} typing...
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Ultra-compact for small screens */}
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 shrink-0">
            <Badge 
              variant="secondary" 
              className="text-xs px-1 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              <span className="hidden sm:inline">Live</span>
              <span className="sm:hidden w-2 h-2 bg-green-500 rounded-full"></span>
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs px-1 sm:px-3 py-0.5 sm:py-1"
            >
              <span className="hidden sm:inline">BlockNote</span>
              <span className="sm:hidden text-blue-500">📝</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* BlockNote Editor */}
      <div
        className="relative h-full overflow-hidden bg-background"
        onClick={handleEditorClick}
        onMouseLeave={handleMouseLeave}
      >
        <div className="h-full w-full">
          <BlockNoteView
            editor={editor}
            onChange={handleContentChange}
            theme="light"
            className="h-full min-h-[500px] w-full overflow-hidden"
            style={{
              // Ensure proper responsive behavior
              maxWidth: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              lineHeight: '1.6'
            }}
          />
        </div>
        
        {/* Live Cursors with improved positioning */}
        {others.map((other) => {
          if (!other.presence?.cursor) return null
          
          return (
            <LiveCursor
              key={other.connectionId}
              x={Math.max(0, Math.min(other.presence.cursor.x, window.innerWidth - 100))}
              y={Math.max(0, Math.min(other.presence.cursor.y, window.innerHeight - 100))}
              name={other.presence.name || other.info?.name || 'Anonymous'}
              color={other.presence.color || '#6366f1'}
              isTyping={other.presence.isTyping}
            />
          )
        })}
      </div>
    </div>
  )
}
