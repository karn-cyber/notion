"use client";
import React, { useEffect } from 'react';
import NewDocumentButton from './NewDocumentButton';
import {useCollection} from "react-firebase-hooks/firestore";
import { SharedDocumentsSidebar } from './SharedDocumentsSidebar';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { MenuIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { collectionGroup, query, where, DocumentData } from 'firebase/firestore';
import { db } from '@/firebase';
import SidebarOption from './SidebarOption';


interface RoomDocument extends DocumentData{
    id?: string;
    createdAt : string;
    role: "owner" | "editor";
    roomId: string;
    userId:string;
}
function Sidebar() {
    const {user} = useUser();
    const [groupedData,setGroupedData] = React.useState<{
        owner:RoomDocument[];
        editor: RoomDocument[];
    }>({
        owner:[],
        editor:[],
    });
    const [data,loading,error] = useCollection(
        user && (
            query(collectionGroup(db,'rooms'), where("userId","==",user.emailAddresses[0].toString()))
        )
    );

    useEffect(()=>{
        if(!data) return;

        const grouped = data.docs.reduce<{
            owner:RoomDocument[];
            editor: RoomDocument[];
        }>(
            (acc,curr) => {
                const roomData = curr.data() as RoomDocument;

                if(roomData.role == "owner"){
                    acc.owner.push({
                        id: curr.id,
                        ...roomData,}
                    )
                }
                else{
                    acc.editor.push({
                        id: curr.id,
                        ...roomData,
                    })
                }
                return acc;
            },{
                owner:[],
                editor:[],
            }
        )
        setGroupedData(grouped);
    },[data])

    const menuOptions = (
        <div className="space-y-6">
            <NewDocumentButton/>

            {/* My Documents */}
            <div className='space-y-3'>
                <h2 className='font-bold text-lg'>My Documents</h2>
                {groupedData.owner.length === 0 ? (
                    <p className='text-sm text-gray-500 p-3 bg-gray-50 rounded-lg'>No Documents Found</p>
                ) : (
                    <div className="space-y-2">
                        {groupedData.owner.map((doc) => (
                            doc.id ? (
                                <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
                            ) : null
                        ))}
                    </div>
                )}

                {/* Legacy Shared Documents */}
                {groupedData.editor.length > 0 && (
                    <>
                        <h3 className='mt-4 mb-2 font-semibold text-sm'>Legacy Shared</h3>
                        {groupedData.editor.map((doc) => (
                            <p key={doc.id} className="text-sm text-gray-700 hover:bg-gray-100 p-2 rounded cursor-pointer">
                                {doc.id}
                            </p>
                        ))}
                    </>
                )}
            </div>

            {/* New Shared Documents Section */}
            <div className="border-t pt-4">
                <SharedDocumentsSidebar />
            </div>
        </div> 
    )
  return (
    <div className='p-2 md:p-5 bg-background border-r border-border relative min-h-screen'>
        <div className='md:hidden'>
        <Sheet>
            <SheetTrigger>
                <MenuIcon className="p-2 hover:opacity-30 rounded-lg" size={40}/>
            </SheetTrigger>
            <SheetContent side='left' className="w-80">
                <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <div className="mt-4 overflow-y-auto max-h-[80vh]">
                    {menuOptions}
                </div>
                </SheetHeader>
            </SheetContent>
        </Sheet>
        </div>
            <div className="hidden md:block max-w-xs">
            {menuOptions}
            </div>
    </div>
  )
}

export default Sidebar