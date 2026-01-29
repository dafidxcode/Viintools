
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

export async function POST(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const body = await req.json();

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data();
      const plan = userData?.plan || 'FREE';
      const isPRO = plan === 'PRO';

      const limit = isPRO ? 50 : 2;
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

      const recentGenerations = (userData?.generationTimestamps || [])
        .filter((ts: number) => ts > twentyFourHoursAgo);

      if (recentGenerations.length >= limit) {
        if (isPRO) return NextResponse.json({ ok: false, message: 'Daily limit reached.' }, { status: 503 });
        return NextResponse.json({ ok: false, limit_reached: true }, { status: 429 });
      }

      await userRef.update({ generationTimestamps: [...recentGenerations, now] });
    }

    const model = body.model || "V5";
    const customMode = !!body.customMode;
    const isHighEnd = ['V5', 'V4.5', 'V4.5PLUS'].includes(model);

    let payload: any = {
      model: model,
      customMode: customMode,
      instrumental: !!body.instrumental
    };

    if (customMode) {
      const promptLimit = isHighEnd ? 5000 : 3000;
      const styleLimit = isHighEnd ? 1000 : 200;
      payload.prompt = (body.prompt || "").trim().substring(0, promptLimit);
      payload.style = (body.style || "Studio Quality").trim().substring(0, styleLimit);
      payload.title = (body.title || "New Creation").trim().substring(0, 80);
    } else {
      payload.prompt = (body.prompt || "").trim().substring(0, 400);
    }

    const apiKey = process.env.PAXSENIX_API_KEY;
    const useV3 = body.useV3 || false;
    const engineUrl = useV3
      ? 'https://api.paxsenix.org/ai-music/suno-music/v3'
      : 'https://api.paxsenix.org/ai-music/suno-music';

    const response = await axios.post(engineUrl, payload, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (response.data.ok) {
      const internalId = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const taskUrl = response.data.task_url || response.data.url;
      const immediateData = response.data.data;

      const isDone = Array.isArray(immediateData) && immediateData.length > 0;

      await userRef.collection('active_tasks').doc(internalId).set({
        taskUrl: taskUrl,
        type: 'music',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: isDone ? 'done' : 'processing',
        result: isDone ? immediateData.map((track: any) => ({
          id: track.id || `tr_${Math.random().toString(36).slice(2, 6)}`,
          title: track.title || "Untitled Masterpiece",
          style: track.tags || track.style || "AI Music",
          audioUrl: track.audio_url || track.url,
          imageUrl: track.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}`,
          duration: track.duration || 0,
          model: track.model_name || model
        })) : null
      });

      return NextResponse.json({ ok: true, taskId: internalId });
    }

    throw new Error(response.data.message || "Engine rejected request");

  } catch (error: any) {
    return NextResponse.json({ ok: false, message: 'Studio Neural Engine Busy' }, { status: 500 });
  }
}
