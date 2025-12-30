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
    const { businessId, email, fullName, phone, role, department } = body;

    if (!businessId || !email || !role || !fullName) {
      return NextResponse.json({ error: 'Missing required fields (Name, Email, and Role are mandatory)' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    if (!db || !auth) {
      return NextResponse.json({ error: 'Backend services not available' }, { status: 500 });
    }

    // Verify user is owner or admin of this business
    const businessRef = db.collection('businesses').doc(businessId);
    const businessDoc = await businessRef.get();

    if (!businessDoc.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessData = businessDoc.data();
    
    // Check if requester is owner OR is already a member with admin role
    const requesterMemberDoc = await businessRef.collection('members').doc(userId).get();
    const requesterData = requesterMemberDoc.data();
    const isOwner = businessData?.ownerId === userId;
    const isAdmin = requesterData?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - only business owners or admins can create team members' }, { status: 403 });
    }

    // Generate a secure temporary password
    const generatedPassword = crypto.randomBytes(6).toString('hex') + '!';

    try {
      // 1. Create User in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password: generatedPassword,
        displayName: fullName,
        phoneNumber: phone || undefined,
      });

      // 2. Add Member to Firestore business members collection
      await db.collection('businesses').doc(businessId).collection('members').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email,
        fullName,
        phone: phone || null,
        role,
        department: role === 'staff' || role === 'manager' ? department : null,
        status: 'active',
        createdAt: new Date(),
        businessId
      });

      return NextResponse.json({
        success: true,
        account: {
          email,
          password: generatedPassword,
          uid: userRecord.uid
        }
      });
    } catch (authError: any) {
      console.error('Auth Error:', authError);
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'This email is already registered in the system.' }, { status: 400 });
      }
      throw authError;
    }
  } catch (error) {
    console.error('Error creating staff account:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create staff account' },
      { status: 500 }
    );
  }
}
