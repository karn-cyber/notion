"use client";
import React from 'react';
import { MenuIcon } from 'lucide-react';

function Sidebar() {
  return (
    <div className='p-2 md:p-5 bg-gray-200 relative'>
        <div className='md:hidden'>
            <div className="p-2">
                <MenuIcon className="p-2 hover:opacity-30 rounded-lg" size={40}/>
            </div>
        </div>
        
        <div className="hidden md:inline">
            <div className="space-y-4">
                <button className="w-full p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    + New Document
                </button>
                
                <div>
                    <h2 className='font-bold mb-3'>Documents</h2>
                    <div className="space-y-2">
                        <div className="p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                            📄 Document 1
                        </div>
                        <div className="p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                            📄 Document 2
                        </div>
                        <div className="p-2 bg-white rounded hover:bg-gray-50 cursor-pointer">
                            📄 Document 3
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Sidebar
