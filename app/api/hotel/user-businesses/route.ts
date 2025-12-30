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

    // Get user document to find all businesses they belong to
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ businesses: [] });
    }

    const businesses = [];

    // Get owned businesses - Ensure we match the ownerId from the document
    const ownedSnapshot = await db
      .collection('businesses')
      .where('ownerId', '==', userId)
      .get();

    ownedSnapshot.forEach(doc => {
      const data = doc.data();
      businesses.push({
        businessId: doc.id,
        businessName: data.name,
        businessType: data.type,
        role: 'admin',
        department: null,
        joinedAt: data.createdAt || new Date().toISOString(),
      });
    });

    // Also check if the businessId itself is the userId (sometimes used for single-owner setups)
    const directDoc = await db.collection('businesses').doc(userId).get();
    if (directDoc.exists) {
      const data = directDoc.data()!;
      if (!businesses.find(b => b.businessId === userId)) {
        businesses.push({
          businessId: userId,
          businessName: data.name,
          businessType: data.type,
          role: 'admin',
          department: null,
          joinedAt: data.createdAt || new Date().toISOString(),
        });
      }
    }

    // Get member businesses - use a simple collection scan if collection group is failing
    try {
      const memberSnapshot = await db
        .collectionGroup('members')
        .where('userId', '==', userId)
        .get();

      memberSnapshot.forEach(doc => {
        const data = doc.data();
        const businessId = doc.ref.parent.parent?.id;
        if (businessId) {
          businesses.push({
            businessId,
            businessName: data.businessName || 'Unknown',
            businessType: data.businessType || 'hotel',
            role: data.role,
            department: data.department,
            joinedAt: data.joinedAt || new Date().toISOString(),
          });
        }
      });
    } catch (queryError) {
      console.warn('CollectionGroup members query failed (possibly missing index):', queryError);
      // Fallback: If it's a small number of businesses, we could potentially scan, 
      // but for now let's just ensure we return what we found in ownedSnapshot
    }

    return NextResponse.json({ success: true, businesses });
  } catch (error) {
    console.error('Error fetching user businesses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
