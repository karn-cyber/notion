"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'
import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  Send, 
  X, 
  Reply,
  Trash2,
  Check,
  XIcon
} from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface Comment {
  id: string
  x: number
  y: number
  author: {
    id: string
    name: string
    avatar?: string
    color: string
  }
  content: string
  timestamp: number
  replies: Reply[]
  resolved: boolean
}

interface Reply {
  id: string
  author: {
    id: string
    name: string
    avatar?: string
    color: string
  }
  content: string
  timestamp: number
}

interface CommentBubbleProps {
  comment: Comment
  isActive: boolean
  onClick: () => void
  className?: string
}

function CommentBubble({ comment, isActive, onClick, className }: CommentBubbleProps) {
  return (
    <div
      className={cn(
        "cursor-pointer transition-all duration-200",
        "transform hover:scale-110",
        isActive ? "animate-pulse" : "animate-[fadeIn_0.3s_ease-out]",
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "relative flex items-center justify-center",
        "w-8 h-8 rounded-full border-2 border-white shadow-lg",
        "transition-all duration-200 hover:shadow-xl",
        comment.resolved 
          ? "bg-green-500 border-green-600" 
          : "bg-blue-500 border-blue-600"
      )}>
        <MessageCircle size={16} className="text-white" />
        
        {/* Comment count badge */}
        {comment.replies.length > 0 && (
          <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs bg-red-500 border-white">
            {comment.replies.length + 1}
          </Badge>
        )}
        
        {/* Pulse ring for new comments */}
        {!comment.resolved && (
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
        )}
      </div>
    </div>
  )
}

interface CommentPanelProps {
  comment: Comment
  onClose: () => void
  onReply: (content: string) => void
  onResolve: () => void
  onDelete: () => void
  style?: React.CSSProperties
  className?: string
}

