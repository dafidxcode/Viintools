
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
    await admin.auth().verifyIdToken(token);

    const response = await axios.get(taskUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.PAXSENIX_API_KEY}`,
      },
      timeout: 10000 
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Polling Image Error:", error.message);
    return NextResponse.json({ 
        ok: false, 
        status: 'pending'
    }, { status: 200 });
  }
}
