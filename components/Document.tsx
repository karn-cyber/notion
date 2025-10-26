"use client"
import React, { FormEvent, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useUser } from '@clerk/nextjs';
import LoadingSpinner from './ui/LoadingSpinner';

function Document({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();
    const { user } = useUser();

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

    // Show loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
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
            {/* Status indicator */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-green-700 font-medium">Document Loaded Successfully!</div>
                <div className="text-green-600 text-sm">Document ID: {id} | Title: {data?.title || "Untitled"}</div>
            </div>

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
                />
                <Button disabled={isUpdating} type="submit">
                    {isUpdating ? "Updating..." : "Update"}
                </Button>
            </form>
            
            {/* Simple Editor */}
            <div className="border rounded-lg">
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Document Editor</span>
                        <span className="text-xs text-gray-600">• User: {user?.emailAddresses[0]?.emailAddress}</span>
                    </div>
                </div>
                <textarea
                    placeholder="Start writing your document here..."
                    className="w-full h-96 p-6 border-none outline-none resize-none text-gray-800 placeholder-gray-400 text-base"
                    defaultValue={data?.content || ""}
                />
                <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-200">
                    Document ID: {id} • Ready for editing
                </div>
            </div>
        </div>
    );
}

export default Document;
