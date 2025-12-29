import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const businessId = searchParams.get('businessId');

    if (!code || !businessId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Find invite by code
    const invitesRef = db.collection('invites');
    const snapshot = await invitesRef
      .where('code', '==', code)
      .where('businessId', '==', businessId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Check if expired
    if (inviteData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 400 });
    }

    // Check if already used
    if (inviteData.used) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 400 });
    }

    // Get business info
    const businessDoc = await db.collection('businesses').doc(businessId).get();
    if (!businessDoc.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: inviteDoc.id,
        code,
        businessId,
        email: inviteData.email,
        role: inviteData.role,
        department: inviteData.department,
        preferredLanguage: inviteData.preferredLanguage,
      },
      business: {
        id: businessDoc.id,
        name: businessDoc.data()?.name,
        type: businessDoc.data()?.type,
      },
    });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to validate invite' },
      { status: 500 }
    );
  }
}
