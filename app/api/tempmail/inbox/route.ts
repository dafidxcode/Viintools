
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

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!email) return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });

  try {
    await admin.auth().verifyIdToken(token);

    const paxsenixApiKey = process.env.PAXSENIX_API_KEY;
    if (!paxsenixApiKey) throw new Error("PAXSENIX_API_KEY is missing");

    const apiUrl = process.env.TEMPMAIL_INBOX_URL;
    const response = await axios.get(`${apiUrl}?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${paxsenixApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // MASKING: Bersihkan respon dari properti vendor asli (Paxsenix)
    const rawData = response.data;
    return NextResponse.json({
      ok: true,
      creator: "@Viintools",
      message: "Studio Mail Sync Active",
      mailbox: rawData.mailbox || email,
      messages: rawData.messages || []
    });

  } catch (error: any) {
    console.error("TempMail Inbox Error:", error.response?.data || error.message);
    return NextResponse.json({
      ok: false,
      message: 'Inbox service error.'
    }, { status: 500 });
  }
}
