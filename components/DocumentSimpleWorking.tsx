"use client"
import React, { FormEvent, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import LoadingSpinner from './ui/LoadingSpinner';
import CollaborativeEditorStable from './CollaborativeEditorStable';

function DocumentSimpleWorking({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [content, setContent] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const [isUpdatingContent, startContentTransition] = useTransition();
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved');

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
        setContent(newContent);
        setAutoSaveStatus('pending');
        
        // Debounced save
        const timeoutId = setTimeout(() => {
            setAutoSaveStatus('saving');
            startContentTransition(async () => {
                try {
                    await updateDoc(doc(db, "documents", id), {
                        content: newContent,
                    });
                    console.log("Content auto-saved successfully");
                    setAutoSaveStatus('saved');
                } catch (error) {
                    console.error("Error updating content:", error);
                    setAutoSaveStatus('saved');
                }
            });
        }, 1000);

        return () => clearTimeout(timeoutId);
    };

    // Set initial content when data loads
    React.useEffect(() => {
        if (data?.content && content === "") {
            setContent(data.content);
        }
    }, [data?.content, content]);

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
                        <div className="text-green-700 font-medium">Document Loaded Successfully!</div>
                        <div className="text-green-600 text-sm">Document ID: {id} | Title: {data?.title || "Untitled"}</div>
                    </div>
                    <div className="text-xs text-gray-500">
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
            
            {/* Collaborative Editor */}
            <CollaborativeEditorStable 
                roomId={id}
                initialContent={data?.content || content}
                onContentChange={updateContent}
            />
        </div>
    );
}

export default DocumentSimpleWorking;
