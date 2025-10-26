"use client"
import React, { FormEvent, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';

function Document({id}:{id:string}) {
    const [data, loading, error] = useDocumentData(doc(db,"documents",id));
    const [input, setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();

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

    // Immediate render without complex loading checks
    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            {/* Title */}
            <form onSubmit={updateTitle} className="flex space-x-2"> 
                <Input 
                    value={input || data?.title || ""} 
                    onChange={(e)=>setInput(e.target.value)} 
                    placeholder={loading ? "Loading..." : "Untitled Document"}
                    className="flex-1 text-lg font-medium"
                />
                <Button disabled={isUpdating} type="submit">
                    {isUpdating ? "Updating..." : "Update"}
                </Button>
            </form>
            
            {/* Simple Text Editor */}
            <div className="border rounded-lg p-4">
                {error ? (
                    <div className="text-red-500">Error: {error.message}</div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            Document ID: {id} | Status: {loading ? "Loading..." : "Ready"}
                        </div>
                        <textarea
                            placeholder="Start writing your document here..."
                            className="w-full h-96 p-4 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            defaultValue="This is your document content. Real-time collaboration will be added back once loading is fixed."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Document;
