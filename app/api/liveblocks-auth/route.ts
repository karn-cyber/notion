import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST() {
  const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionClaims } = await auth();
  
  if (!sessionClaims?.email) {
    return new Response("Missing user info", { status: 400 });
  }

  try {
    console.log("🔍 Liveblocks Auth - Creating session for:", {
      email: sessionClaims.email,
      userId: userId
    });

    // Create Liveblocks session  
    const session = liveblocks.prepareSession(sessionClaims.email as string, {
      userInfo: {
        name: sessionClaims.email as string,
        email: sessionClaims.email as string,
        avatar: "",
      },
    });

    // Get user's accessible rooms
    const userRoomsByEmail = await adminDb
      .collectionGroup("rooms")
      .where("userId", "==", sessionClaims.email)
      .get();

    const userRoomsByUserId = await adminDb
      .collectionGroup("rooms")
      .where("userId", "==", userId)
      .get();

    // Combine results and remove duplicates
    const allRoomDocs = [...userRoomsByEmail.docs, ...userRoomsByUserId.docs];
    const uniqueRooms = new Map();
    allRoomDocs.forEach(doc => {
      const data = doc.data();
      uniqueRooms.set(data.roomId, doc);
    });
    
    console.log(`🔍 Liveblocks Auth - User has access to ${uniqueRooms.size} rooms`);

    // Grant access to rooms user owns/has access to
    for (const [roomId, roomDoc] of uniqueRooms) {
      const roomData = roomDoc.data();
      const role = roomData.role;
      
      if (role === "owner" || role === "editor") {
        session.allow(roomId, session.FULL_ACCESS);
      } else {
        session.allow(roomId, ["room:read"]);
      }
      
      console.log(`✅ Granted ${role} access to room: ${roomId}`);
    }

    // If user has no specific rooms, allow access to any room they try to join
    // This is for development - in production you'd be more restrictive
    if (uniqueRooms.size === 0) {
      console.log("🔍 No specific rooms found, allowing wildcard access for development");
      session.allow("*", session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body } = await session.authorize();
    console.log("✅ Liveblocks - Session authorized for user:", sessionClaims.email);
    return new Response(body, { status });
  } catch (error) {
    console.error("Error in Liveblocks auth:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
