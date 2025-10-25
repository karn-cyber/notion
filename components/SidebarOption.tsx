import { db } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react'
import { useDocumentData} from 'react-firebase-hooks/firestore';


function SidebarOption({href,id}: {href: string; id: string}) {
    const [data,loading,error] = useDocumentData(doc(db,"documents",id));
    const pathname = usePathname();
    const isActive = href.includes(pathname) && pathname!=="/";

    if(!data) return null;
  return (
    <Link href={href} className="text-sm text-gray-700 hover:bg-gray-100 p-2 rounded cursor-pointer block"><p className='truncate'>{data.title}</p>
    </Link>
  )
}

export default SidebarOption