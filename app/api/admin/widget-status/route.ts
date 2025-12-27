import { NextRequest, NextResponse } from "next/server";
import {
  getAdminDb,
  verifyAuthToken,
  getAdminAuth,
} from "@/lib/firebase-admin";

const ADMIN_EMAILS = [
  "admin@talkserve.com",
  "admin@talkserve.ca",
  "support@talkserve.ca",
];

async function verifyAdminAccess(
  authenticatedUserId: string,
): Promise<boolean> {
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
        { status: 401 },
      );
    }

    const isAdmin = await verifyAdminAccess(authenticatedUserId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get("uuid");

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: "UUID is required" },
        { status: 400 },
      );
    }

    const businessContextRef = db.collection("business_context");
    const snapshot = await businessContextRef.where("uid", "==", uuid).get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: {
          widgetActive: false,
          widgetScript: null,
          businessSettings: null,
        },
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        widgetActive: data.widgetActive || false,
        businessName: data.businessName || "",
        businessSettings: data.context || {},
        widgetScript: null,
      },
    });
  } catch (error) {
    console.error("Error fetching widget status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch widget status",
      },
      { status: 500 },
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
        { status: 401 },
      );
    }

    const isAdmin = await verifyAdminAccess(authenticatedUserId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { uuid, widgetActive, businessSettings } = body;

    if (!uuid) {
      return NextResponse.json(
        { success: false, error: "UUID is required" },
        { status: 400 },
      );
    }

    // Query the correct 'businesses' collection
    const businessesRef = db.collection("businesses");
    const snapshot = await businessesRef.where("uid", "==", uuid).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Business not found" },
        { status: 404 },
      );
    }

    const doc = snapshot.docs[0];
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (widgetActive !== undefined) {
      updateData.widgetActive = widgetActive;
    }

    if (businessSettings !== undefined) {
      updateData.context = businessSettings;
    }

    await db.collection("businesses").doc(doc.id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Widget status updated successfully",
    });
  } catch (error) {
    console.error("Error updating widget status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update widget status",
      },
      { status: 500 },
    );
  }
}
