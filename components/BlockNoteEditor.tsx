"use client"

import "@blocknote/core/fonts/inter.css"
import "@blocknote/shadcn/style.css"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/shadcn"
import { useCallback, useEffect, useState } from "react"

// will make a chat/comment feature too 
interface BlockNoteEditorProps {
  roomId: string
  initialContent: string
  onContentChange: (content: string) => void
  userName: string
  userColor: string
}

interface CursorData {
  id: string
  name: string
  color: string
  position: { x: number; y: number }
  timestamp: number
}

export default function BlockNoteEditor({
  roomId,
  initialContent,
  onContentChange,
  userName,
  userColor
}: BlockNoteEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [cursors, setCursors] = useState<CursorData[]>([])

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: initialContent ? JSON.parse(initialContent || "[]") : undefined,
  })

  // Handle content changes
  const handleChange = useCallback(() => {
    const content = JSON.stringify(editor.document)
    onContentChange(content)
    
    // Broadcast content change for cross-tab sync
    localStorage.setItem(`editor-content-${roomId}`, content)
    window.dispatchEvent(new StorageEvent('storage', {
      key: `editor-content-${roomId}`,
      newValue: content
    }))
  }, [editor, onContentChange, roomId])

  // Listen for cross-tab content changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `editor-content-${roomId}` && e.newValue) {
        try {
          const newContent = JSON.parse(e.newValue)
          editor.replaceBlocks(editor.document, newContent)
        } catch (error) {
          console.error('Error syncing content:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [roomId, editor])

  // Cursor tracking for collaboration
  useEffect(() => {
    const sessionId = `user-${Date.now()}-${Math.random()}`
    
    const broadcastCursor = (x: number, y: number) => {
      const cursorData = {
        id: sessionId,
        name: userName,
        color: userColor,
        position: { x, y },
        timestamp: Date.now()
      }
      
      localStorage.setItem(`cursor-${roomId}-${sessionId}`, JSON.stringify(cursorData))
      window.dispatchEvent(new StorageEvent('storage', {
        key: `cursor-${roomId}-${sessionId}`,
        newValue: JSON.stringify(cursorData)
      }))
    }

    const handleMouseMove = (e: MouseEvent) => {
      broadcastCursor(e.clientX, e.clientY)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith(`cursor-${roomId}-`) && e.newValue) {
        try {
          const cursorData = JSON.parse(e.newValue)
          setCursors(prev => {
            const filtered = prev.filter(c => c.id !== cursorData.id)
            return [...filtered, cursorData]
          })
        } catch (error) {
          console.error('Error parsing cursor data:', error)
        }
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('storage', handleStorageChange)

    // Cleanup old cursors
    const cleanup = setInterval(() => {
      setCursors(prev => prev.filter(c => Date.now() - c.timestamp < 10000))
    }, 5000)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(cleanup)
      localStorage.removeItem(`cursor-${roomId}-${sessionId}`)
    }
  }, [roomId, userName, userColor])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-96 bg-background border rounded-lg flex items-center justify-center">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Collaborative cursors */}
      {cursors.map((cursor) => (
        <div
          key={cursor.id}
          className="fixed pointer-events-none z-50 transition-all duration-200"
          style={{
            left: cursor.position.x,
            top: cursor.position.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-sm"
          >
            <path
              d="M5 3L19 12L12 14L10 21L5 3Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <div
            className="absolute top-5 left-2 px-2 py-1 text-xs text-white rounded shadow-lg pointer-events-none whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}

      {/* BlockNote Editor */}
      <div className="bg-background border rounded-lg overflow-hidden">
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
          className="min-h-96"
        />
      </div>
    </div>
  )
}
