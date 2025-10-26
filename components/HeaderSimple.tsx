'use client'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import React from 'react'

function Header(){
  return (
    <div className="flex items-center justify-between p-5 bg-white border-b">
      <h1 className="text-2xl font-bold">📝 Notion Clone</h1>
      
      <div className="text-sm text-gray-600">
        Fast Loading Documents ✅
      </div>
      
      <div>
        <SignedOut>
          <SignInButton/>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  )
}

export default Header;
