import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyAuthToken } from "@/lib/firebase-admin";

const FIREBASE_FUNCTION_URL = "https://onboarding-ieskeqprjq-uc.a.run.app";

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

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    const onboardingRef = db.collection("onboarding");
    const snapshot = await onboardingRef.where("user_id", "==", authenticatedUserId).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        exists: false,
        data: null,
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log("Fetched onboarding data:", JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      exists: true,
      data: {
        id: doc.id,
        ...data,
      },
    });
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch onboarding data",
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

    const formData = await request.formData();
    const documentId = formData.get("documentId") as string;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: "Document ID is required for updates" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    const docRef = db.collection("onboarding").doc(documentId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    const docData = docSnapshot.data();
    if (docData?.user_id !== authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to update this document" },
        { status: 403 }
      );
    }
    
    const headers: HeadersInit = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    formData.append("_method", "PUT");

    const response = await fetch(FIREBASE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const errorText = await response.text();
        errorData = { error: errorText };
      }

      console.error("Firebase function error:", errorData);

      return NextResponse.json(
        {
          success: false,
          ...errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Onboarding updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating onboarding:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update onboarding",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    console.log("Onboarding submission received:", {
      uuid: formData.get("uuid"),
      ownerName: formData.get("ownerName"),
      ownerEmail: formData.get("ownerEmail"),
      businessName: formData.get("businessName"),
      industryType: formData.get("industryType"),
      type: formData.get("type"),
      file: formData.get("businessContext")
        ? `File: ${(formData.get("businessContext") as File).name}`
        : "No file uploaded",
    });

    const authHeader = request.headers.get("Authorization");
    
    const headers: HeadersInit = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(FIREBASE_FUNCTION_URL, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      } else {
        const errorText = await response.text();
        errorData = { error: errorText };
      }

      console.error("Firebase function error:", errorData);

      return NextResponse.json(
        {
          success: false,
          ...errorData,
        },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Onboarding submission received successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error processing onboarding:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process onboarding submission",
      },
      { status: 500 },
    );
  }
}
