import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyAuthToken } from '@/lib/firebase-admin';

// Check if Gemini is available
let GoogleGenerativeAI: any;
try {
  const genai = require('@google/genai');
  if (genai && genai.GoogleGenerativeAI) {
    GoogleGenerativeAI = genai.GoogleGenerativeAI;
  }
} catch (e) {
  console.warn('Gemini AI package not found, translations will be skipped');
}

async function translateText(text: string, targetLanguages: string[]): Promise<Record<string, string>> {
  if (!GoogleGenerativeAI || !process.env.GEMINI_API_KEY || targetLanguages.length === 0) {
    console.log('Skipping translation: AI not loaded or no target languages');
    return {};
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Translate the following hotel guest request into these languages: ${targetLanguages.join(', ')}. 
    Return ONLY a JSON object where keys are the language codes and values are the translations.
    Request: "${text}"`;
    
    console.log('Sending prompt to Gemini:', prompt);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    // Clean JSON from potential markdown blocks
    let jsonStr = responseText.replace(/```json|```/g, '').trim();
    // Sometimes Gemini returns a wrapper object or non-JSON text, try to extract the JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    console.log('Gemini raw response:', responseText);
    const parsed = JSON.parse(jsonStr);
    // Ensure we return exactly what's expected: Record<string, string>
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      result[key.toLowerCase()] = String(value);
    }
    return result;
  } catch (error) {
    console.error('Gemini translation error:', error);
    return {};
  }
}

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

    // Verify member exists in business
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

    // RBAC: Staff and Managers only access their own business
    // Ensure the businessId matches (verified via memberDoc check above)

    // Determine which department to filter by
    const filterDept = (department || userDepartment || '').toLowerCase().trim().replace(/[\s-]/g, '');
    console.log('Fetching tickets for business:', businessId, 'filterDept (normalized):', filterDept, 'userRole:', userRole);

    // Get all tickets for this business first
    let ticketsRef = db
      .collection('businesses')
      .doc(businessId)
      .collection('tickets');

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
        // Map new schema fields for consistency if needed, though client-side fix handles it
        requestText: ticketData.issue_summary || ticketData.requestText || '',
      };
    });

    // Filter tickets based on role and department
    if (userRole === 'staff') {
      // Staff see only tickets assigned to them
      tickets = tickets.filter((t: any) => t.assignedTo === userId);
    } else if (userRole === 'manager' || userRole === 'admin') {
      // Managers see all tickets in their department
      if (filterDept) {
        tickets = tickets.filter((t: any) => {
          if (!t.department) return false;
          const ticketDept = t.department.toLowerCase().trim().replace(/[\s-]/g, '');
          return ticketDept === filterDept;
        });
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

    // Get all unique preferred languages of the team in this business
    const languagesSnapshot = await db
      .collection('businesses')
      .doc(businessId)
      .collection('members')
      .get();
    
    const targetLanguages = Array.from(new Set([
      ...languagesSnapshot.docs
        .map(doc => doc.data().preferredLanguage)
        .filter(lang => lang && lang !== 'en'),
      'es' // Always include Spanish as a fallback target if requested
    ])) as string[];

    // Ensure common languages are included if needed, or just rely on team preferences
    // If the manager is Spanish, 'es' should already be in targetLanguages
    console.log('Target languages for translation:', targetLanguages);

    const translations = await translateText(requestText, targetLanguages);

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
      translations: translations || {},
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
