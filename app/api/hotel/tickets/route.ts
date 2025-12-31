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

    // Determine which department to filter by
    const filterDept = department || userDepartment;

    // Get all tickets for this business first
    let ticketsRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets') as any;

    // Get all members for name lookup
    const membersSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .get();

    const memberMap: Record<string, any> = {};
    membersSnapshot.docs.forEach(doc => {
      memberMap[doc.id] = doc.data();
    });

    const snapshot = await ticketsRef.get();
    
    let tickets = snapshot.docs.map((doc: any) => {
      const ticketData = doc.data();
      const assigned = ticketData.assignedTo ? memberMap[ticketData.assignedTo] : null;
      
      return {
        id: doc.id,
        ...ticketData,
        assignedStaffName: assigned?.fullName || assigned?.email || ticketData.assignedStaffName,
        createdAt: ticketData.createdAt?.toDate?.().toISOString() || ticketData.createdAt,
        updatedAt: ticketData.updatedAt?.toDate?.().toISOString() || ticketData.updatedAt,
      };
    });

    // Filter tickets based on role and department
    if (userRole === 'staff') {
      // Staff see only tickets assigned to them
      tickets = tickets.filter((t: any) => t.assignedTo === userId);
    } else if (userRole === 'manager') {
      // Managers see all tickets in their department
      if (filterDept) {
        const deptLower = filterDept.toLowerCase();
        tickets = tickets.filter((t: any) => 
          t.department && t.department.toLowerCase() === deptLower
        );
      }
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      tickets = tickets.filter((t: any) => t.status === status);
    }

    // Sort by date
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
