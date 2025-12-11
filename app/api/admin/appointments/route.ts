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

    const appointmentsRef = db.collection("appointments");
    const snapshot = await appointmentsRef.orderBy("created_at", "desc").get();

    const appointments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        appointmentDate: data.appointment_date || "",
        appointmentTime: data.appointment_time || "",
        confirmationMethod: data.confirmation_method || "",
        createdAt: data.created_at?.toDate?.() || data.created_at || null,
        userEmail: data.user_email || "",
        userIndustry: data.user_industry || "",
        userName: data.user_name || "",
        userPhone: data.user_phone || "",
        userService: data.user_service || "",
      };
    });

    return NextResponse.json({
      success: true,
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch appointments",
      },
      { status: 500 },
    );
  }
}
