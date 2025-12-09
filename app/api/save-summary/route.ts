import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { 
      customer,
      date,
      summary,
      sentiment,
      customerMood,
      keyTopics,
      rating,
      type
    } = await request.json();
    
    const conversationType = type || 'Whatsapp agent';

    if (!customer) {
      return NextResponse.json(
        { error: "Customer phone number is required" },
        { status: 400 }
      );
    }

    const chatExperienceRef = db.collection('chatExperience');
    
    const conversationId = `${customer}_${date || new Date().toISOString().split('T')[0]}`;
    
    let query = chatExperienceRef.where('customer', '==', customer);
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dateQuerySnapshot = await chatExperienceRef
        .where('customer', '==', customer)
        .where('conversation_date', '==', date)
        .limit(1)
        .get();
      
      if (!dateQuerySnapshot.empty) {
        const docRef = dateQuerySnapshot.docs[0].ref;
        await docRef.update({
          summary,
          customer_mood: customerMood,
          sentiment,
          key_topics: keyTopics,
          rating,
          updated_at: new Date()
        });

        return NextResponse.json({
          success: true,
          message: "Summary updated successfully",
          docId: dateQuerySnapshot.docs[0].id
        });
      }
    }

    const querySnapshot = await query.limit(1).get();

    if (querySnapshot.empty) {
      const newDoc = await chatExperienceRef.add({
        customer,
        customer_name: customer,
        conversation_date: date || new Date().toISOString().split('T')[0],
        conversation_id: conversationId,
        summary,
        customer_mood: customerMood,
        sentiment,
        key_topics: keyTopics,
        rating,
        created_at: new Date(),
        updated_at: new Date(),
        type: conversationType
      });

      return NextResponse.json({
        success: true,
        message: "Summary created successfully",
        docId: newDoc.id
      });
    } else {
      const existingDoc = querySnapshot.docs[0];
      const existingData = existingDoc.data();
      
      if (existingData.conversation_date === date || !existingData.conversation_date) {
        const docRef = existingDoc.ref;
        await docRef.update({
          summary,
          customer_mood: customerMood,
          sentiment,
          key_topics: keyTopics,
          rating,
          conversation_date: date || existingData.conversation_date,
          updated_at: new Date()
        });

        return NextResponse.json({
          success: true,
          message: "Summary updated successfully",
          docId: existingDoc.id
        });
      } else {
        const newDoc = await chatExperienceRef.add({
          customer,
          customer_name: customer,
          conversation_date: date || new Date().toISOString().split('T')[0],
          conversation_id: conversationId,
          summary,
          customer_mood: customerMood,
          sentiment,
          key_topics: keyTopics,
          rating,
          created_at: new Date(),
          updated_at: new Date(),
          type: conversationType
        });

        return NextResponse.json({
          success: true,
          message: "New summary created for different date",
          docId: newDoc.id
        });
      }
    }

  } catch (error) {
    console.error("Error saving summary:", error);
    return NextResponse.json(
      { error: "Failed to save summary" },
      { status: 500 }
    );
  }
}
