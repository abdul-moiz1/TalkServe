import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const ticketsRef = db.collection('businesses').doc(businessId).collection('tickets');

    // Delete all existing tickets
    const snapshot = await ticketsRef.get();
    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // Add new tickets with assignments
    const testTickets = [
      // Front Desk - Assigned tickets
      {
        guestRoom: '101',
        requestText: 'Guest checking in early - prepare room',
        department: 'front-desk',
        priority: 'normal',
        status: 'created',
        assignedTo: 'staff1',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 5 * 60000),
        updatedAt: new Date(Date.now() - 5 * 60000),
        notes: []
      },
      {
        guestRoom: '205',
        requestText: 'Lost key card - urgent replacement needed',
        department: 'front-desk',
        priority: 'urgent',
        status: 'created',
        assignedTo: 'staff2',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 10 * 60000),
        updatedAt: new Date(Date.now() - 10 * 60000),
        notes: []
      },
      {
        guestRoom: '308',
        requestText: 'Guest requesting late checkout until 6 PM',
        department: 'front-desk',
        priority: 'normal',
        status: 'in-progress',
        assignedTo: 'staff1',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 15 * 60000),
        updatedAt: new Date(Date.now() - 2 * 60000),
        notes: []
      },
      {
        guestRoom: '412',
        requestText: 'Concierge - dinner reservations needed',
        department: 'front-desk',
        priority: 'normal',
        status: 'in-progress',
        assignedTo: 'staff2',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 20 * 60000),
        updatedAt: new Date(Date.now() - 1 * 60000),
        notes: []
      },
      {
        guestRoom: '115',
        requestText: 'Airport transfer arranged and confirmed',
        department: 'front-desk',
        priority: 'normal',
        status: 'completed',
        assignedTo: 'staff1',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 60 * 60000),
        updatedAt: new Date(Date.now() - 10 * 60000),
        notes: []
      },
      {
        guestRoom: '220',
        requestText: 'Restaurant reservation confirmed for 8 PM',
        department: 'front-desk',
        priority: 'normal',
        status: 'completed',
        assignedTo: 'staff2',
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        createdAt: new Date(Date.now() - 90 * 60000),
        updatedAt: new Date(Date.now() - 20 * 60000),
        notes: []
      },
      // Housekeeping
      {
        guestRoom: '301',
        requestText: 'Extra towels and pillows needed',
        department: 'housekeeping',
        priority: 'normal',
        status: 'created',
        assignedTo: 'hk-staff1',
        assignedBy: 'manager-2',
        assignedByName: 'Housekeeping Manager',
        createdAt: new Date(Date.now() - 7 * 60000),
        updatedAt: new Date(Date.now() - 7 * 60000),
        notes: []
      },
      {
        guestRoom: '405',
        requestText: 'Room deep clean - guest complaint',
        department: 'housekeeping',
        priority: 'urgent',
        status: 'in-progress',
        assignedTo: 'hk-staff1',
        assignedBy: 'manager-2',
        assignedByName: 'Housekeeping Manager',
        createdAt: new Date(Date.now() - 25 * 60000),
        updatedAt: new Date(Date.now() - 3 * 60000),
        notes: []
      },
      // Maintenance
      {
        guestRoom: '215',
        requestText: 'Air conditioning not cooling properly',
        department: 'maintenance',
        priority: 'urgent',
        status: 'created',
        assignedTo: 'maint-staff1',
        assignedBy: 'manager-3',
        assignedByName: 'Maintenance Manager',
        createdAt: new Date(Date.now() - 12 * 60000),
        updatedAt: new Date(Date.now() - 12 * 60000),
        notes: []
      },
      {
        guestRoom: '510',
        requestText: 'Bathroom sink leaking - water damage risk',
        department: 'maintenance',
        priority: 'urgent',
        status: 'in-progress',
        assignedTo: 'maint-staff1',
        assignedBy: 'manager-3',
        assignedByName: 'Maintenance Manager',
        createdAt: new Date(Date.now() - 30 * 60000),
        updatedAt: new Date(Date.now() - 5 * 60000),
        notes: []
      }
    ];

    const addedTickets = [];
    for (const ticket of testTickets) {
      const docRef = await ticketsRef.add(ticket);
      addedTickets.push({
        id: docRef.id,
        ...ticket
      });
    }

    return NextResponse.json({
      success: true,
      message: `Cleared old tickets and added ${addedTickets.length} new assigned tickets`,
      ticketsAdded: addedTickets.length,
      ticketsDeleted: snapshot.docs.length
    });
  } catch (error) {
    console.error('Error clearing and seeding tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear and seed tickets' },
      { status: 500 }
    );
  }
}
