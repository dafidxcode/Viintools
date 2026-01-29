
import { NextResponse } from 'next/server';
import axios from 'axios';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!))
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskUrl = searchParams.get('task_url');
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];

  if (!token || !taskUrl) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    // 1. Verify user
    await admin.auth().verifyIdToken(token);

    // 2. Fetch from SunoX Generator
    const response = await axios.get(taskUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.PAXSENIX_API_KEY}`,
      },
      timeout: 10000 
    });

    const data = response.data;

    // 3. Return status-ready response
    return NextResponse.json({
        ...data,
        ok: data.status !== 'error'
    });
  } catch (error: any) {
    console.error("Polling Error:", error.message);
    return NextResponse.json({ 
        ok: false, 
        status: 'processing', 
        progress: 'Reconnecting to engine...' 
    }, { status: 200 });
  }
}
