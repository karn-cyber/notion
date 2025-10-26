import React from 'react'
import { auth } from '@clerk/nextjs/server';

async function DocLayout(
    {children,
    params,
    }: {
    children: React.ReactNode;
    params: Promise<{id: string}>;
}) {
    const { userId } = await auth();
    
    if (!userId) {
        throw new Error("User not authenticated");
    }
    
    // Await params but we don't need id in layout
    await params;
    
    return (
        <div className="max-w-6xl mx-auto p-5">
            {children}
        </div>
    );
}

export default DocLayout;