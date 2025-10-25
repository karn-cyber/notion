"use client"
import React from 'react'
import {LiveblocksProvider} from '@liveblocks/react/suspense'
function LiveBlocksProvider({children}: {children: React.ReactNode}) {
    if(!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY){
        throw new Error("LIVEBLOCKS_PUBLIC_KEY is not defined");
    }
  return (
    <div>
      <LiveblocksProvider throttle={16} authEndpoint='/auth-endpoint'>
        {children}
      </LiveblocksProvider>
    </div>
  )
}

export default LiveBlocksProvider