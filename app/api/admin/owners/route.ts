import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyAuthToken, getAdminAuth } from "@/lib/firebase-admin";

const ADMIN_EMAILS = [
  "admin@talkserve.com",
  "support@talkserve.com",
  "abdulmoiz6501@gmail.com",
];

async function verifyAdminAccess(authenticatedUserId: string): Promise<boolean> {
  const adminAuth = getAdminAuth();
  if (!adminAuth) return false;
  
  try {
    const userRecord = await adminAuth.getUser(authenticatedUserId);
    const userEmail = (userRecord.email || "").toLowerCase();
    return ADMIN_EMAILS.includes(userEmail);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const authenticatedUserId = await verifyAuthToken(authHeader);

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = await verifyAdminAccess(authenticatedUserId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    const onboardingRef = db.collection("onboarding");
    const snapshot = await onboardingRef.orderBy("submittedAt", "desc").get();

    const owners = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerName: data.ownerName || "",
        ownerEmail: data.ownerEmail || "",
        businessName: data.businessName || "",
        industryType: data.industryType || "",
        type: data.type || "",
        status: data.status || "pending",
        submittedAt: data.submittedAt?.toDate?.() || data.submittedAt || null,
        assignedNumber: data.assignedNumber || null,
        customersCount: data.customersCount || 0,
        totalMessages: data.totalMessages || 0,
        uuid: data.uuid || data.user_id || "",
      };
    });

    return NextResponse.json({
      success: true,
      owners,
      total: owners.length,
    });
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch owners",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const authenticatedUserId = await verifyAuthToken(authHeader);

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = await verifyAdminAccess(authenticatedUserId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { ownerId, assignedNumber, status, customersCount, totalMessages } = body;

    if (!ownerId) {
      return NextResponse.json(
        { success: false, error: "Owner ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (assignedNumber !== undefined) updateData.assignedNumber = assignedNumber;
    if (status !== undefined) updateData.status = status;
    if (customersCount !== undefined) updateData.customersCount = customersCount;
    if (totalMessages !== undefined) updateData.totalMessages = totalMessages;

    await db.collection("onboarding").doc(ownerId).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Owner updated successfully",
    });
  } catch (error) {
    console.error("Error updating owner:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update owner",
      },
      { status: 500 }
    );
  }
}
