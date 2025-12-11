import { NextRequest, NextResponse } from "next/server";
import {
  getAdminDb,
  verifyAuthToken,
  getAdminAuth,
} from "@/lib/firebase-admin";
import { createCalendarEvent } from "@/lib/googleCalendar";

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

function parseAppointmentDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } | null {
  try {
    const months: { [key: string]: number } = {
      'january': 0, 'february': 1, 'march': 2, 'april': 3,
      'may': 4, 'june': 5, 'july': 6, 'august': 7,
      'september': 8, 'october': 9, 'november': 10, 'december': 11
    };

    const dateMatch = dateStr.match(/(\w+)\s+(\d+)/i);
    if (!dateMatch) return null;

    const monthName = dateMatch[1].toLowerCase();
    const day = parseInt(dateMatch[2]);
    const month = months[monthName];
    
    if (month === undefined) return null;

    const year = new Date().getFullYear();

    let hours = 9;
    let minutes = 0;
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(am|pm)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3]?.toLowerCase();
        
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
      }
    }

    const start = new Date(year, month, day, hours, minutes);
    const end = new Date(year, month, day, hours + 1, minutes);

    return { start, end };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { appointmentIds } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No appointments selected" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 },
      );
    }

    const results: { id: string; success: boolean; error?: string; eventId?: string }[] = [];

    for (const appointmentId of appointmentIds) {
      try {
        const docRef = db.collection("appointments").doc(appointmentId);
        const doc = await docRef.get();

        if (!doc.exists) {
          results.push({ id: appointmentId, success: false, error: "Appointment not found" });
          continue;
        }

        const data = doc.data();
        if (!data) {
          results.push({ id: appointmentId, success: false, error: "No data" });
          continue;
        }

        if (data.calendar_synced) {
          results.push({ id: appointmentId, success: true, eventId: data.calendar_event_id });
          continue;
        }

        const dateTime = parseAppointmentDateTime(
          data.appointment_date || "",
          data.appointment_time || ""
        );

        if (!dateTime) {
          results.push({ id: appointmentId, success: false, error: "Could not parse date/time" });
          continue;
        }

        const event = await createCalendarEvent({
          summary: `TalkServe Appointment: ${data.user_name}`,
          description: `Service: ${data.user_service || 'N/A'}\nPhone: ${data.user_phone || 'N/A'}\nEmail: ${data.user_email || 'N/A'}\nIndustry: ${data.user_industry || 'N/A'}\nConfirmation Method: ${data.confirmation_method || 'N/A'}`,
          startDateTime: dateTime.start.toISOString(),
          endDateTime: dateTime.end.toISOString(),
          attendeeEmail: data.user_email || undefined,
        });

        await docRef.update({
          calendar_synced: true,
          calendar_event_id: event.id,
          calendar_synced_at: new Date(),
        });

        results.push({ id: appointmentId, success: true, eventId: event.id });
      } catch (err) {
        console.error(`Error syncing appointment ${appointmentId}:`, err);
        results.push({
          id: appointmentId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Synced ${successCount} appointments${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
      syncedCount: successCount,
      failedCount: failCount,
    });
  } catch (error) {
    console.error("Error syncing to calendar:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync to calendar",
      },
      { status: 500 },
    );
  }
}
