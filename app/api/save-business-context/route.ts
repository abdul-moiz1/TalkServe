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

    const { uid, businessName, context } = await request.json();

    if (!uid || !businessName) {
      return NextResponse.json(
        { error: "User ID and business name are required" },
        { status: 400 }
      );
    }

    const businessesRef = db.collection("businesses");
    
    // Find existing business for this user
    const existingBusiness = await businessesRef
      .where("uid", "==", uid)
      .limit(1)
      .get();

    let result;
    if (!existingBusiness.empty) {
      // Update existing business
      const docRef = existingBusiness.docs[0].ref;
      await docRef.update({
        businessName,
        context: {
          ...existingBusiness.docs[0].data().context,
          ...context,
          updatedAt: new Date()
        }
      });
      result = {
        success: true,
        message: "Business context updated successfully",
        docId: existingBusiness.docs[0].id
      };
    } else {
      // Create new business
      const newDoc = await businessesRef.add({
        uid,
        businessName,
        context: {
          ...context,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      result = {
        success: true,
        message: "Business context created successfully",
        docId: newDoc.id
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving business context:", error);
    return NextResponse.json(
      { error: "Failed to save business context" },
      { status: 500 }
    );
  }
}

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
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const businessesRef = db.collection("businesses");
    const querySnapshot = await businessesRef
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    const doc = querySnapshot.docs[0];
    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error("Error fetching business context:", error);
    return NextResponse.json(
      { error: "Failed to fetch business context" },
      { status: 500 }
    );
  }
}
