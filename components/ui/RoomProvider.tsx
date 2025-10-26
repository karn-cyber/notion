"use client"
import React from 'react'

import {
    ClientSideSuspense,
    RoomProvider as RoomProviderWrapper,
} from "@liveblocks/react/suspense";
import LoadingSpinner from './LoadingSpinner';

function RoomProvider({roomId,children}:
    {
    roomId: string;
    children: React.ReactNode;
}) {
  return (
    <RoomProviderWrapper
    id={roomId}
    initialPresence={{
        cursor: null,
        name: undefined,
        color: undefined,
        isTyping: false,
        lastSeen: undefined
    }}
    initialStorage={{
        content: "",
        blocks: "[]"
    }}>
        <ClientSideSuspense
        fallback={<LoadingSpinner/>}>
            {children}   
        </ClientSideSuspense>
    </RoomProviderWrapper>
  )
}

export default RoomProvider