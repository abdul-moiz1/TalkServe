import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, verifyAuthToken } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || !memberId) {
      return NextResponse.json({ error: 'Missing businessId or memberId' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const memberDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, member: { id: memberDoc.id, ...memberDoc.data() } });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || !memberId) {
      return NextResponse.json({ error: 'Missing businessId or memberId' }, { status: 400 });
    }

    const body = await request.json();
    const { fullName, phone, role, department, status, preferredLanguage } = body;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Backend services not available' }, { status: 500 });
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Update member document
    await db.collection('businesses')
      .doc(businessId)
      .collection('members')
      .doc(memberId)
      .update(updateData);

    return NextResponse.json({ success: true, data: updateData });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || !memberId) {
      return NextResponse.json({ error: 'Missing businessId or memberId' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    if (!db || !auth) {
      return NextResponse.json({ error: 'Backend services not available' }, { status: 500 });
    }

    // 1. Delete from Firestore
    await db.collection('businesses').doc(businessId).collection('members').doc(memberId).delete();

    // 2. Delete from Firebase Auth (Optional: keep auth user but remove business link)
    // For a cleaner "hotel management" experience, we usually just remove the link in Firestore
    // unless you want to fully delete the account. Let's stick to Firestore deletion for now.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove member' },
      { status: 500 }
    );
  }
}
