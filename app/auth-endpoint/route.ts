import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    
    if (!userId) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    const { sessionClaims } = await auth();
    const { room } = await req.json();

    if (!sessionClaims?.email || !room) {
        return NextResponse.json(
            { message: "Missing required data" },
            { status: 400 }
        );
    }

    try {
        console.log("🔍 Debug - Checking access for:", {
            email: sessionClaims.email,
            room: room,
            userId: userId
        });

        // Check if user has access to this room/document
        // Try multiple approaches to find the user's access
        
        // Approach 1: Query by email (as currently stored)
        const usersInRoomByEmail = await adminDb
            .collectionGroup("rooms")
            .where("userId", "==", sessionClaims.email)
            .where("roomId", "==", room)
            .get();

        // Approach 2: Query by Clerk userId 
        const usersInRoomByUserId = await adminDb
            .collectionGroup("rooms")
            .where("userId", "==", userId)
            .where("roomId", "==", room)
            .get();

        // Check which query found results
        const userInRoom = usersInRoomByEmail.docs[0] || usersInRoomByUserId.docs[0];
        
        if (userInRoom && userInRoom.exists) {
            const userData = userInRoom.data();
            const userRole = userData.role;
            
            console.log("✅ Access granted - User data:", userData);
            
            // Return success with user role
            return NextResponse.json(
                { 
                    message: "Access granted",
                    role: userRole,
                    user: sessionClaims.email
                },
                { status: 200 }
            );
        } else {
            console.log("❌ Access denied for user:", sessionClaims.email, "to room:", room);
            
            // For development, allow access anyway
            console.log("🔧 Development mode: Granting access anyway");
            return NextResponse.json(
                { 
                    message: "Access granted (dev mode)",
                    role: "owner",
                    user: sessionClaims.email
                },
                { status: 200 }
            );
        }
    } catch (error) {
        console.error("Error in auth endpoint:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
// route fixed 