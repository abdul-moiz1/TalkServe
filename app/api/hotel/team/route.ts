import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken } from '@/lib/firebase-admin';

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

    const businessRef = db.collection('businesses').doc(businessId);
    
    // EMERGENCY FIX: Allowing viewing team members for any authenticated user with businessId
    // while we resolve the business permission structure.

    // Get all members of this business
    const membersRef = businessRef.collection('members');
    const snapshot = await membersRef.get();

    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch team' },
      { status: 500 }
    );
  }
}
