import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { UserAvatar } from './ui/user-avatar'
import LoadingSpinner from './ui/LoadingSpinner'
import { 
  Mail, 
  Check, 
  X, 
  FileText, 
  Calendar,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from 'next/navigation'

interface InviteNotification {
  id: string
  to: string
  documentId: string
  documentTitle: string
  inviterName: string
  inviterEmail: string
  role: 'editor' | 'viewer'
  shareLink: string
  createdAt: Date
  status: 'pending' | 'accepted' | 'declined'
}

interface InviteNotificationsProps {
  className?: string
}

export function InviteNotifications({ className }: InviteNotificationsProps) {
  const { user } = useUser()
  const router = useRouter()
  const [invites, setInvites] = useState<InviteNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user?.emailAddresses[0]?.emailAddress) return

    const userEmail = user.emailAddresses[0].emailAddress
    
    const q = query(
      collection(db, 'inviteNotifications'),
      where('to', '==', userEmail),
      where('status', '==', 'pending')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inviteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as InviteNotification[]
      
      setInvites(inviteData)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const acceptInvite = async (invite: InviteNotification) => {
    if (!user) return
    
    setProcessingInvites(prev => new Set(prev).add(invite.id))
    
    try {
      // Add user to document collaborators
      const docRef = doc(db, 'documents', invite.documentId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentCollaborators = docSnap.data().collaborators || []
        
        // Remove old pending invite
        const oldInvite = currentCollaborators.find((c: any) => c.email === invite.to)
        if (oldInvite) {
          await updateDoc(docRef, {
            collaborators: arrayRemove(oldInvite)
          })
        }
        
        // Add accepted collaborator
        const newCollaborator = {
          email: invite.to,
          role: invite.role,
          invitedAt: new Date(),
          invitedBy: invite.inviterEmail,
          status: 'accepted',
          userId: user.id,
          name: user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0],
          avatar: user.imageUrl
        }
        
        await updateDoc(docRef, {
          collaborators: arrayUnion(newCollaborator),
          lastModified: serverTimestamp()
        })
      }

      // Update notification status
      await updateDoc(doc(db, 'inviteNotifications', invite.id), {
        status: 'accepted',
        acceptedAt: serverTimestamp()
      })

      console.log('✅ Invite accepted successfully')
      
      // Navigate to document
      router.push(`/doc/${invite.documentId}`)
      
    } catch (error) {
      console.error('❌ Error accepting invite:', error)
      alert('Failed to accept invite. Please try again.')
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev)
        newSet.delete(invite.id)
        return newSet
      })
    }
  }

  const declineInvite = async (invite: InviteNotification) => {
    setProcessingInvites(prev => new Set(prev).add(invite.id))
    
    try {
      // Update notification status
      await updateDoc(doc(db, 'inviteNotifications', invite.id), {
        status: 'declined',
        declinedAt: serverTimestamp()
      })

      // Remove from document collaborators if exists
      const docRef = doc(db, 'documents', invite.documentId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const currentCollaborators = docSnap.data().collaborators || []
        const pendingInvite = currentCollaborators.find((c: any) => c.email === invite.to && c.status === 'pending')
        
        if (pendingInvite) {
          await updateDoc(docRef, {
            collaborators: arrayRemove(pendingInvite),
            lastModified: serverTimestamp()
          })
        }
      }

      console.log('✅ Invite declined successfully')
      
    } catch (error) {
      console.error('❌ Error declining invite:', error)
      alert('Failed to decline invite. Please try again.')
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev)
        newSet.delete(invite.id)
        return newSet
      })
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex items-center justify-center">
          <LoadingSpinner variant="icon" size={20} />
        </CardContent>
      </Card>
    )
  }

  if (invites.length === 0) {
    return null // Don't show anything if no invites
  }

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base">
          <Mail size={16} className="text-blue-600" />
          <span>Collaboration Invites</span>
          <Badge variant="secondary">{invites.length}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {invites.map((invite) => {
          const isProcessing = processingInvites.has(invite.id)
          
          return (
            <div key={invite.id} className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    name={invite.inviterName}
                    color="#3b82f6"
                    size="md"
                    showStatus={false}
                  />
                  <div>
                    <div className="font-medium text-sm">
                      <span className="text-foreground">{invite.inviterName}</span>
                      <span className="text-muted-foreground"> invited you to collaborate</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {invite.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(invite.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Info */}
              <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                <FileText size={16} className="text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{invite.documentTitle}</div>
                  <div className="text-xs text-muted-foreground">Document ID: {invite.documentId.slice(0, 8)}...</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => acceptInvite(invite)}
                  disabled={isProcessing}
                  size="sm"
                  className="flex-1"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner variant="icon" size={14} />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Check size={14} />
                      <span>Accept</span>
                    </div>
                  )}
                </Button>
                
                <Button
                  onClick={() => declineInvite(invite)}
                  disabled={isProcessing}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <div className="flex items-center space-x-2">
                    <X size={14} />
                    <span>Decline</span>
                  </div>
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
