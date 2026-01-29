
import { NextResponse } from 'next/server';
import axios from 'axios';
import admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    try {
      const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
      const serviceAccount = JSON.parse(sa.trim());
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e: any) {
      console.error("Firebase Admin Init Error:", e.message);
    }
  }
}

export async function GET(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const messageId = searchParams.get('message_id');

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!email || !messageId) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  try {
    await admin.auth().verifyIdToken(token);

    const paxsenixApiKey = process.env.PAXSENIX_API_KEY;
    if (!paxsenixApiKey) throw new Error("PAXSENIX_API_KEY is missing");

    const apiUrl = process.env.TEMPMAIL_BODY_URL;
    const response = await axios.get(`${apiUrl}?email=${encodeURIComponent(email)}&message_id=${messageId}`, {
      headers: {
        'Authorization': `Bearer ${paxsenixApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error("TempMail Body Error:", error.response?.data || error.message);
    return NextResponse.json({
      ok: false,
      message: 'Message service error.'
    }, { status: 500 });
  }
}
