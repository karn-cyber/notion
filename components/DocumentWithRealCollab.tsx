"use client"
import React, { FormEvent, useState, useTransition, useEffect } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import LoadingSpinner from './ui/LoadingSpinner';
import { RoomProvider } from '@/lib/liveblocks';
import RealCollaborativeEditor from './RealCollaborativeEditor';
import CollaborativeEditorWorking from './CollaborativeEditorWorking';
import { useUser } from '@clerk/nextjs';

function DocumentWithRealCollab({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
    const [isCollabReady, setIsCollabReady] = useState(false);
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

    // Enable collaboration after document loads
    useEffect(() => {
        if (!loading && data && user) {
            const timer = setTimeout(() => {
                console.log("🔍 Enabling collaboration for document:", id);
                setIsCollabReady(true);
            }, 1000); // Small delay to ensure everything is loaded
            
            return () => clearTimeout(timer);
        }
    }, [loading, data, user, id]);

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

    const updateContent = async (newContent: string) => {
        setAutoSaveStatus('saving');
        
        try {
            await updateDoc(doc(db, "documents", id), {
                content: newContent,
            });
            console.log("Content auto-saved to Firebase");
            setAutoSaveStatus('saved');
        } catch (error) {
            console.error("Error updating content:", error);
            setAutoSaveStatus('saved');
        }
    };

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
            {/* Loading indicator */}
            {loading && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center space-x-2">
                    <LoadingSpinner size={16} />
                    <span className="text-blue-700 text-sm">Loading document...</span>
                </div>
            )}

            {/* Document loaded indicator */}
            {!loading && data && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex items-center justify-between">
                    <div>
                        <div className="text-green-700 font-medium">
                            {isCollabReady ? "Real-Time Collaboration Active!" : "Document Loaded - Enabling Collaboration..."}
                        </div>
                        <div className="text-green-600 text-sm">Document ID: {id} | Title: {data?.title || "Untitled"}</div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                        {!isCollabReady && <LoadingSpinner size={12} />}
                        {autoSaveStatus === 'saving' && (
                            <span className="flex items-center space-x-1">
                                <LoadingSpinner size={12} />
                                <span>Saving...</span>
                            </span>
                        )}
                        {autoSaveStatus === 'saved' && '✅ Saved'}
                        {autoSaveStatus === 'pending' && '📝 Pending...'}
                    </div>
                </div>
            )}

            {/* Title */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {data?.title || "Untitled Document"}
                </h1>
                <p className="text-gray-600 text-sm">
                    Last modified: {data?.createdAt?.toDate().toLocaleDateString() || "Unknown"}
                </p>
            </div>

            {/* Document Title Update Form */}
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
            
            {/* Editor Section */}
            {!loading && data && (
                <div className="space-y-3">
                    {!isCollabReady ? (
                        // Simple editor while waiting for collaboration to initialize
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <span className="text-sm font-medium flex items-center space-x-2">
                                    <LoadingSpinner size={16} />
                                    <span>Initializing collaboration...</span>
                                </span>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                <textarea
                                    value={data?.content || ""}
                                    readOnly
                                    placeholder="Loading collaborative features..."
                                    className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base bg-gray-50"
                                />
                            </div>
                        </div>
                    ) : (
                        // Simple collaborative editor that actually works
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Real-time collaboration active!</span>
                                </div>
                                <div className="flex -space-x-1">
                                    <div 
                                        className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                                        style={{ backgroundColor: userColor }}
                                        title={`${user?.firstName || 'You'} (You)`}
                                    >
                                        {(user?.firstName || 'Y').charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <CollaborativeEditorWorking 
                                roomId={id}
                                initialContent={data?.content || ''}
                                onContentChange={updateContent}
                                userName={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                                userColor={userColor}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DocumentWithRealCollab;
