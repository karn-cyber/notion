"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2,
  Maximize2,
  Users,
  Smile
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useOthers, useMutation, useStorage } from '@liveblocks/react/suspense'

interface ChatMessage {
  id: string
  author: {
    id: string
    name: string
    avatar?: string
    color: string
  }
  content: string
  timestamp: number
  type: 'message' | 'system' | 'emoji'
}

interface CollaboratorChatProps {
  className?: string
}

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😊', '😂', '🎉', '🔥', '💯']

export default function CollaboratorChat({ className }: CollaboratorChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const others = useOthers()
  
  // Liveblocks real-time chat storage
  const chatMessages = useStorage((root) => {
    try {
      return root.chatMessages ? JSON.parse(root.chatMessages as string) : []
    } catch {
      return []
    }
  })

  const updateChatMessages = useMutation(({ storage }, messages: ChatMessage[]) => {
    storage.set('chatMessages', JSON.stringify(messages))
  }, [])
  
  // Helper function
  const generateId = () => Math.random().toString(36).substr(2, 9)
  
  // Generate stable color for user
  const userColor = React.useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
    const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
    let hash = 0
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }, [user])

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !user) return

    const message: ChatMessage = {
      id: generateId(),
      author: {
        id: user.id,
        name: user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
        avatar: user.imageUrl,
        color: userColor
      },
      content: newMessage.trim(),
      timestamp: Date.now(),
      type: 'message'
    }

    // Update real-time chat messages through Liveblocks
    const currentMessages = chatMessages || []
    updateChatMessages([...currentMessages, message])
    setNewMessage('')
  }, [newMessage, user, userColor, chatMessages, updateChatMessages])

  const sendEmoji = useCallback((emoji: string) => {
    if (!user) return

    const message: ChatMessage = {
      id: generateId(),
      author: {
        id: user.id,
        name: user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
        avatar: user.imageUrl,
        color: userColor
      },
      content: emoji,
      timestamp: Date.now(),
      type: 'emoji'
    }

    // Update real-time chat messages through Liveblocks
    const currentMessages = chatMessages || []
    updateChatMessages([...currentMessages, message])
    setShowEmojiPicker(false)
  }, [user, userColor, chatMessages, updateChatMessages])

  // Calculate collaborator count
  const collaboratorCount = others.length + 1 // +1 for current user

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Focus input when opening chat
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Chat button when closed
  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          onClick={() => {
            setIsOpen(true)
            setUnreadCount(0)
          }}
          className={cn(
            "relative h-14 w-14 rounded-full shadow-2xl",
            "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
            "border-2 border-white/20 backdrop-blur-sm",
            "transform transition-all duration-300 ease-out",
            "hover:scale-110 hover:shadow-3xl",
            "animate-[fadeIn_0.5s_ease-out]"
          )}
        >
          <MessageCircle size={24} className="text-white" />
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 text-xs bg-red-500 border-2 border-white animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-ping opacity-20" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <Card className={cn(
        "w-80 shadow-2xl border border-border/50 bg-background/95 backdrop-blur-md",
        "transform transition-all duration-300 ease-out",
        "animate-[fadeInUp_0.4s_ease-out]",
        isMinimized ? "h-16" : "h-96"
      )}>
        {/* Header */}
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                <MessageCircle size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Team Chat</h3>
                <p className="text-xs text-muted-foreground">
                  {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''} online
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 h-80 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
              {(chatMessages || []).map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 animate-[fadeIn_0.3s_ease-out]",
                    message.type === 'system' && "justify-center"
                  )}
                >
                  {message.type !== 'system' && (
                    <Avatar className="w-7 h-7 shrink-0">
                      {message.author.avatar && <AvatarImage src={message.author.avatar} />}
                      <AvatarFallback 
                        className="text-xs font-medium text-white"
                        style={{ backgroundColor: message.author.color }}
                      >
                        {message.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={cn(
                    "flex-1 min-w-0",
                    message.type === 'system' && "text-center"
                  )}>
                    {message.type === 'system' ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full text-xs text-muted-foreground">
                        <Users size={12} />
                        {message.content}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">{message.author.name}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                        </div>
                        <div className={cn(
                          "rounded-lg px-3 py-2 text-sm break-words",
                          message.author.id === user?.id 
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-4" 
                            : "bg-muted",
                          message.type === 'emoji' && "text-2xl py-1 bg-transparent"
                        )}>
                          {message.content}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-muted/30">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mb-2 p-2 bg-background border rounded-lg shadow-lg animate-[fadeIn_0.2s_ease-out]">
                  <div className="flex gap-1 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        onClick={() => sendEmoji(emoji)}
                        className="h-8 w-8 p-0 text-lg hover:scale-110 transition-transform"
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="h-8 w-8 p-0"
                >
                  <Smile size={16} />
                </Button>
                
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
