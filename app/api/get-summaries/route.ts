import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customer = searchParams.get('customer');

    if (!customer) {
      return NextResponse.json(
        { error: "Customer phone number is required" },
        { status: 400 }
      );
    }

    const chatExperienceRef = db.collection('chatExperience');
    
    const querySnapshot = await chatExperienceRef
      .where('customer', '==', customer)
      .get();

    const summaries = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        const conversationDate = data.conversation_date?.toDate?.()?.toISOString?.()?.split('T')[0] 
          || (typeof data.conversation_date === 'string' ? data.conversation_date.split('T')[0] : data.conversation_date);
        return {
          id: doc.id,
          ...data,
          conversation_date: conversationDate,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
        };
      })
      .sort((a: any, b: any) => {
        const dateA = a.conversation_date || '';
        const dateB = b.conversation_date || '';
        return dateB.localeCompare(dateA);
      });

    return NextResponse.json({
      success: true,
      summaries
    });

  } catch (error) {
    console.error("Error fetching summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch summaries" },
      { status: 500 }
    );
  }
}
