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

    // Get user's accessible rooms from users collection
    const userRoomsByEmail = await adminDb
      .collectionGroup("rooms")
      .where("userId", "==", sessionClaims.email)
      .get();

    const userRoomsByUserId = await adminDb
      .collectionGroup("rooms")
      .where("userId", "==", userId)
      .get();

    // Also check documents where user is a collaborator
    const documentsQuery = await adminDb
      .collection("documents")
      .get();

    const accessibleRooms = new Map();

    // Add rooms from users collection
    const allRoomDocs = [...userRoomsByEmail.docs, ...userRoomsByUserId.docs];
    allRoomDocs.forEach(doc => {
      const data = doc.data();
      accessibleRooms.set(data.roomId, {
        role: data.role,
        source: 'rooms'
      });
    });

    // Check documents for collaborator access
    documentsQuery.docs.forEach(doc => {
      const data = doc.data();
      const collaborators = data.collaborators || [];
      
      // Check if user is owner
      if (data.userId === userId || data.userEmail === sessionClaims.email) {
        accessibleRooms.set(doc.id, {
          role: 'owner',
          source: 'document_owner'
        });
      }
      
      // Check if user is in collaborators array
      const userCollab = collaborators.find((c: any) => c.email === sessionClaims.email);
      if (userCollab) {
        accessibleRooms.set(doc.id, {
          role: userCollab.role,
          source: 'collaborator'
        });
      }
    });
    
    console.log(`🔍 Liveblocks Auth - User has access to ${accessibleRooms.size} rooms:`, 
      Array.from(accessibleRooms.entries()));

    // Grant access to rooms user owns/has access to
    for (const [roomId, roomInfo] of accessibleRooms) {
      const role = roomInfo.role;
      
      if (role === "owner" || role === "editor") {
        session.allow(roomId, session.FULL_ACCESS);
      } else {
        session.allow(roomId, ["room:read"]);
      }
      
      console.log(`✅ Granted ${role} access to room: ${roomId} (${roomInfo.source})`);
    }

    // For development: allow access to any room if user has no specific access
    if (accessibleRooms.size === 0) {
      console.log("🔍 No specific rooms found, allowing wildcard access for development");
      session.allow("*", session.FULL_ACCESS);
    }

    // Authorize the user and return the result
    const { status, body } = await session.authorize();
    console.log("✅ Liveblocks - Session authorized for user:", sessionClaims.email);
    return new Response(body, { status });
  } catch (error) {
    console.error("❌ Error in Liveblocks auth:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
