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

    // Get all completed tickets for this staff member
    const ticketsRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets');

    const completedSnapshot = await ticketsRef
      .where('assignedTo', '==', userId)
      .where('status', '==', 'completed')
      .get();

    // Get today's completed tickets
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySnapshot = await ticketsRef
      .where('assignedTo', '==', userId)
      .where('status', '==', 'completed')
      .where('updatedAt', '>=', today)
      .get();

    // Calculate metrics
    const completedTickets = completedSnapshot.docs;
    const completedToday = todaySnapshot.docs.length;

    let totalTime = 0;
    completedTickets.forEach(doc => {
      const data = doc.data();
      if (data.createdAt && data.updatedAt) {
        const created = data.createdAt.toDate?.() || new Date(data.createdAt);
        const updated = data.updatedAt.toDate?.() || new Date(data.updatedAt);
        totalTime += (updated.getTime() - created.getTime()) / (1000 * 60); // minutes
      }
    });

    const avgCompletionTime = completedTickets.length > 0 ? Math.round(totalTime / completedTickets.length) : 0;

    return NextResponse.json({
      success: true,
      metrics: {
        completedToday,
        avgCompletionTime,
        rating: 4.8, // TODO: Calculate from actual feedback
        totalCompleted: completedTickets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
