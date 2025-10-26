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

export async function deleteDocument(docId: string) {
    const { userId } = await auth();
    const { sessionClaims } = await auth();

    if (!sessionClaims?.email || !userId) {
        throw new Error("User not authenticated or email not available");
    }

    const userEmail = sessionClaims.email;

    console.log("🗑️ [UPDATED] Deleting document:", { docId, userId, email: userEmail });

    try {
        // Check if user owns the document
        const docRef = adminDb.collection("documents").doc(docId);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new Error("Document not found");
        }

        const docData = doc.data();
        
        // Debug: Log document data and user data for comparison
        console.log("📋 Document data:", {
            docUserId: docData?.userId,
            docUserEmail: docData?.userEmail,
            currentUserId: userId,
            currentUserEmail: userEmail
        });

        // Check document ownership - either in document data or in rooms collection
        const documentOwnership = docData?.userId === userId || 
                                 docData?.userEmail === userEmail ||
                                 docData?.userId === userEmail; // Sometimes userId might be stored as email

        // If document doesn't have ownership data, check rooms collection
        let roomsOwnership = false;
        if (!documentOwnership) {
            try {
                const roomDoc = await adminDb
                    .collection('users')
                    .doc(userEmail)
                    .collection('rooms')
                    .doc(docId)
                    .get();
                
                roomsOwnership = roomDoc.exists && roomDoc.data()?.role === 'owner';
                console.log("🏠 Rooms ownership check:", { exists: roomDoc.exists, role: roomDoc.data()?.role });
            } catch (error) {
                console.log("⚠️ Could not check rooms ownership:", error);
            }
        }

        const isOwner = documentOwnership || roomsOwnership;

        if (!isOwner) {
            console.error("❌ Authorization failed:", {
                docUserId: docData?.userId,
                docUserEmail: docData?.userEmail,
                currentUserId: userId,
                currentUserEmail: userEmail,
                documentOwnership,
                roomsOwnership
            });
            throw new Error("Not authorized to delete this document");
        }

        console.log("✅ Authorization successful, proceeding with deletion");

        // Delete the document
        await docRef.delete();

        // Delete the user-document relationship
        await adminDb
            .collection('users')
            .doc(userEmail)
            .collection('rooms')
            .doc(docId)
            .delete();

        // Also delete any other user relationships with this document
        const allUserRooms = await adminDb
            .collectionGroup('rooms')
            .where('roomId', '==', docId)
            .get();

        const deletePromises = allUserRooms.docs.map(roomDoc => roomDoc.ref.delete());
        await Promise.all(deletePromises);

        console.log("✅ [UPDATED] Document deleted successfully:", { docId, userId, email: userEmail });

        return { success: true };
    } catch (error) {
        console.error("❌ Error deleting document:", error);
        throw error;
    }
}