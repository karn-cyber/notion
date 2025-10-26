'use client'
import { SignedIn, SignedOut, SignInButton, SignOutButton, UserButton } from '@clerk/clerk-react';
import { useUser } from '@clerk/nextjs';
import React from 'react'
import Breadcrumbs from './Breadcrumbs';
import { InviteNotifications } from './InviteNotifications';

function Header(){
  const {user} = useUser();
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between p-5">
        {user && (
          <h1 className="text-2xl font-bold">{user?.firstName}{`'s`} Space</h1>
        )}

        <Breadcrumbs/>
        
        <div className="flex items-center space-x-4">
          <SignedOut>
            <SignInButton/>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
      
      {/* Invite Notifications */}
      <SignedIn>
        <div className="px-5 pb-4">
          <InviteNotifications />
        </div>
      </SignedIn>
    </div>
  )
  
}
export default Header;