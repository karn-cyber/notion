import React, { useState, useTransition } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { UserAvatar } from './ui/user-avatar'
import { StatusIndicator } from './ui/status-indicators'
import LoadingSpinner from './ui/LoadingSpinner'
import { 
  Share2, 
  Mail, 
  Copy, 
  UserPlus, 
  Crown, 
  Shield, 
  Eye, 
  Edit3,
  X,
  Check,
  Send,
  Link2,
  Users,
  Globe,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  currentCollaborators?: Collaborator[]
  onCollaboratorsUpdate?: (collaborators: Collaborator[]) => void
}

interface Collaborator {
  email: string
  role: 'owner' | 'editor' | 'viewer'
  invitedAt: Date
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined'
  userId?: string
  name?: string
  avatar?: string
}

interface InviteRequest {
  email: string
  role: 'editor' | 'viewer'
}

export function ShareDialog({ 
  isOpen, 
  onClose, 
  documentId, 
  documentTitle,
  currentCollaborators = [],
  onCollaboratorsUpdate 
}: ShareDialogProps) {
  const { user } = useUser()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [isInviting, startInviting] = useTransition()
  const [pendingInvites, setPendingInvites] = useState<InviteRequest[]>([])
  const [shareLink, setShareLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  // Generate share link
  React.useEffect(() => {
    const link = `${window.location.origin}/doc/${documentId}`
    setShareLink(link)
  }, [documentId])

  const addPendingInvite = () => {
    if (!email.trim()) return
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address')
      return
    }

    // Check if already invited
    const alreadyInvited = currentCollaborators.some(c => c.email === email) ||
                          pendingInvites.some(i => i.email === email)
    
    if (alreadyInvited) {
      alert('This email has already been invited')
      return
    }

    setPendingInvites(prev => [...prev, { email: email.trim(), role }])
    setEmail('')
  }

  const removePendingInvite = (emailToRemove: string) => {
    setPendingInvites(prev => prev.filter(invite => invite.email !== emailToRemove))
  }

  // Helper function to remove undefined values from objects
  const cleanObjectForFirestore = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanObjectForFirestore)
    }
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
      const cleaned: any = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanObjectForFirestore(value)
        }
      }
      return cleaned
    }
    return obj
  }

  // Test if we can access and modify the document
  const testDocumentAccess = async () => {
    try {
      const docRef = doc(db, 'documents', documentId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        throw new Error('Document not found')
      }

      console.log('✅ Document access test passed:', docSnap.data())
      return docSnap.data()
    } catch (error) {
      console.error('❌ Document access test failed:', error)
      throw error
    }
  }

  const sendInvites = async () => {
    if (pendingInvites.length === 0) return

    startInviting(async () => {
      try {
        console.log('🚀 Starting invite process for:', pendingInvites)
        
        // Test document access first
        const documentData = await testDocumentAccess()
        
        // Create invites with only required fields (no undefined values)
        const invites: Collaborator[] = pendingInvites.map(invite => {
          const baseInvite: Collaborator = {
            email: invite.email,
            role: invite.role,
            invitedAt: new Date(),
            invitedBy: user?.emailAddresses[0]?.emailAddress || 'Unknown',
            status: 'pending' as const
          }
          // Only add optional fields if they have actual values
          // userId, name, avatar will be added when user accepts invite
          return baseInvite
        })

        console.log('📝 Updating document:', documentId, 'with invites:', invites)

        const docRef = doc(db, 'documents', documentId)
        let existingCollaborators = documentData.collaborators || []
        
        // If collaborators is not an array, initialize it
        if (!Array.isArray(existingCollaborators)) {
          existingCollaborators = []
        }
        
        console.log('📄 Current collaborators:', existingCollaborators)

        // Merge new invites with existing collaborators (avoid duplicates)
        const updatedCollaborators = [...existingCollaborators]
        
        for (const invite of invites) {
          const existingIndex = updatedCollaborators.findIndex(c => c.email === invite.email)
          if (existingIndex === -1) {
            updatedCollaborators.push(invite)
          } else {
            // Update existing invite
            updatedCollaborators[existingIndex] = invite
          }
        }

        // Try a simple update first
        console.log('🔄 Attempting document update...')
        
        // Clean the data to remove any undefined values
        const cleanedCollaborators = cleanObjectForFirestore(updatedCollaborators)
        
        await updateDoc(docRef, {
          collaborators: cleanedCollaborators,
          lastModified: new Date(),
          updatedAt: new Date()
        })

        console.log('✅ Document updated successfully')

        // Send email notifications
        console.log('📧 Creating invite notifications...')
        const notificationPromises = pendingInvites.map(async (invite) => {
          try {
            await addDoc(collection(db, 'inviteNotifications'), {
              to: invite.email,
              documentId,
              documentTitle,
              inviterName: user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Someone',
              inviterEmail: user?.emailAddresses[0]?.emailAddress,
              role: invite.role,
              shareLink,
              createdAt: new Date(),
              status: 'pending'
            })
            console.log('✅ Notification created for:', invite.email)
          } catch (notificationError) {
            console.warn('⚠️ Failed to create notification for:', invite.email, notificationError)
            // Continue with other invites even if one notification fails
          }
        })
        
        // Wait for all notifications (but don't fail if some fail)
        await Promise.allSettled(notificationPromises)

        onCollaboratorsUpdate?.(updatedCollaborators)
        setPendingInvites([])
        
        console.log('🎉 All invites sent successfully!')
        
        // Show success message
        alert(`Successfully invited ${pendingInvites.length} ${pendingInvites.length === 1 ? 'person' : 'people'}!`)
        
      } catch (error) {
        console.error('❌ Error sending invites:', error)
        
        // More specific error messages
        let errorMessage = 'Failed to send invites. '
        if (error instanceof Error) {
          if (error.message.includes('permission') || error.message.includes('denied')) {
            errorMessage += 'Permission denied. You may not have access to modify this document.'
          } else if (error.message.includes('not found')) {
            errorMessage += 'Document not found.'
          } else if (error.message.includes('network')) {
            errorMessage += 'Network error. Please check your connection.'
          } else {
            errorMessage += error.message
          }
        } else {
          errorMessage += 'Please try again.'
        }
        
        alert(errorMessage)
      }
    })
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const removeCollaborator = async (collaboratorEmail: string) => {
    try {
      const collaboratorToRemove = currentCollaborators.find(c => c.email === collaboratorEmail)
      if (!collaboratorToRemove) return

      await updateDoc(doc(db, 'documents', documentId), {
        collaborators: arrayRemove(collaboratorToRemove),
        lastModified: serverTimestamp()
      })

      const updatedCollaborators = currentCollaborators.filter(c => c.email !== collaboratorEmail)
      onCollaboratorsUpdate?.(updatedCollaborators)
    } catch (error) {
      console.error('Error removing collaborator:', error)
    }
  }

  const roleColors = {
    owner: 'bg-yellow-500',
    editor: 'bg-green-500', 
    viewer: 'bg-blue-500'
  }

  const roleIcons = {
    owner: Crown,
    editor: Edit3,
    viewer: Eye
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 size={24} className="text-primary" />
            <span>Share "{documentTitle}"</span>
          </DialogTitle>
          <DialogDescription>
            Invite people to collaborate on this document in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Share Link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Link2 size={16} />
                <span>Share Link</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={copyShareLink}
                  variant={linkCopied ? "default" : "outline"}
                  className="min-w-[100px]"
                >
                  {linkCopied ? (
                    <div className="flex items-center space-x-1">
                      <Check size={16} />
                      <span>Copied!</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <Copy size={16} />
                      <span>Copy</span>
                    </div>
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Globe size={14} />
                  <span>Anyone with the link can {isPublic ? 'edit' : 'view'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                  className="text-xs"
                >
                  {isPublic ? <Lock size={14} /> : <Globe size={14} />}
                  <span className="ml-1">{isPublic ? 'Make Private' : 'Make Public'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invite People */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <UserPlus size={16} />
                <span>Invite People</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPendingInvite()}
                  className="flex-1"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button onClick={addPendingInvite} variant="outline">
                  Add
                </Button>
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Pending Invites ({pendingInvites.length})</div>
                  {pendingInvites.map((invite) => (
                    <div key={invite.email} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Mail size={14} className="text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{invite.email}</div>
                          <Badge variant="outline" className="text-xs">
                            {invite.role}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePendingInvite(invite.email)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Collaborators */}
          {currentCollaborators.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Users size={16} />
                  <span>Current Collaborators ({currentCollaborators.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentCollaborators.map((collaborator) => {
                    const RoleIcon = roleIcons[collaborator.role]
                    const isCurrentUser = collaborator.email === user?.emailAddresses[0]?.emailAddress
                    
                    return (
                      <div key={collaborator.email} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            name={collaborator.name || collaborator.email.split('@')[0]}
                            color={roleColors[collaborator.role]}
                            size="md"
                            showStatus={collaborator.status === 'accepted'}
                            status={collaborator.status === 'accepted' ? 'online' : 'offline'}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">
                                {collaborator.name || collaborator.email.split('@')[0]}
                                {isCurrentUser && ' (You)'}
                              </span>
                              <Badge variant="outline" className="text-xs flex items-center space-x-1">
                                <RoleIcon size={10} />
                                <span>{collaborator.role}</span>
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{collaborator.email}</div>
                            <StatusIndicator 
                              status={collaborator.status === 'accepted' ? 'connected' : 'pending'} 
                              text={collaborator.status === 'accepted' ? 'Active' : 'Pending'}
                              size="sm"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {!isCurrentUser && collaborator.role !== 'owner' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCollaborator(collaborator.email)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {pendingInvites.length > 0 && (
            <Button 
              onClick={sendInvites} 
              disabled={isInviting}
              className="min-w-[120px]"
            >
              {isInviting ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner variant="icon" size={16} />
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send size={16} />
                  <span>Send Invites ({pendingInvites.length})</span>
                </div>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
