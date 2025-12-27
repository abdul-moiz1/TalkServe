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

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "Business ID is required" },
        { status: 400 },
      );
    }

    const scriptContent = `<script>
      window.AIVoiceWidgetConfig = {
        businessId: "${businessId}",
      };
    </script>
    <script src="https://talkserve.web.app/widget.js"><\/script>`;

    const chatWidgetUrl = "https://chat-ieskeqprjq-uc.a.run.app";

    return NextResponse.json({
      success: true,
      data: {
        script: scriptContent,
        businessId: businessId,
        chatWidgetUrl: chatWidgetUrl,
      },
    });
  } catch (error) {
    console.error("Error generating widget script:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate widget script",
      },
      { status: 500 },
    );
  }
}
