import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: Storage | null = null;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    storage = getStorage(adminApp);
    return { adminApp, db, auth, storage };
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin SDK not configured - missing credentials');
    return { adminApp: null, db: null, auth: null, storage: null };
  }

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
    db = getFirestore(adminApp);
    auth = getAuth(adminApp);
    storage = getStorage(adminApp);
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }

  return { adminApp, db, auth, storage };
}

export function getAdminDb(): Firestore | null {
  if (!db) {
    const result = initializeFirebaseAdmin();
    db = result.db;
  }
  return db;
}

export function getAdminAuth(): Auth | null {
  if (!auth) {
    const result = initializeFirebaseAdmin();
    auth = result.auth;
  }
  return auth;
}

export function getAdminStorage(): Storage | null {
  if (!storage) {
    const result = initializeFirebaseAdmin();
    storage = result.storage;
  }
  return storage;
}

export async function verifyAuthToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    return null;
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export { adminApp };
