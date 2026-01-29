
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
      console.error("Firebase Admin Init Error (YT Proxy):", e.message);
    }
  }
}

export async function GET(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ ok: false, message: 'URL is required' }, { status: 400 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const studioApiKey = process.env.PAXSENIX_API_KEY;
    if (!studioApiKey) throw new Error("Studio configuration is missing");

    // Submit Job to Paxsenix (Async)
    const apiUrl = process.env.YT_API_URL;
    const response = await axios.get(`${apiUrl}?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${studioApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const data = response.data;

    if (data.ok && data.task_url) {
      // Save to Firestore for Polling
      const internalId = `yt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      await admin.firestore().collection('users').doc(uid).collection('active_tasks').doc(internalId).set({
        taskUrl: data.task_url,
        type: 'youtube', // Tag for status route
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'processing',
        parameters: { url, title: 'YouTube Video' } // Store basic metadata
      });

      return NextResponse.json({ ok: true, taskId: internalId });
    } else {
      throw new Error(data.message || "Failed to start extraction job");
    }

  } catch (error: any) {
    console.error("Studio YouTube Extraction Error:", error.response?.data || error.message);
    return NextResponse.json({
      ok: false,
      message: 'Failed to start YouTube extraction. Ensure the link is valid.'
    }, { status: 500 });
  }
}
