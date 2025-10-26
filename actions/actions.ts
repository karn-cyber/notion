"use server"

import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server"

export async function createNewDocument(){
   const { userId } = await auth();
   const {sessionClaims} = await auth();

    // Check if user is authenticated and has email
    if (!sessionClaims?.email || !userId) {
        throw new Error("User not authenticated or email not available");
    }

    const userEmail = sessionClaims.email;

    console.log("📝 Creating document for user:", { userId, email: userEmail });

    const docCollectionRef = adminDb.collection("documents");
    const docRef = await docCollectionRef.add({
        title: "New Doc",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: userId,
        userEmail: userEmail,
        collaborators: [], // Initialize empty collaborators array
        isPublic: false, // Initialize sharing settings
        shareLink: null
    });

    // Create user-document relationship
    await adminDb
    .collection('users')
    .doc(userEmail)
    .collection('rooms')
    .doc(docRef.id)
    .set({
        userId: userEmail, // Keep email for backward compatibility
        clerkUserId: userId, // Add Clerk userId for future use
        role: "owner",
        createdAt: new Date(),
        roomId: docRef.id,
    });

    console.log("✅ Document created:", { docId: docRef.id, userId, email: userEmail });

    return { docId: docRef.id };
}