import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, widgetSettings } = body;

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Save or update widget settings in Firestore
    await adminDb.collection('widgetSettings').doc(uid).set(
      {
        ...widgetSettings,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    // Fetch the updated widget settings
    const doc = await adminDb.collection('widgetSettings').doc(uid).get();

    return NextResponse.json({
      success: true,
      data: doc.exists ? doc.data() : null,
    });
  } catch (error) {
    console.error('Error saving widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to save widget settings' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const doc = await adminDb.collection('widgetSettings').doc(uid).get();

    return NextResponse.json({
      success: true,
      data: doc.exists ? doc.data() : null,
    });
  } catch (error) {
    console.error('Error fetching widget settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget settings' },
      { status: 500 }
    );
  }
}
