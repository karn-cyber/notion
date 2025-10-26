"use client"
import React, { useState } from 'react'

function Document({id}:{id:string}) {
    const [content, setContent] = useState("Start writing your document here...");

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-green-700 font-medium">✅ Document Loaded Successfully!</div>
                <div className="text-green-600 text-sm">Document ID: {id}</div>
            </div>
            
            {/* Title */}
            <div className="flex space-x-2"> 
                <input 
                    type="text"
                    placeholder="Document Title"
                    className="flex-1 text-lg font-medium p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Update
                </button>
            </div>
            
            {/* Editor */}
            <div className="border rounded-lg">
                <div className="p-3 bg-gray-50 border-b text-sm text-gray-600">
                    Simple Editor (Real-time collaboration will be added back)
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-96 p-4 border-none outline-none resize-none"
                    placeholder="Start writing..."
                />
            </div>
        </div>
    );
}

export default Document;
