"use client"
import React, { FormEvent, useEffect, useState, useTransition } from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';

function Document({id}:{id:string}) {
    const [data,loading,error] = useDocumentData(doc(db,"documents",id));
    const [input,setInput] = useState("");
    const [isUpdating, startTransition] = useTransition();


    useEffect(()=>{
        if(data){
            setInput(data.title);
        }
    },[data]);

    const updateTitle = async (e: FormEvent) => {
        e.preventDefault();

        if(input.trim()){
            startTransition(async () => {
                try {
                    await updateDoc(doc(db,"documents",id),{
                        title: input,
                    });
                } catch (error) {
                    console.error("Error updating document:", error);
                }
            });
        }
    };

    return (
        <div className="">
            <div className="max-w-6xl mx-auto justify-between pb-5">
                <form onSubmit={updateTitle} className="flex flex-1 space-x-2"> 
                    {/* update title  */}
                    <Input 
                        value={input} 
                        onChange={(e)=>setInput(e.target.value)} 
                        placeholder="Document Title"
                        className="flex-1"
                    />
                    <Button disabled={isUpdating} type="submit">
                        {isUpdating ? "Updating..." : "Update"}
                    </Button>
                </form>
            </div>
            
            <div>
                {/* Manage Users  */}
                {/* Avatars  */}
            </div>
            
            {/* Collaborative Editor  */}
            <div className="mt-5">
                <div className="bg-white rounded-lg shadow-sm border p-8">
                    <textarea 
                        placeholder="Start writing your document..."
                        className="w-full h-96 border-none outline-none resize-none text-gray-700 placeholder-gray-400 text-lg leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
}

export default Document;