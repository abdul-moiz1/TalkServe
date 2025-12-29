import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, verifyAuthToken } from '@/lib/firebase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, email, role, department, preferredLanguage } = body;

    if (!businessId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Verify user is admin of this business
    const businessRef = db.collection('businesses').doc(businessId);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessDoc.data();
    if (businessData?.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden - not business owner' }, { status: 403 });
    }

    // Generate invite code
    const inviteCode = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invite document
    const inviteData = {
      businessId,
      email,
      role,
      department: role === 'staff' || role === 'manager' ? department : null,
      preferredLanguage: preferredLanguage || 'en',
      code: inviteCode,
      createdAt: new Date(),
      expiresAt,
      used: false,
      usedAt: null,
      usedBy: null,
    };

    const inviteRef = await db.collection('invites').add(inviteData);

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invite?code=${inviteCode}&businessId=${businessId}`;

    // TODO: Send email with invite link
    // await sendInviteEmail(email, inviteLink, businessData.name, role);

    return NextResponse.json({
      success: true,
      invite: {
        id: inviteRef.id,
        code: inviteCode,
        link: inviteLink,
        email,
        role,
        department,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create invite' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Verify user is admin
    const businessRef = db.collection('businesses').doc(businessId);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists || businessDoc.data()?.ownerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all invites for this business
    const invitesRef = db.collection('invites');
    const snapshot = await invitesRef.where('businessId', '==', businessId).get();

    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}
