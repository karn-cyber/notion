"use client"
import React, { FormEvent, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useUser } from '@clerk/nextjs';
import LoadingSpinner from './ui/LoadingSpinner';

// Lazy load the collaborative components
const LazyRoomProvider = React.lazy(() => import('@/lib/liveblocks').then(module => ({ default: module.RoomProvider })))
const LazyCollaborativeEditor = React.lazy(() => import('./CollaborativeEditorFast'))

function Document({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const { user } = useUser();

    // Generate stable color for user
    const userColor = React.useMemo(() => {
        const colors = ['#ef4444', '#f97316', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
        const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';
        let hash = 0;
        for (let i = 0; i < userName.length; i++) {
            hash = userName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [user]);

    const updateTitle = async (e: FormEvent) => {
        e.preventDefault();
        if(input.trim()){
            startTransition(async () => {
                try {
                    await updateDoc(doc(db,"documents",id), { title: input });
                } catch (error) {
                    console.error("Error updating document:", error);
                }
            });
        }
    };

    // Show minimal loading state only for actual loading
    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error loading document: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            {/* Title */}
            <form onSubmit={updateTitle} className="flex space-x-2"> 
                <Input 
                    value={input || data?.title || ""} 
                    onChange={(e)=>setInput(e.target.value)} 
                    placeholder="Untitled Document"
                    className="flex-1 text-lg font-medium"
                />
                <Button disabled={isUpdating} type="submit">
                    {isUpdating ? "Updating..." : "Update"}
                </Button>
            </form>
            
            {/* Collaborative Editor with Suspense */}
            <div className="border rounded-lg">
                <React.Suspense fallback={
                    <div className="p-4 h-96 flex items-center justify-center">
                        <LoadingSpinner />
                        <span className="ml-2">Loading collaborative editor...</span>
                    </div>
                }>
                    <LazyRoomProvider 
                        id={id}
                        initialPresence={{
                            cursor: null,
                            name: user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
                            color: userColor,
                        }}
                        initialStorage={{ content: '' }}
                    >
                        <LazyCollaborativeEditor roomId={id} />
                    </LazyRoomProvider>
                </React.Suspense>
            </div>
        </div>
    );
}

export default Document;
