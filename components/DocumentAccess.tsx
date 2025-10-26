"use client"
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import LoadingSpinner from './ui/LoadingSpinner'

interface DocumentAccessProps {
  children: React.ReactNode
  roomId: string
}

function DocumentAccess({ children, roomId }: DocumentAccessProps) {
  const { user, isLoaded } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !isLoaded) return

      try {
        setIsLoading(true)
        
        console.log('🔍 DocumentAccess - Checking access for:', {
          roomId,
          userEmail: user.emailAddresses[0]?.emailAddress,
          userId: user.id
        });
        
        // Call your auth endpoint to check access
        const response = await fetch('/auth-endpoint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ room: roomId }),
        })

        console.log('🔍 DocumentAccess - Auth response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (response.ok) {
          console.log('✅ DocumentAccess - Access granted');
          setHasAccess(true)
        } else if (response.status === 403) {
          console.log('❌ DocumentAccess - Access denied (403)');
          const errorData = await response.json();
          console.log('❌ DocumentAccess - Error details:', errorData);
          setHasAccess(false)
        } else {
          console.error('❌ DocumentAccess - Unexpected error:', response.status, response.statusText);
          const errorData = await response.text();
          console.error('❌ DocumentAccess - Error body:', errorData);
          setHasAccess(false)
        }
      } catch (error) {
        console.error('❌ DocumentAccess - Network/fetch error:', error)
        setHasAccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [user, isLoaded, roomId])

  // Show loading while checking authentication
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Checking document access...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized message
  if (hasAccess === false) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this document.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Contact the document owner to request access.
          </p>
          <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
            Debug Info:<br/>
            Room ID: {roomId}<br/>
            User: {user?.emailAddresses[0]?.emailAddress}<br/>
            Check browser console for detailed logs
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show document if user has access
  if (hasAccess === true) {
    return <>{children}</>
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center min-h-96">
      <LoadingSpinner />
    </div>
  )
}

export default DocumentAccess
