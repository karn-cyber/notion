"use client"
import React, { FormEvent, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useUser } from '@clerk/nextjs';
import LoadingSpinner from './ui/LoadingSpinner';
import { RoomProvider } from '@/lib/liveblocks';
import CollaborativeEditor from './CollaborativeEditor';

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
                    await updateDoc(doc(db, "documents", id), {
                        title: input,
                    });
                    console.log("Title updated successfully");
                } catch (error) {
                    console.error("Error updating title:", error);
                }
            });
        }
    };

    // Show error state first
    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error loading document: {error.message}
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            {/* Loading indicator for initial load */}
            {loading && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center space-x-2">
                    <LoadingSpinner size={16} />
                    <span className="text-blue-700 text-sm">Loading document...</span>
                </div>
            )}

            {/* Document loaded indicator */}
            {!loading && data && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="text-green-700 font-medium">Document Loaded Successfully!</div>
                    <div className="text-green-600 text-sm">Document ID: {id} | Title: {data?.title || "Untitled"}</div>
                </div>
            )}

            {/* Title - show even while loading */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {data?.title || "Untitled Document"}
                </h1>
                <p className="text-gray-600 text-sm">
                    Last modified: {data?.createdAt?.toDate().toLocaleDateString() || "Unknown"}
                </p>
            </div>

            {/* Document Title Update Form - always show */}
            <form className="flex space-x-2" onSubmit={updateTitle}>
                <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter new title..."
                    disabled={loading}
                />
                <Button disabled={isUpdating || loading} type="submit">
                    {isUpdating ? "Updating..." : "Update"}
                </Button>
            </form>
            
            {/* Collaborative Editor - always render but show loading inside */}
            <RoomProvider 
                id={id}
                initialPresence={{
                    cursor: null,
                    name: user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User',
                    color: userColor,
                }}
                initialStorage={{ content: data?.content || '' }}
            >
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-96">
                        <div className="text-center space-y-2">
                            <LoadingSpinner size={32} />
                            <p className="text-gray-500">Loading collaborative editor...</p>
                        </div>
                    </div>
                ) : (
                    <CollaborativeEditor roomId={id} />
                )}
            </RoomProvider>
        </div>
    );
}

export default Document;
