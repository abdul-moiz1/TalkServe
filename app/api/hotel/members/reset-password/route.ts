import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebase-admin';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const adminUserId = await verifyAuthToken(authHeader);

    if (!adminUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, memberId } = body;

    if (!businessId || !memberId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    if (!db || !auth) {
      return NextResponse.json({ error: 'Backend services not available' }, { status: 500 });
    }

    // Get member details
    const memberSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .doc(memberId)
      .get();

    if (!memberSnapshot.exists) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const memberData = memberSnapshot.data();
    const newPassword = String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6);

    // Update password in Firebase Auth
    try {
      await auth.updateUser(memberId, { password: newPassword });
    } catch (error: any) {
      console.error('Error updating user password:', error);
      throw new Error('Failed to reset password');
    }

    // Update password in Firestore
    await memberSnapshot.ref.update({
      password: newPassword,
      passwordResetAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      password: newPassword,
      email: memberData.email,
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset password' },
      { status: 500 }
    );
  }
}
