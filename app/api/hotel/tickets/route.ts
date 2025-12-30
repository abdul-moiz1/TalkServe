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
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get user's role and department
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
    const userRole = memberData?.role;
    const userDepartment = memberData?.department;

    // Build query
    let query = db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets') as any;

    // Filter by department if provided (Staff/Managers)
    if (department) {
      const deptNormalized = department.toLowerCase();
      query = query.where('department', 'in', [
        deptNormalized, 
        department.charAt(0).toUpperCase() + department.slice(1).toLowerCase(), 
        department
      ]);
    } else if (userRole === 'manager' && userDepartment) {
      // Managers fallback if no department in query
      const deptNormalized = userDepartment.toLowerCase();
      query = query.where('department', 'in', [
        deptNormalized, 
        userDepartment.charAt(0).toUpperCase() + userDepartment.slice(1).toLowerCase(), 
        userDepartment
      ]);
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();

    const tickets = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.().toISOString() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.().toISOString() || doc.data().updatedAt,
    }));

    // Sort manually if index is missing
    tickets.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = await verifyAuthToken(authHeader);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessId, guestRoom, requestText, department, priority } = body;

    if (!businessId || !guestRoom || !requestText || !department) {
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

    const ticketData = {
      businessId,
      guestRoom,
      requestText,
      department,
      priority: priority || 'normal',
      status: 'created',
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      notes: [],
      translations: {},
    };

    const ticketRef = await db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets')
      .add(ticketData);

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketRef.id,
        ...ticketData,
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
