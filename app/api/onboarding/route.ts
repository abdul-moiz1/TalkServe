import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, verifyAuthToken, getAdminStorage } from "@/lib/firebase-admin";

const FIREBASE_FUNCTION_URL = "https://onboarding-ieskeqprjq-uc.a.run.app";

async function uploadFileToStorage(file: File, userId: string): Promise<{ url: string; fileName: string } | null> {
  try {
    const storage = getAdminStorage();
    if (!storage) {
      console.error("Storage not available");
      return null;
    }

    const bucket = storage.bucket();
    const fileName = `business-context/${userId}/${Date.now()}_${file.name}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileRef = bucket.file(fileName);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log("File uploaded successfully:", publicUrl);
    return { url: publicUrl, fileName: file.name };
  } catch (error) {
    console.error("Error uploading file to storage:", error);
    return null;
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

    let businessContextUrl = docData?.businessContextUrl || null;
    let businessContextFileName = docData?.businessContextFileName || null;

    const file = formData.get("businessContext") as File | null;
    if (file && file.size > 0) {
      const uploadResult = await uploadFileToStorage(file, authenticatedUserId);
      if (uploadResult) {
        businessContextUrl = uploadResult.url;
        businessContextFileName = uploadResult.fileName;
      }
    }

    const updateData = {
      ownerName: formData.get("ownerName") as string,
      ownerEmail: formData.get("ownerEmail") as string,
      businessName: formData.get("businessName") as string,
      businessDescription: formData.get("businessDescription") as string,
      services: formData.get("services") as string,
      industryType: formData.get("industryType") as string,
      type: formData.get("type") as string,
      businessContextUrl,
      businessContextFileName,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    console.log("Onboarding updated successfully for document:", documentId);

    return NextResponse.json({
      success: true,
      message: "Onboarding updated successfully",
      data: { id: documentId, ...updateData },
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
    const authHeader = request.headers.get("Authorization");
    const authenticatedUserId = await verifyAuthToken(authHeader);

    if (!authenticatedUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database not available" },
        { status: 500 }
      );
    }

    let businessContextUrl: string | null = null;
    let businessContextFileName: string | null = null;

    const file = formData.get("businessContext") as File | null;
    if (file && file.size > 0) {
      const uploadResult = await uploadFileToStorage(file, authenticatedUserId);
      if (uploadResult) {
        businessContextUrl = uploadResult.url;
        businessContextFileName = uploadResult.fileName;
      }
    }

    const onboardingData = {
      user_id: authenticatedUserId,
      uid: authenticatedUserId,
      ownerName: formData.get("ownerName") as string,
      ownerEmail: formData.get("ownerEmail") as string,
      businessName: formData.get("businessName") as string,
      businessDescription: formData.get("businessDescription") as string,
      services: formData.get("services") as string,
      industryType: formData.get("industryType") as string,
      type: formData.get("type") as string,
      businessContextUrl,
      businessContextFileName,
      status: "active",
      submittedAt: new Date(),
    };

    // Use a transaction to ensure both onboarding and business are created
    const result = await db.runTransaction(async (transaction) => {
      const onboardingRef = db.collection("onboarding").doc();
      transaction.set(onboardingRef, onboardingData);

      let businessId = null;
      if (onboardingData.industryType === 'hotel') {
        const businessRef = db.collection("businesses").doc();
        transaction.set(businessRef, {
          name: onboardingData.businessName,
          type: 'hotel',
          ownerId: authenticatedUserId,
          createdAt: new Date().toISOString(),
          onboardingId: onboardingRef.id
        });
        businessId = businessRef.id;
      }

      // Update user document to link to business
      if (businessId) {
        const userRef = db.collection("users").doc(authenticatedUserId);
        transaction.update(userRef, { 
          businessId,
          hasCompletedOnboarding: true,
          updatedAt: new Date().toISOString()
        });
      }

      return { onboardingId: onboardingRef.id, businessId };
    });

    console.log("Onboarding and Business created successfully:", result);

    return NextResponse.json({
      success: true,
      message: "Onboarding submission received successfully",
      data: { id: result.onboardingId, businessId: result.businessId, ...onboardingData },
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
