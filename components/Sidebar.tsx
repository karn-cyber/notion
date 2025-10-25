"use client";
import React, { useEffect } from 'react';
import NewDocumentButton from './NewDocumentButton';
import {useCollection} from "react-firebase-hooks/firestore";

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
        <>
            <NewDocumentButton/>

            {/* My Documents */}
            <div className='mt-5'>
                <h2 className='font-bold mb-3'>Documents</h2>
                {groupedData.owner.length === 0 ? (
                    <p className='text-sm text-gray-500'>No Documents Found</p>
                ) : (
                    <>
                        <h3 className='mb-2 font-semibold text-sm'>My Documents</h3>
                        {groupedData.owner.map((doc) => (
                            <SidebarOption key={doc.id} id={doc.id} href={`/doc/${doc.id}`} />
                        ))}
                    </>
                )}

                {/* Shared With Me */}
                {groupedData.editor.length > 0 && (
                    <>
                        <h3 className='mt-4 mb-2 font-semibold text-sm'>Shared With Me</h3>
                        {groupedData.editor.map((doc) => (
                            <p key={doc.id} className="text-sm text-gray-700 hover:bg-gray-100 p-2 rounded cursor-pointer">
                                {doc.id}
                            </p>
                        ))}
                    </>
                )}
            </div>
        </> 
    )
  return (
    <div className='p-2 md:p-5 bg-gray-200 relative'>
        <div className='md:hidden'>
        <Sheet>
            <SheetTrigger>
                <MenuIcon className="p-2 hover:opacity-30 rounded-lg" size={40}/>
            </SheetTrigger>
            <SheetContent side='left'>
                <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <div>
                    {menuOptions}
                </div>
                </SheetHeader>
            </SheetContent>
        </Sheet>
        </div>
            <div className="hidden md:inline">
            {menuOptions}
            </div>
    </div>
  )
}

export default Sidebar