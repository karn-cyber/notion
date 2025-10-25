"use server"

import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server"

export async function createNewDocument(){
   const {sessionClaims} = await auth();

    // Check if user is authenticated and has email
    if (!sessionClaims?.email) {
        throw new Error("User not authenticated or email not available");
    }

    const userEmail = sessionClaims.email;

    const docCollectionRef = adminDb.collection("documents");
    const docRef = await docCollectionRef.add({
        title: "New Doc",
    });

    // Create user-document relationship
    await adminDb
    .collection('users')
    .doc(userEmail)
    .collection('rooms')
    .doc(docRef.id)
    .set({
        userId: userEmail,
        role: "owner",
        createdAt: new Date(),
        roomId: docRef.id,
    });

    return { docId: docRef.id };
}