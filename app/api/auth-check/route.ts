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

    // Check onboarding for hotel status
    const onboardingSnapshot = await db.collection('onboarding')
      .where('user_id', '==', userId)
      .where('industryType', '==', 'hotel')
      .limit(1)
      .get();

    if (!onboardingSnapshot.empty) {
      // Find the associated business
      const businessSnapshot = await db.collection('businesses')
        .where('ownerId', '==', userId)
        .where('type', '==', 'hotel')
        .limit(1)
        .get();

      if (!businessSnapshot.empty) {
        return NextResponse.json({ 
          redirect: `/hotel/admin?businessId=${businessSnapshot.docs[0].id}`,
          businessId: businessSnapshot.docs[0].id,
          role: 'admin',
          industryType: 'hotel'
        });
      }
    }

    // Also check if the user is a member of a hotel business (Staff/Manager)
    const membersSnapshot = await db.collectionGroup('members')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!membersSnapshot.empty) {
      const memberData = membersSnapshot.docs[0].data();
      const businessId = membersSnapshot.docs[0].ref.parent.parent?.id;
      
      if (businessId) {
        const businessDoc = await db.collection('businesses').doc(businessId).get();
        if (businessDoc.exists && businessDoc.data()?.type === 'hotel') {
          let redirect = `/hotel/staff?businessId=${businessId}`;
          if (memberData.role === 'admin') redirect = `/hotel/admin?businessId=${businessId}`;
          if (memberData.role === 'manager') redirect = `/hotel/manager?businessId=${businessId}`;
          
          return NextResponse.json({ 
            redirect, 
            businessId,
            role: memberData.role,
            industryType: 'hotel'
          });
        }
      }
    }

    return NextResponse.json({ redirect: '/dashboard' });
  } catch (error) {
    console.error('Error in auth-check:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
