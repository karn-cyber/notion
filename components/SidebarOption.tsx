import { db } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useTransition } from 'react'
import { useDocumentData} from 'react-firebase-hooks/firestore';
import { Trash2 } from 'lucide-react';
import { deleteDocument } from '@/actions/actions';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

function SidebarOption({href,id}: {href: string; id: string}) {
    const [data] = useDocumentData(doc(db,"documents",id));
    const [isPending, startTransition] = useTransition();
    const [isHovered, setIsHovered] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isActive = href.includes(pathname) && pathname!=="/";

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        startTransition(async () => {
            try {
                await deleteDocument(id);
                // If we're currently viewing the deleted document, redirect to home
                if (pathname === href) {
                    router.push('/');
                }
            } catch (error) {
                console.error('Failed to delete document:', error);
                alert('Failed to delete document. Please try again.');
            }
        });
    };

    if(!data) return null;

    return (
        <>
            <div 
                className="relative group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Link 
                    href={href} 
                    className={`text-sm text-gray-700 hover:bg-gray-100 p-2 rounded cursor-pointer block pr-8 ${
                        isActive ? 'bg-gray-200 font-medium' : ''
                    }`}
                >
                    <p className='truncate'>{data.title}</p>
                </Link>
                
                {(isHovered || isPending) && (
                    <button
                        onClick={handleDeleteClick}
                        disabled={isPending}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-red-100 transition-colors ${
                            isPending ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'
                        }`}
                        title="Delete document"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <DeleteDocumentDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteConfirm}
                documentTitle={data.title || 'Untitled Document'}
                isDeleting={isPending}
            />
        </>
    )
}

export default SidebarOption