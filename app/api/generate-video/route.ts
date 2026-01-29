
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
    const { prompt, model, ratio, type, imageUrls } = body;

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const plan = userData?.plan || 'FREE';

    // Check Limit
    const limit = plan === 'PRO' ? 50 : 3;
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const recentVideos = (userData?.videoTimestamps || []).filter((ts: number) => ts > twentyFourHoursAgo);

    if (recentVideos.length >= limit) {
      return NextResponse.json({ ok: false, limit_reached: true }, { status: 429 });
    }

    const studioApiKey = process.env.PAXSENIX_API_KEY;
    const engineUrl = process.env.VEO3_API_URL;
    const urlParams = new URLSearchParams();
    urlParams.append('prompt', prompt || '');
    urlParams.append('ratio', ratio || '9:16');
    urlParams.append('model', model || 'veo-3.1-fast');
    urlParams.append('type', type || 'text-to-video');
    if (type === 'image-to-video' && imageUrls) urlParams.append('imageUrl', imageUrls);

    const response = await axios.get(`${engineUrl}?${urlParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${studioApiKey}` },
      timeout: 60000
    });

    if (response.data.ok) {
      const internalId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const taskUrl = response.data.task_url || response.data.url;

      // SIMPAN MAPPING SECARA INTERNAL
      await userRef.collection('active_tasks').doc(internalId).set({
        taskUrl: taskUrl,
        type: 'video',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'processing'
      });

      await userRef.update({ videoTimestamps: [...recentVideos, now] });

      return NextResponse.json({ ok: true, taskId: internalId });
    }

    throw new Error("Engine rejected request");

  } catch (error: any) {
    return NextResponse.json({ ok: false, message: 'Layanan Sedang Sibuk' }, { status: 500 });
  }
}
