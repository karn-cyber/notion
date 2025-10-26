import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();
    const { sessionClaims } = await auth();
    
    if (!userId || !sessionClaims?.email) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        // Get all rooms for this user (try both email and userId)
        const allUserRoomsByEmail = await adminDb
            .collectionGroup("rooms")
            .where("userId", "==", sessionClaims.email)
            .get();
        
        const allUserRoomsByUserId = await adminDb
            .collectionGroup("rooms")
            .where("userId", "==", userId)
            .get();
        
        // Combine results and remove duplicates
        const allRoomDocs = [...allUserRoomsByEmail.docs, ...allUserRoomsByUserId.docs];
        const uniqueRooms = new Map();
        allRoomDocs.forEach(doc => {
            uniqueRooms.set(doc.id, doc);
        });
        const allUserRooms = Array.from(uniqueRooms.values());

        const rooms = allUserRooms.map(doc => ({
            id: doc.id,
            path: doc.ref.path,
            data: doc.data()
        }));

        return NextResponse.json({
            userId,
            email: sessionClaims.email,
            roomCount: rooms.length,
            rooms: rooms
        });
    } catch (error) {
        console.error("Error fetching user rooms:", error);
        return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
}
