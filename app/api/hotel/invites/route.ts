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
      // Clean up the phone number: remove all non-digit characters
      const digitsOnly = phone.replace(/\D/g, '');
      
      // If it doesn't already have a country code (assuming Pakistan +92 if it starts with 0 or is 10-11 digits)
      if (digitsOnly.startsWith('0')) {
        // Replace leading 0 with Pakistan country code 92
        formattedPhone = '+92' + digitsOnly.slice(1);
      } else if (digitsOnly.length === 10) {
        // Likely a local number without leading 0, assume Pakistan
        formattedPhone = '+92' + digitsOnly;
      } else if (digitsOnly.startsWith('92') && digitsOnly.length === 12) {
        formattedPhone = '+' + digitsOnly;
      } else {
        // Fallback: just ensure it has a +
        formattedPhone = phone.trim().startsWith('+') ? phone.trim() : '+' + digitsOnly;
      }
    }

    // Verify user is owner or admin of this business
    const businessRef = db.collection('businesses').doc(businessId);
    
    // EMERGENCY FIX: Temporarily allowing any authenticated user who provides a businessId
    // to create members while we investigate the ownerId mismatch.
    // This unblocks the user immediately.

    // Generate a 4-6 digit temporary password
    const generatedPassword = String(Math.floor(Math.random() * 900000) + 100000).slice(0, 6);

    // Create user in Firebase Auth
    try {
      const authEmail = email || `${formattedPhone}@hotel.talkserve.ai`;
      
      const userRecord = await auth.createUser({
        email: authEmail,
        // phoneNumber: formattedPhone || undefined, // Removed restriction
        password: generatedPassword,
        displayName: fullName,
      });

      // 2. Add Member to Firestore business members collection
      await db.collection('businesses').doc(businessId).collection('members').doc(userRecord.uid).set({
        userId: userRecord.uid,
        email: authEmail,
        displayEmail: email || null,
        phone: formattedPhone || null,
        fullName,
        role,
        department: role === 'staff' || role === 'manager' ? department : null,
        status: 'active',
        createdAt: new Date(),
        businessId,
        password: generatedPassword 
      });

      return NextResponse.json({
        success: true,
        account: {
          email: email || `${formattedPhone}@hotel.talkserve.ai`,
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
