import { getAdminDb } from '../lib/firebase-admin';

async function seed() {
  const db = getAdminDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  const businessId = 'YpNJXQs7hleTcVerwIJo';
  const ticketsRef = db.collection('businesses').doc(businessId).collection('tickets');

  const tickets = [
    {
      guestRoom: '101',
      requestText: 'Need extra towels',
      department: 'housekeeping',
      priority: 'normal',
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: []
    },
    {
      guestRoom: '205',
      requestText: 'AC is not working',
      department: 'maintenance',
      priority: 'urgent',
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: []
    },
    {
      guestRoom: '302',
      requestText: 'Room service for 2 people',
      department: 'room-service',
      priority: 'normal',
      status: 'created',
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: []
    }
  ];

  for (const ticket of tickets) {
    await ticketsRef.add(ticket);
    console.log('Added ticket for room', ticket.guestRoom);
  }
}

seed().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
