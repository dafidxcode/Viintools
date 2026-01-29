
import { NextResponse } from 'next/server';
import axios from 'axios';
import admin from 'firebase-admin';

function initAdmin() {
  if (!admin.apps.length) {
    try {
      const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (sa) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa.trim())) });
    } catch (e: any) { console.error("Firebase Admin Error:", e); }
  }
}

export async function POST(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const body = await req.json();

    const { prompt, model, ratio } = body;

    if (!prompt) {
      return NextResponse.json({ ok: false, message: 'Prompt is required' }, { status: 400 });
    }

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const plan = userData?.plan || 'FREE';
    const isPRO = plan === 'PRO';

    // Check Limit
    const limit = isPRO ? 50 : 2;
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const recentImages = (userData?.imageTimestamps || []).filter((ts: number) => ts > twentyFourHoursAgo);

    if (recentImages.length >= limit) {
      return NextResponse.json({ ok: false, limit_reached: true }, { status: 429 });
    }

    const studioApiKey = process.env.PAXSENIX_API_KEY;
    const engineUrl = process.env.IMAGEN_API_URL;
    const urlParams = new URLSearchParams();
    urlParams.append('text', prompt);
    urlParams.append('model', model || 'imagen-4.0-fast-generate-001');
    urlParams.append('ratio', ratio || '1:1');

    const response = await axios.get(`${engineUrl}?${urlParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${studioApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.data.ok) {
      const internalId = `im_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const resultUrl = response.data.url || response.data.image_url;
      const taskUrl = response.data.task_url;

      const isDone = !!resultUrl && !taskUrl;

      await userRef.collection('active_tasks').doc(internalId).set({
        taskUrl: taskUrl || resultUrl,
        result: isDone ? (Array.isArray(resultUrl) ? resultUrl : [resultUrl]) : null,
        type: 'image',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: isDone ? 'done' : 'processing'
      });

      await userRef.update({ imageTimestamps: [...recentImages, now] });

      return NextResponse.json({ ok: true, taskId: internalId });
    }

    throw new Error(response.data.message || "Engine rejected request");

  } catch (error: any) {
    console.error("Imagen Engine Failure:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    return NextResponse.json({ ok: false, message: 'Imagen Engine Busy' }, { status });
  }
}
