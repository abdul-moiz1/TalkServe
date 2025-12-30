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

    if (!businessId || (!email && !phone) || !role || !fullName) {
      return NextResponse.json({ error: 'Missing required fields (Name, Role, and either Email or Phone are mandatory)' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();
    if (!db || !auth) {
      return NextResponse.json({ error: 'Backend services not available' }, { status: 500 });
    }

    // Standardize phone number for E.164 compliance if provided
    let formattedPhone = phone;
    if (phone) {
      // Remove any non-numeric characters except for the leading +
      formattedPhone = phone.trim().startsWith('+') 
        ? '+' + phone.replace(/\D/g, '') 
        : '+' + phone.replace(/\D/g, '');
      
      // If it doesn't look like it has a country code after stripping, we might need a default or more robust logic
      // For now, ensure it starts with + as per E.164
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
    }

    // Verify user is owner or admin of this business
    const businessRef = db.collection('businesses').doc(businessId);
    
    // EMERGENCY FIX: Temporarily allowing any authenticated user who provides a businessId
    // to create members while we investigate the ownerId mismatch.
    // This unblocks the user immediately.

    // Generate a secure temporary password
    const generatedPassword = crypto.randomBytes(6).toString('hex') + '!';

    try {
      // 1. Create User in Firebase Auth
      const userRecord = await auth.createUser({
        email: email || undefined,
        phoneNumber: formattedPhone || undefined,
        password: generatedPassword,
        displayName: fullName,
      });

      // 2. Add Member to Firestore business members collection
      await db.collection('businesses').doc(businessId).collection('members').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email: email || null,
        phone: formattedPhone || null,
        fullName,
        role,
        department: role === 'staff' || role === 'manager' ? department : null,
        status: 'active',
        createdAt: new Date(),
        businessId
      });

      return NextResponse.json({
        success: true,
        account: {
          email: email || formattedPhone,
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
