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

    console.log(`Found ${ownedSnapshot.size} businesses for ownerId: ${userId}`);

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

    // Also check for common owner field name variants
    const ownerSnapshot = await db
      .collection('businesses')
      .where('owner', '==', userId)
      .get();

    console.log(`Found ${ownerSnapshot.size} businesses for owner field: ${userId}`);

    ownerSnapshot.forEach(doc => {
      const data = doc.data();
      if (!businesses.find(b => b.businessId === doc.id)) {
        businesses.push({
          businessId: doc.id,
          businessName: data.name,
          businessType: data.type,
          role: 'admin',
          department: null,
          joinedAt: data.createdAt || new Date().toISOString(),
        });
      }
    });

    // FALLBACK: If still no businesses found, let's look for ANY business 
    // This is for development/debugging to ensure the user can at least see the page
    if (businesses.length === 0) {
      console.log('No businesses found via owner fields, attempting global search for dev...');
      const allBusinesses = await db.collection('businesses').limit(5).get();
      allBusinesses.forEach(doc => {
        const data = doc.data();
        if (data.ownerId === userId || data.owner === userId) {
          businesses.push({
            businessId: doc.id,
            businessName: data.name,
            businessType: data.type,
            role: 'admin',
            department: null,
            joinedAt: data.createdAt || new Date().toISOString(),
          });
        }
      });
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
