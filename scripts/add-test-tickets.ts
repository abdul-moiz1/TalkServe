import { getAdminDb } from '../lib/firebase-admin';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function addTestTickets() {
  try {
    const businessId = await question('Enter Business ID: ');
    
    if (!businessId) {
      console.error('Business ID is required');
      process.exit(1);
    }

    const db = getAdminDb();
    if (!db) {
      console.error('Database not available');
      process.exit(1);
    }

    const ticketsRef = db.collection('businesses').doc(businessId).collection('tickets');

    const testTickets = [
      // Front Desk Tickets
      {
        guestRoom: '101',
        requestText: 'Guest checking in early - need to prepare room',
        department: 'front-desk',
        priority: 'normal',
        status: 'created',
        createdAt: new Date(Date.now() - 5 * 60000),
        updatedAt: new Date(Date.now() - 5 * 60000),
        notes: []
      },
      {
        guestRoom: '205',
        requestText: 'Lost key card - guest needs replacement',
        department: 'front-desk',
        priority: 'urgent',
        status: 'created',
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
        createdAt: new Date(Date.now() - 15 * 60000),
        updatedAt: new Date(Date.now() - 2 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        notes: []
      },
      {
        guestRoom: '412',
        requestText: 'Concierge service - dinner reservations needed',
        department: 'front-desk',
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
        requestText: 'Airport transfer arranged successfully',
        department: 'front-desk',
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
        requestText: 'Restaurant reservation confirmed',
        department: 'front-desk',
        priority: 'normal',
        status: 'completed',
        createdAt: new Date(Date.now() - 90 * 60000),
        updatedAt: new Date(Date.now() - 20 * 60000),
        assignedBy: 'manager-1',
        assignedByName: 'Ahmed Manager',
        notes: []
      },
      // Other departments
      {
        guestRoom: '301',
        requestText: 'Need extra towels and pillows',
        department: 'housekeeping',
        priority: 'normal',
        status: 'created',
        createdAt: new Date(Date.now() - 5 * 60000),
        updatedAt: new Date(Date.now() - 5 * 60000),
        notes: []
      },
      {
        guestRoom: '405',
        requestText: 'Air conditioning not working properly',
        department: 'maintenance',
        priority: 'urgent',
        status: 'created',
        createdAt: new Date(Date.now() - 10 * 60000),
        updatedAt: new Date(Date.now() - 10 * 60000),
        notes: []
      }
    ];

    console.log(`\nAdding ${testTickets.length} test tickets to business ${businessId}...`);
    
    for (const ticket of testTickets) {
      const docRef = await ticketsRef.add(ticket);
      console.log(`✓ Added ticket for room ${ticket.guestRoom}`);
    }

    console.log(`\n✅ Successfully added ${testTickets.length} test tickets!`);
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('Error adding tickets:', error);
    rl.close();
    process.exit(1);
  }
}

addTestTickets();
