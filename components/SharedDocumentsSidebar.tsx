import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { UserAvatar } from './ui/user-avatar'
import { StatusIndicator } from './ui/status-indicators'
import LoadingSpinner from './ui/LoadingSpinner'
import { 
  Share2, 
  Users, 
  Clock, 
  ExternalLink,
  Star,
  MoreVertical,
  Eye,
  Edit3,
  Crown,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import Link from 'next/link'

interface SharedDocument {
  id: string
  title: string
  owner: string
  ownerName?: string
  role: 'owner' | 'editor' | 'viewer'
  lastModified: Date
  createdAt: Date
  collaborators: Array<{
    email: string
    role: 'owner' | 'editor' | 'viewer'
    name?: string
  }>
  isStarred?: boolean
}

interface SharedDocumentsSidebarProps {
  className?: string
}

export function SharedDocumentsSidebar({ className }: SharedDocumentsSidebarProps) {
  const { user } = useUser()
  const [sharedDocs, setSharedDocs] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'owned' | 'shared'>('all')

  useEffect(() => {
    if (!user?.emailAddresses[0]?.emailAddress) return

    const userEmail = user.emailAddresses[0].emailAddress

    // Create a simpler query to find documents where user is in collaborators
    const documentsQuery = query(
      collection(db, 'documents'),
      orderBy('lastModified', 'desc')
    )

    const unsubscribe = onSnapshot(documentsQuery, (snapshot) => {
      const allDocs: SharedDocument[] = []
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const collaborators = data.collaborators || []
        
        // Check if user is owner
        const isOwner = data.userId === user.id || data.userEmail === userEmail
        
        // Check if user is in collaborators array
        const userCollab = collaborators.find((c: any) => c.email === userEmail)
        
        // Include document if user is owner OR is in collaborators
        if (isOwner || userCollab) {
          const userRole = isOwner ? 'owner' : (userCollab?.role || 'viewer')
          
          allDocs.push({
            id: doc.id,
            title: data.title || 'Untitled',
            owner: data.userId || data.userEmail || 'Unknown',
            ownerName: data.ownerName || data.userEmail?.split('@')[0],
            role: userRole,
            lastModified: data.lastModified?.toDate() || data.updatedAt?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            collaborators: collaborators,
            isStarred: data.starredBy?.includes(user.id)
          })
        }
      })
      
      console.log('📋 Found documents for user:', allDocs)
      setSharedDocs(allDocs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const filteredDocs = sharedDocs.filter(doc => {
    if (filter === 'owned') return doc.role === 'owner'
    if (filter === 'shared') return doc.role !== 'owner'
    return true
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500'
      case 'editor': return 'bg-green-500'
      case 'viewer': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return Crown
      case 'editor': return Edit3
      case 'viewer': return Eye
      default: return Users
    }
  }

  if (loading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 size={20} />
            <span>Shared Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <LoadingSpinner variant="icon" size={32} />
            <div className="text-sm text-muted-foreground">Loading documents...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Share2 size={20} className="text-primary" />
          <span>Documents</span>
          <Badge variant="secondary" className="ml-auto">
            {filteredDocs.length}
          </Badge>
        </CardTitle>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[
            { key: 'all', label: 'All', count: sharedDocs.length },
            { key: 'owned', label: 'Owned', count: sharedDocs.filter(d => d.role === 'owner').length },
            { key: 'shared', label: 'Shared', count: sharedDocs.filter(d => d.role !== 'owner').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filter === key 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Share2 size={48} className="mx-auto text-muted-foreground/50" />
            <div>
              <div className="font-medium text-muted-foreground">No documents yet</div>
              <div className="text-sm text-muted-foreground/70">
                {filter === 'shared' 
                  ? "Documents shared with you will appear here" 
                  : "Your documents and shared documents will appear here"}
              </div>
            </div>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const RoleIcon = getRoleIcon(doc.role)
            
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <Link href={`/doc/${doc.id}`}>
                          <h3 className="font-semibold text-sm hover:text-primary transition-colors truncate cursor-pointer">
                            {doc.title}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs flex items-center space-x-1">
                            <RoleIcon size={10} />
                            <span>{doc.role}</span>
                          </Badge>
                          {doc.isStarred && (
                            <Star size={12} className="text-yellow-500 fill-current" />
                          )}
                        </div>
                      </div>
                      
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical size={14} />
                      </Button>
                    </div>

                    {/* Owner Info */}
                    {doc.role !== 'owner' && (
                      <div className="flex items-center space-x-2">
                        <UserAvatar
                          name={doc.ownerName || doc.owner}
                          color={getRoleColor('owner')}
                          size="sm"
                        />
                        <div className="text-xs text-muted-foreground">
                          Owned by {doc.ownerName || 'Unknown'}
                        </div>
                      </div>
                    )}

                    {/* Collaborators */}
                    {doc.collaborators.length > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Users size={12} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {doc.collaborators.length} collaborator{doc.collaborators.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="flex -space-x-1">
                          {doc.collaborators.slice(0, 3).map((collab, index) => (
                            <UserAvatar
                              key={index}
                              name={collab.name || collab.email.split('@')[0]}
                              color={getRoleColor(collab.role)}
                              size="sm"
                              className="ring-2 ring-background"
                            />
                          ))}
                          {doc.collaborators.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                              +{doc.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{formatDate(doc.lastModified)}</span>
                      </div>
                      
                      <Link href={`/doc/${doc.id}`}>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          <ExternalLink size={12} className="mr-1" />
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
