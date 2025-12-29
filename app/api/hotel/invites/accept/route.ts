import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteCode, businessId, role, department, email, fullName } = body;

    if (!inviteCode || !businessId || !role || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get the invite document
    const invitesSnapshot = await db
      .collection('invites')
      .where('code', '==', inviteCode)
      .where('businessId', '==', businessId)
      .limit(1)
      .get();

    if (invitesSnapshot.empty) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Check if already used
    if (inviteData.used) {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    }

    // Check if expired
    const expiresAt = inviteData.expiresAt?.toDate?.() || new Date(inviteData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    // Create member document
    const memberData = {
      userId,
      email,
      fullName,
      role,
      department: role === 'staff' || role === 'manager' ? department : null,
      status: 'active',
      createdAt: new Date(),
      inviteCode,
    };

    await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .doc(userId)
      .set(memberData);

    // Mark invite as used
    await inviteDoc.ref.update({
      used: true,
      usedAt: new Date(),
      usedBy: userId,
    });

    return NextResponse.json({
      success: true,
      member: memberData,
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
