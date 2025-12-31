import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get user document to retrieve business_number
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Check onboarding for hotel status
    const onboardingSnapshot = await db.collection('onboarding')
      .where('user_id', '==', userId)
      .where('industryType', '==', 'hotel')
      .get();

    if (!onboardingSnapshot.empty) {
      // Find the associated business
      const businessSnapshot = await db.collection('businesses')
        .where('ownerId', '==', userId)
        .where('type', '==', 'hotel')
        .get();

      if (!businessSnapshot.empty) {
        return NextResponse.json({ 
          redirect: `/dashboard/hotel-admin?businessId=${businessSnapshot.docs[0].id}`,
          businessId: businessSnapshot.docs[0].id,
          role: 'admin',
          industryType: 'hotel',
          business_number: userData.business_number || null
        });
      }
    }

    // Also check if the user is a member of a hotel business (Staff/Manager)
    const businessesSnapshot = await db.collection('businesses')
      .where('type', '==', 'hotel')
      .get();

    for (const bizDoc of businessesSnapshot.docs) {
      const memberSnapshot = await bizDoc.ref.collection('members')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!memberSnapshot.empty) {
        const memberData = memberSnapshot.docs[0].data();
        const businessId = bizDoc.id;
        
        let redirect = `/hotel/staff?businessId=${businessId}`;
        if (memberData.role === 'admin') redirect = `/dashboard/hotel-admin?businessId=${businessId}`;
        if (memberData.role === 'manager') redirect = `/hotel/manager?businessId=${businessId}&department=${encodeURIComponent(memberData.department || '')}`;
        
        return NextResponse.json({ 
          redirect, 
          businessId,
          role: memberData.role,
          industryType: 'hotel'
        });
      }
    }

    return NextResponse.json({ redirect: '/dashboard' });
  } catch (error) {
    console.error('Error in auth-check:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
