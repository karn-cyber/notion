import { adminDb } from "@/firebase-admin";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userEmail, documentId, role } = await request.json();

    if (!userEmail || !documentId || !role) {
      return NextResponse.json({ 
        error: "Missing required fields: userEmail, documentId, role" 
      }, { status: 400 });
    }

    console.log("🏠 Creating room access for:", { userEmail, documentId, role });

    // Create room access entry for the collaborator
    await adminDb
      .collection('users')
      .doc(userEmail)
      .collection('rooms')
      .doc(documentId)
      .set({
        userId: userEmail,
        role: role,
        createdAt: new Date(),
        roomId: documentId,
        invitedBy: userId
      });

    console.log("✅ Room access created for:", userEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error creating room access:", error);
    return NextResponse.json({ 
      error: "Failed to create room access" 
    }, { status: 500 });
  }
}
