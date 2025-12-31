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

    const testTickets = [
      {
        guestRoom: '101',
        requestText: 'Need extra towels and pillows',
        department: 'housekeeping',
        priority: 'normal',
        status: 'created',
        createdAt: new Date(Date.now() - 5 * 60000),
        updatedAt: new Date(Date.now() - 5 * 60000),
        notes: []
      },
      {
        guestRoom: '205',
        requestText: 'Air conditioning not working properly',
        department: 'maintenance',
        priority: 'urgent',
        status: 'created',
        createdAt: new Date(Date.now() - 10 * 60000),
        updatedAt: new Date(Date.now() - 10 * 60000),
        notes: []
      },
      {
        guestRoom: '308',
        requestText: 'Room service - breakfast for 2',
        department: 'room-service',
        priority: 'normal',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 15 * 60000),
        updatedAt: new Date(Date.now() - 2 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        notes: []
      },
      {
        guestRoom: '412',
        requestText: 'Need WiFi password reset',
        department: 'it-support',
        priority: 'normal',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 20 * 60000),
        updatedAt: new Date(Date.now() - 1 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        notes: []
      },
      {
        guestRoom: '115',
        requestText: 'Bed sheets changed successfully',
        department: 'housekeeping',
        priority: 'normal',
        status: 'completed',
        createdAt: new Date(Date.now() - 60 * 60000),
        updatedAt: new Date(Date.now() - 10 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        notes: []
      },
      {
        guestRoom: '220',
        requestText: 'Toilet flush repaired',
        department: 'maintenance',
        priority: 'urgent',
        status: 'completed',
        createdAt: new Date(Date.now() - 90 * 60000),
        updatedAt: new Date(Date.now() - 20 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
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
      message: `Added ${addedTickets.length} test tickets`,
      tickets: addedTickets
    });
  } catch (error) {
    console.error('Error seeding test tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to seed test tickets' },
      { status: 500 }
    );
  }
}
