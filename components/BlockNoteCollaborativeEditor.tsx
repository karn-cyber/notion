"use client"
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import { PartialBlock } from "@blocknote/core"
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Loader2 } from 'lucide-react'
import { 
  useOthers, 
  useMyPresence, 
  useMutation,
  useStorage
} from '@liveblocks/react/suspense'

// Import Mantine styles for BlockNote
import "@blocknote/core/fonts/inter.css"
import "@blocknote/mantine/style.css"

interface BlockNoteCollaborativeEditorProps {
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
      className="absolute z-50 pointer-events-none transition-all duration-75 ease-out"
      style={{
        left: x,
        top: y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Large Cursor pointer with shadow */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="relative drop-shadow-lg"
      >
        <path
          d="M7.5 16.5H7.1L6.8 16.7L2 21V2L18 16.5H7.5Z"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
        <path
          d="M7.5 16.5H7.1L6.8 16.7L2 21V2L18 16.5H7.5Z"
          fill={color}
          opacity="0.8"
        />
      </svg>
      
      {/* Enhanced Name label with better styling */}
      <div 
        className="absolute top-8 left-4 px-3 py-2 text-sm font-semibold text-white rounded-lg shadow-xl whitespace-nowrap border-2 border-white/20 backdrop-blur-sm"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 8px 32px ${color}40, 0 4px 16px rgba(0,0,0,0.3)`
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full bg-white/80 animate-pulse"
            style={{ animationDuration: isTyping ? '0.8s' : '2s' }}
          />
          {name}
          {isTyping && (
            <span className="ml-1 text-white/90 animate-bounce">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </span>
          )}
        </div>
      </div>
      
      {/* Animated glow ring */}
      <div 
        className="absolute -inset-2 rounded-full opacity-40 animate-ping"
        style={{ 
          backgroundColor: color,
          filter: 'blur(8px)',
          animationDuration: '2s'
        }}
      />
      
      {/* Subtle pulse ring for active state */}
      <div 
        className="absolute -inset-1 rounded-full opacity-20 animate-pulse"
        style={{ 
          backgroundColor: color,
          filter: 'blur(4px)',
          animationDuration: isTyping ? '0.5s' : '1.5s'
        }}
      />
    </div>
  )
}

// Helper function to format time as HH:MM
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

export default function BlockNoteCollaborativeEditor({
  initialContent,
  onContentChange,
  userName,
  userColor
}: BlockNoteCollaborativeEditorProps) {
  const [myPresence, updateMyPresence] = useMyPresence()
  const others = useOthers()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Liveblocks mutations for collaborative content
  const updateContent = useMutation(({ storage }, newContent: string) => {
    storage.set('content', newContent)
  }, [])

  const updateBlocks = useMutation(({ storage }, blocks: PartialBlock[]) => {
    storage.set('blocks', JSON.stringify(blocks))
  }, [])

  const storedBlocks = useStorage((root) => {
    try {
      return root.blocks ? JSON.parse(root.blocks as string) : []
    } catch {
      return []
    }
  })

  // Initialize BlockNote editor with enhanced real-time collaboration
  const editor = useCreateBlockNote({
    initialContent: storedBlocks.length > 0 ? storedBlocks : (
      initialContent ? [{ type: "paragraph", content: initialContent }] : undefined
    ),
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
    }
  })

  // Track active typers with proper user identification
  const activeTypers = useMemo(() => {
    return others
      .filter(other => other.presence?.isTyping && other.presence?.name)
      .map(other => other.presence?.name || 'Anonymous')
      .filter(name => name !== 'Anonymous')
  }, [others])

  // Calculate total users correctly (current user + others)
  const totalUsers = useMemo(() => {
    return 1 + others.length
  }, [others])

  // Connection status and initialization
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsInitializing(false)
    }, 1500)
    return () => clearTimeout(initTimer)
  }, [])

  // Enhanced real-time content synchronization with instant updates
  const isUpdatingRef = useRef(false)
  const lastFirebaseUpdateRef = useRef(0)
  
  const handleContentChange = useCallback(async () => {
    if (!editor || isUpdatingRef.current) return

    // Don't process changes if command menus are open
    const hasActiveMenu = document.querySelector('.bn-suggestion-menu, .bn-formatting-toolbar, .bn-side-menu')
    if (hasActiveMenu) return

    isUpdatingRef.current = true

    try {
      const blocks = editor.document
      
      // Convert blocks to markdown for Firebase storage
      const markdown = await editor.blocksToMarkdownLossy(blocks)
      
      // Immediate Liveblocks update for real-time sync
      updateBlocks(blocks)
      updateContent(markdown)
      
      // Debounced Firebase save to reduce server calls
      const now = Date.now()
      if (now - lastFirebaseUpdateRef.current > 1000) {
        lastFirebaseUpdateRef.current = now
        onContentChange(markdown)
        setLastSaved(new Date())
      }

      // Update typing status immediately (but only if no menus are open)
      if (!hasActiveMenu) {
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
        }, 1500)
      }
    } finally {
      isUpdatingRef.current = false
    }
  }, [editor, updateBlocks, updateContent, onContentChange, updateMyPresence, myPresence.cursor, userName, userColor])

  // Real-time document synchronization with command menu awareness
  useEffect(() => {
    if (!editor) return

    // Subscribe to document changes with command menu awareness
    const unsubscribe = editor.onChange(() => {
      // Don't process changes immediately if command menus are open
      const hasActiveMenu = document.querySelector('.bn-suggestion-menu, .bn-formatting-toolbar, .bn-side-menu')
      
      if (hasActiveMenu) {
        // Delay the update if menus are active
        setTimeout(() => {
          handleContentChange()
        }, 500)
      } else {
        // Immediate update for normal typing
        handleContentChange()
      }
    })

    return unsubscribe
  }, [editor, handleContentChange])

  // Simplified keyboard event handling for typing feedback
  useEffect(() => {
    if (!editor) return

    // Simple typing status updates without interfering with editor
    const updateTypingStatus = (isTyping: boolean) => {
      updateMyPresence({
        cursor: myPresence.cursor,
        name: userName,
        color: userColor,
        isTyping,
        lastSeen: Date.now()
      })
    }

    // Use a debounced approach that doesn't interfere with command menus
    let typingTimeout: NodeJS.Timeout

    const handleTyping = () => {
      // Don't interfere if command menus are open
      const hasActiveMenu = document.querySelector('.bn-suggestion-menu, .bn-formatting-toolbar, .bn-side-menu')
      if (hasActiveMenu) return

      updateTypingStatus(true)
      clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => {
        updateTypingStatus(false)
      }, 2000)
    }

    // Listen to editor changes instead of DOM mutations
    const unsubscribe = editor.onChange(() => {
      handleTyping()
    })

    return () => {
      unsubscribe()
      clearTimeout(typingTimeout)
    }
  }, [editor, updateMyPresence, myPresence.cursor, userName, userColor])

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

  // Sync incoming changes from other users - CRITICAL for collaboration
  useEffect(() => {
    if (!editor || !storedBlocks || storedBlocks.length === 0 || isUpdatingRef.current) return

    // Don't sync if user is actively interacting with command menus
    const hasActiveMenu = document.querySelector('.bn-suggestion-menu, .bn-formatting-toolbar, .bn-side-menu')
    if (hasActiveMenu) return

    // Get current editor content
    const currentBlocks = editor.document

    // Check if the stored blocks are different from current content
    const storedBlocksString = JSON.stringify(storedBlocks)
    const currentBlocksString = JSON.stringify(currentBlocks)

    if (storedBlocksString !== currentBlocksString) {
      // Set flag to prevent infinite loops
      isUpdatingRef.current = true
      
      try {
        // Use a more gentle update approach to avoid breaking command menus
        setTimeout(() => {
          try {
            // Replace editor content with incoming changes
            editor.replaceBlocks(editor.document, storedBlocks)
          } catch (error) {
            console.warn('Failed to sync incoming changes:', error)
          } finally {
            // Reset flag after a short delay
            setTimeout(() => {
              isUpdatingRef.current = false
            }, 300)
          }
        }, 100)
      } catch (error) {
        console.warn('Failed to schedule sync:', error)
        isUpdatingRef.current = false
      }
    }
  }, [editor, storedBlocks])

  // Enhanced mouse tracking for live cursors
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const editorContainer = document.querySelector('.ProseMirror')?.parentElement
      if (!editorContainer) return

      const rect = editorContainer.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Only update if mouse is within editor bounds
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        updateMyPresence({
          cursor: { x, y },
          name: userName,
          color: userColor,
          isTyping: myPresence.isTyping,
          lastSeen: Date.now()
        })
      }
    }

    const handleMouseLeave = () => {
      updateMyPresence({
        cursor: null,
        name: userName,
        color: userColor,
        isTyping: myPresence.isTyping,
        lastSeen: Date.now()
      })
    }

    // Add event listeners to the editor container
    const editorContainer = document.querySelector('.ProseMirror')?.parentElement
    if (editorContainer) {
      editorContainer.addEventListener('mousemove', handleMouseMove)
      editorContainer.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        editorContainer.removeEventListener('mousemove', handleMouseMove)
        editorContainer.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [updateMyPresence, userName, userColor, myPresence.isTyping])

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
                {totalUsers > 0 ? (
                  <>
                    <span className="hidden sm:inline">
                      {totalUsers} collaborator{totalUsers !== 1 ? 's' : ''} online
                    </span>
                    <span className="sm:hidden">
                      {totalUsers}
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
              {lastSaved && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-none truncate hidden sm:block">
                  Last saved at {formatTime(lastSaved)}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons - Ultra-compact for small screens */}
          <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2 shrink-0">
            {isInitializing ? (
              <Badge 
                variant="secondary" 
                className="text-xs px-1 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              >
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                <span className="hidden sm:inline">Connecting...</span>
                <span className="sm:hidden">•••</span>
              </Badge>
            ) : (
              <Badge 
                variant="secondary" 
                className="text-xs px-1 sm:px-3 py-0.5 sm:py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800"
              >
                <span className="hidden sm:inline">Live</span>
                <span className="sm:hidden w-2 h-2 bg-green-500 rounded-full"></span>
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className="text-xs px-1 sm:px-3 py-0.5 sm:py-1"
            >
              <span className="hidden sm:inline">Collaborative</span>
              <span className="sm:hidden text-blue-500">🤝</span>
            </Badge>
          </div>
        </div>
      </div>

      {/* BlockNote Editor - Clean without interference */}
      <div className="relative h-full overflow-hidden bg-background">
        <div className="h-full w-full">
          <BlockNoteView
            editor={editor}
            onChange={handleContentChange}
            theme="light"
            className="h-full min-h-[500px] w-full overflow-hidden"
          />
        </div>
        
        {/* Live Cursors - Enhanced positioning */}
        {others.map((other) => {
          if (!other.presence?.cursor) return null
          
          return (
            <LiveCursor
              key={other.connectionId}
              x={other.presence.cursor.x}
              y={other.presence.cursor.y}
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