function CommentPanel({ comment, onClose, onReply, onResolve, onDelete, style, className }: CommentPanelProps) {
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  
  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent.trim())
      setReplyContent('')
      setIsReplying(false)
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={cn(
      "absolute z-50 w-80 max-h-96 overflow-hidden",
      "shadow-2xl border border-border/50 bg-background/95 backdrop-blur-sm",
      "animate-[fadeInUp_0.3s_ease-out]",
      className
    )} style={style}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              {comment.author.avatar && <AvatarImage src={comment.author.avatar} />}
              <AvatarFallback 
                className="text-xs font-medium text-white"
                style={{ backgroundColor: comment.author.color }}
              >
                {comment.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{comment.author.name}</p>
              <p className="text-xs text-muted-foreground">{formatTime(comment.timestamp)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!comment.resolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResolve}
                className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-600"
              >
                <Check size={12} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X size={12} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Main Comment */}
        <div className="p-2 bg-muted/30 rounded-md">
          <p className="text-sm">{comment.content}</p>
        </div>
        
        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2 p-2 bg-muted/20 rounded-md">
                <Avatar className="w-5 h-5 shrink-0">
                  {reply.author.avatar && <AvatarImage src={reply.author.avatar} />}
                  <AvatarFallback 
                    className="text-xs font-medium text-white"
                    style={{ backgroundColor: reply.author.color }}
                  >
                    {reply.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium">{reply.author.name}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(reply.timestamp)}</p>
                  </div>
                  <p className="text-sm">{reply.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reply Input */}
        {isReplying ? (
          <div className="flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              autoFocus
            />
            <Button size="sm" onClick={handleReply} className="h-8 w-8 p-0">
              <Send size={12} />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsReplying(false)}
              className="h-8 w-8 p-0"
            >
              <XIcon size={12} />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReplying(true)}
            className="w-full h-8 text-xs"
          >
            <Reply size={12} className="mr-1" />
            Reply
          </Button>
        )}
        
        {comment.resolved && (
          <Badge variant="success" className="w-full justify-center">
            <Check size={12} className="mr-1" />
            Resolved
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

interface ContextMenuProps {
  onAddComment: () => void
  onClose: () => void
}

function ContextMenu({ onAddComment, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={menuRef} className="animate-[fadeIn_0.2s_ease-out]">
      <Card className="w-48 py-1 shadow-lg border border-border/50 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-0">
          <Button
            variant="ghost"
            className="w-full justify-start px-3 py-2 h-auto text-sm font-normal"
            onClick={onAddComment}
          >
            <MessageCircle size={14} className="mr-2" />
            Add Comment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

interface CommentSystemProps {
  className?: string
}

export default function CommentSystem({ className }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [showNewCommentInput, setShowNewCommentInput] = useState<{ x: number; y: number } | null>(null)
  const [newCommentContent, setNewCommentContent] = useState('')
  const { user } = useUser()
  
  const generateId = () => Math.random().toString(36).substr(2, 9)
  
  const userColor = React.useMemo(() => {
    const colors = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
    const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'
    let hash = 0
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }, [user])

  const handleRightClick = useCallback((event: React.MouseEvent) => {
    // Only handle right-clicks, let other events pass through
    if (event.button !== 2) return
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
    setActiveCommentId(null)
  }, [])

  const handleAddComment = useCallback(() => {
    if (contextMenu) {
      setShowNewCommentInput({ x: contextMenu.x, y: contextMenu.y })
      setContextMenu(null)
    }
  }, [contextMenu])

  const handleCreateComment = useCallback(() => {
    if (newCommentContent.trim() && showNewCommentInput && user) {
      const newComment: Comment = {
        id: generateId(),
        x: showNewCommentInput.x,
        y: showNewCommentInput.y,
        author: {
          id: user.id,
          name: user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
          avatar: user.imageUrl,
          color: userColor
        },
        content: newCommentContent.trim(),
        timestamp: Date.now(),
        replies: [],
        resolved: false
      }
      
      setComments(prev => [...prev, newComment])
      setNewCommentContent('')
      setShowNewCommentInput(null)
    }
  }, [newCommentContent, showNewCommentInput, user, userColor])

  const handleReply = useCallback((commentId: string, content: string) => {
    if (user) {
      const reply: Reply = {
        id: generateId(),
        author: {
          id: user.id,
          name: user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
          avatar: user.imageUrl,
          color: userColor
        },
        content,
        timestamp: Date.now()
      }
      
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, replies: [...c.replies, reply] }
          : c
      ))
    }
  }, [user, userColor])

  const handleResolveComment = useCallback((commentId: string) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, resolved: true } : c
    ))
    setActiveCommentId(null)
  }, [])

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    setActiveCommentId(null)
  }, [])

  const activeComment = comments.find(c => c.id === activeCommentId)

  return (
    <div 
      className={cn("relative h-full w-full", className)}
      onContextMenu={handleRightClick}
      style={{ 
        pointerEvents: 'none', // Don't interfere with normal clicks
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Enable pointer events only for the context menu listener */}
      <div 
        className="absolute inset-0"
        style={{ pointerEvents: 'auto' }}
        onContextMenu={handleRightClick}
        onMouseDown={(e) => {
          // Only handle right mouse button
          if (e.button === 2) {
            e.stopPropagation()
          }
        }}
      />
      {/* Comment Bubbles */}
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="absolute z-50"
          style={{
            left: comment.x,
            top: comment.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto' // Enable clicks on comment bubbles
          }}
        >
          <CommentBubble
            comment={comment}
            isActive={activeCommentId === comment.id}
            onClick={() => setActiveCommentId(
              activeCommentId === comment.id ? null : comment.id
            )}
          />
        </div>
      ))}
      
      {/* Active Comment Panel */}
      {activeComment && (
        <div
          className="absolute z-50"
          style={{
            left: Math.min(activeComment.x + 20, window.innerWidth - 340),
            top: Math.min(activeComment.y, window.innerHeight - 400),
            pointerEvents: 'auto'
          }}
        >
          <CommentPanel
            comment={activeComment}
            onClose={() => setActiveCommentId(null)}
            onReply={(content) => handleReply(activeComment.id, content)}
            onResolve={() => handleResolveComment(activeComment.id)}
            onDelete={() => handleDeleteComment(activeComment.id)}
          />
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            pointerEvents: 'auto'
          }}
        >
          <ContextMenu
            onAddComment={handleAddComment}
            onClose={() => setContextMenu(null)}
          />
        </div>
      )}
      
      {/* New Comment Input */}
      {showNewCommentInput && (
        <div
          className="absolute z-50"
          style={{
            left: Math.min(showNewCommentInput.x, window.innerWidth - 340),
            top: Math.min(showNewCommentInput.y, window.innerHeight - 200),
            pointerEvents: 'auto'
          }}
        >
          <Card className="w-80 shadow-lg animate-[fadeInUp_0.3s_ease-out]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Add Comment</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCommentInput(null)}
                  className="h-6 w-6 p-0"
                >
                  <X size={12} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCommentInput(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateComment}
                  disabled={!newCommentContent.trim()}
                >
                  <Send size={12} className="mr-1" />
                  Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}