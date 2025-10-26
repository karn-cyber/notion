"use client"
import React, { FormEvent, useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import LoadingSpinner from './ui/LoadingSpinner';
import BlockNoteCollaborativeEditor from './BlockNoteCollaborativeEditor';
import { ThemeToggle } from './ui/theme-toggle';
import { UserAvatar, UserList } from './ui/user-avatar';
import { StatusIndicator, CollaborationStatus, DocumentStatus } from './ui/status-indicators';
import { ShareDialog } from './ShareDialog';
import { useUser } from '@clerk/nextjs';
import { 
  FileText, 
  Users, 
  Settings, 
  Share2, 
  Clock,
  Globe,
  Lock
} from 'lucide-react';

function DocumentWithRealCollab({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');
    const [isCollabReady, setIsCollabReady] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const { user } = useUser();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                // Set collaborators from document data
                setCollaborators(data?.collaborators || []);
            }, 1000); // Small delay to ensure everything is loaded
            
            return () => clearTimeout(timer);
        }
    }, [loading, data, user, id]);

    // Cleanup save timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

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

    // Enhanced content save with debouncing
    const updateContent = useCallback(async (newContent: string) => {
        setAutoSaveStatus('pending');
        
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Debounce the save operation
        saveTimeoutRef.current = setTimeout(async () => {
            setAutoSaveStatus('saving');
            
            try {
                await updateDoc(doc(db, "documents", id), {
                    content: newContent,
                    lastModified: new Date(),
                });
                console.log("✅ Content auto-saved to Firebase:", newContent.length, "characters");
                setAutoSaveStatus('saved');
            } catch (error) {
                console.error("❌ Error saving content to Firebase:", error);
                setAutoSaveStatus('saved');
            }
        }, 1000); // Wait 1 second after user stops typing
    }, [id]);

    // Show error state
    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error loading document: {error.message}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/30 transition-colors">
            <div className="max-w-6xl mx-auto p-4 space-y-6">
                {/* Header */}
                <Card className="border-none shadow-lg bg-linear-to-r from-card to-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3 sm:gap-4 min-w-0 min-h-0">
                            <div className="flex-1 space-y-3 min-w-0 overflow-hidden">
                                {/* Loading State */}
                                {loading && (
                                    <div className="flex items-center space-x-3 p-4 bg-blue-50/80 dark:bg-blue-950/50 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                                        <LoadingSpinner variant="icon" size={20} className="text-blue-600" />
                                        <div>
                                            <div className="text-blue-700 dark:text-blue-300 font-medium">Loading document...</div>
                                            <div className="text-blue-600/70 dark:text-blue-400/70 text-sm">Preparing collaborative workspace</div>
                                        </div>
                                    </div>
                                )}

                                {/* Document Status - Mobile Responsive */}
                                {!loading && data && (
                                    <div className="space-y-3">
                                        <div className="p-3 sm:p-4 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200/50 dark:border-green-800/30">
                                            {/* Mobile Layout (stacked) */}
                                            <div className="block sm:hidden space-y-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full shrink-0">
                                                        <FileText size={18} className="text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <div className="text-green-700 dark:text-green-300 font-semibold text-sm truncate">
                                                            {isCollabReady ? "Live" : "🔄 Loading..."}
                                                        </div>
                                                        <div className="text-green-600/80 dark:text-green-400/80 text-xs truncate">
                                                            {data?.title || "Untitled"}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-3 w-full overflow-hidden">
                                                    <div className="w-full overflow-hidden">
                                                        <DocumentStatus 
                                                            autoSaveStatus={autoSaveStatus}
                                                            lastModified={autoSaveStatus === 'saved' ? new Date() : undefined}
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex justify-center sm:justify-end">
                                                        <Button
                                                            onClick={() => setIsShareDialogOpen(true)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-2 px-4 py-2 animate-[fadeIn_0.3s_ease-out]"
                                                        >
                                                            <Share2 size={14} />
                                                            <span className="text-xs font-medium">Share</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Desktop Layout (horizontal) */}
                                            <div className="hidden sm:flex items-center justify-between gap-4 min-w-0 min-h-0">
                                                <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full shrink-0">
                                                        <FileText size={20} className="text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <div className="text-green-700 dark:text-green-300 font-semibold truncate">
                                                            {isCollabReady ? "Collaboration Active" : "Enabling Collaboration..."}
                                                        </div>
                                                        <div className="text-green-600/80 dark:text-green-400/80 text-sm truncate">
                                                            <span className="hidden lg:inline">Document: </span>
                                                            <span className="font-medium">{data?.title || "Untitled"}</span>
                                                            <span className="hidden xl:inline"> • ID: {id.slice(0, 8)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 shrink-0 overflow-hidden max-w-md">
                                                    <div className="min-w-0 flex-1 overflow-hidden">
                                                        <DocumentStatus 
                                                            autoSaveStatus={autoSaveStatus}
                                                            lastModified={autoSaveStatus === 'saved' ? new Date() : undefined}
                                                        />
                                                    </div>
                                                    
                                                    <Button
                                                        onClick={() => setIsShareDialogOpen(true)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-2 px-3 py-1.5 shrink-0 animate-[fadeIn_0.3s_ease-out]"
                                                    >
                                                        <Share2 size={16} />
                                                        <span className="hidden md:inline font-medium">Share</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Collaboration Status */}
                                        {isCollabReady && (
                                            <div className="w-full overflow-hidden bg-linear-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-3 border border-blue-100/50 dark:border-blue-800/30">
                                                <CollaborationStatus 
                                                    isActive={isCollabReady}
                                                    userCount={1}
                                                    roomId={id}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Theme Toggle */}
                            <div className="shrink-0 self-start">
                                <ThemeToggle />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Document Title Section */}
                <Card className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2">
                            <FileText size={24} className="text-primary" />
                            <span className="text-2xl font-bold text-foreground">
                                {data?.title || "Untitled Document"}
                            </span>
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>Last modified: {data?.createdAt?.toDate().toLocaleDateString() || "Unknown"}</span>
                            </div>
                            <Badge variant="outline" className="flex items-center space-x-1">
                                <Globe size={12} />
                                <span>Public</span>
                            </Badge>
                        </div>
                    </CardHeader>
                    
                    <CardContent>
                        <form className="flex space-x-3" onSubmit={updateTitle}>
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter new title..."
                                disabled={loading}
                                className="flex-1"
                            />
                            <Button 
                                disabled={isUpdating || loading} 
                                type="submit"
                                className="min-w-[100px]"
                            >
                                {isUpdating ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner variant="icon" size={16} />
                                        <span>Updating...</span>
                                    </div>
                                ) : (
                                    "Update"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                
                {/* Editor Section */}
                {!loading && data && (
                    <Card className="shadow-lg border-2 border-border/50 hover:border-border transition-colors">
                        {!isCollabReady ? (
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center p-6 bg-muted/50 border-2 border-dashed border-border rounded-xl">
                                        <div className="text-center space-y-3">
                                            <LoadingSpinner variant="icon" size={32} className="mx-auto text-primary" />
                                            <div>
                                                <div className="font-semibold text-lg">Initializing Collaboration</div>
                                                <div className="text-muted-foreground">Setting up real-time features...</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                                        <div className="p-4 bg-muted/30 border-b border-border">
                                            <StatusIndicator status="loading" text="Loading collaborative features..." />
                                        </div>
                                        <textarea
                                            value={data?.content || ""}
                                            readOnly
                                            placeholder="Preparing collaborative workspace..."
                                            className="w-full h-80 p-6 border-none outline-none resize-none text-foreground placeholder-muted-foreground text-base bg-transparent"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        ) : (
                            <CardContent className="p-0">
                                <div className="space-y-4">
                                    {/* Collaboration Header - Mobile Responsive */}
                                    <div className="p-2 sm:p-4 bg-linear-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-border">
                                        {/* Mobile Layout (stacked) */}
                                        <div className="block sm:hidden space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                                        <Users size={16} className="text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                                                            Live
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <Badge variant="success" className="flex items-center space-x-1 text-xs">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span>Online</span>
                                                </Badge>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="text-blue-600/80 dark:text-blue-400/80 text-xs truncate flex-1">
                                                    Real-time sync active
                                                </div>
                                                <UserAvatar
                                                    name={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                                                    color={userColor}
                                                    size="sm"
                                                    showName={false}
                                                    isCurrentUser={true}
                                                    showStatus={true}
                                                    status="online"
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Desktop Layout (horizontal) */}
                                        <div className="hidden sm:flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                                    <Users size={20} className="text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-blue-700 dark:text-blue-300">
                                                        Live Collaboration Activated
                                                    </div>
                                                    <div className="text-blue-600/80 dark:text-blue-400/80 text-sm">
                                                        Changes sync instantly across all tabs
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-3">
                                                <UserAvatar
                                                    name={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                                                    color={userColor}
                                                    size="md"
                                                    showName={true}
                                                    isCurrentUser={true}
                                                    showStatus={true}
                                                    status="online"
                                                />
                                                <Badge variant="success" className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                    <span>Online</span>
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Collaborative Editor */}
                                    <div className="px-4 pb-4">
                                        <BlockNoteCollaborativeEditor 
                                            initialContent={data?.content || ''}
                                            onContentChange={updateContent}
                                            userName={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}
                                            userColor={userColor}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}
            </div>
            
            {/* Share Dialog */}
            <ShareDialog
                isOpen={isShareDialogOpen}
                onClose={() => setIsShareDialogOpen(false)}
                documentId={id}
                documentTitle={data?.title || "Untitled Document"}
                currentCollaborators={collaborators}
                onCollaboratorsUpdate={setCollaborators}
            />
        </div>
    );
}

export default DocumentWithRealCollab;
