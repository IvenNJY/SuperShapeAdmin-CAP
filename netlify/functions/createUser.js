
// Netlify Function to create a user in Firebase Auth and Firestore
import admin from "firebase-admin";

// Helper to get environment variables
const getEnv = (key) => Netlify.env.get(key);

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  const privateKey = getEnv("FIREBASE_PRIVATE_KEY");
  if (privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: getEnv("FIREBASE_PROJECT_ID"),
        clientEmail: getEnv("FIREBASE_CLIENT_EMAIL"),
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    console.error("FIREBASE_PRIVATE_KEY is not set.");
  }
}

const db = admin.firestore();
const auth = admin.auth();

export default async function handler(req, context) {
  // Only allow POST requests
  if (req.httpMethod !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Allow': 'POST' } });
  }

  // Check if Firebase is initialized
  if (!admin.apps.length) {
    return new Response("Firebase Admin SDK is not initialized.", { status: 500 });
  }

  try {
    const { email, password, full_name, role, phone, dob } = JSON.parse(req.body);

    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: full_name,
      disabled: false,
    });

    const uid = userRecord.uid;

    // 2. Create user document in Firestore
    const userData = {
      uid: uid,
      full_name: full_name,
      email: email,
      phone: phone || "",
      dob: dob || "",
      role: role,
      declaration_accepted: false,
      declaration_pdf_url: "",
      terms_accepted: false,
      signed_at: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userData);

    return new Response(JSON.stringify({ uid: uid, ...userData }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating user:', error);
    // Provide a more specific error message if available
    const errorMessage = error.message || "An unexpected error occurred.";
    const errorCode = error.code || 'unknown-error';
    return new Response(JSON.stringify({ error: errorMessage, errorCode: errorCode }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
