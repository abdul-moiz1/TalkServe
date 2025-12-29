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
          redirect: `/admin/hotel?businessId=${businessSnapshot.docs[0].id}`,
          businessId: businessSnapshot.docs[0].id
        });
      }
    }

    return NextResponse.json({ redirect: '/dashboard' });
  } catch (error) {
    console.error('Error in auth-check:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
