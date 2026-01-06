import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken } from '@/lib/firebase-admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { ticketId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, status, assignedTo, priority, notes } = body;

    console.log('Update Ticket API:', { ticketId, businessId, status });

    if (!businessId || !ticketId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Verify user is member of this business
    const memberDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .doc(userId)
      .get();

    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Not a member of this business' }, { status: 403 });
    }

    const memberData = memberDoc.data();
    const memberRole = memberData?.role;
    
    if (memberRole === 'staff' && status === 'created') {
      return NextResponse.json({ error: 'Staff cannot create/reset tickets' }, { status: 403 });
    }

    // Update ticket
    const ticketRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets')
      .doc(ticketId);

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status;
    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
      // Track who assigned it
      updateData.assignedBy = userId;
      updateData.assignedByName = memberData?.fullName || memberData?.email || 'Manager';
    }
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;
    if (body.translations) updateData.translations = body.translations;

    await ticketRef.update(updateData);

    const updatedDoc = await ticketRef.get();

    return NextResponse.json({
      success: true,
      ticket: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { ticketId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId || !ticketId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const ticketDoc = await db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets')
      .doc(ticketId)
      .get();

    if (!ticketDoc.exists) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketDoc.id,
        ...ticketDoc.data(),
      },
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}
