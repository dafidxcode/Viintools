
import { NextResponse } from 'next/server';
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

    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageBlob = formData.get('image') as Blob | null;

    if (!prompt) {
      return NextResponse.json({ ok: false, message: 'Prompt wajib diisi.' }, { status: 400 });
    }

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const plan = userData?.plan || 'FREE';

    const limit = plan === 'PRO' ? 50 : 3;
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const recentVideos = (userData?.videoTimestamps || []).filter((ts: number) => ts > twentyFourHoursAgo);

    if (recentVideos.length >= limit) {
      return NextResponse.json({ ok: false, limit_reached: true }, { status: 429 });
    }

    const pitucodeApiKey = process.env.PITUCODE_API_KEY || '514663643e';

    const pituFormData = new FormData();
    pituFormData.append('prompt', prompt);
    if (imageBlob) {
      pituFormData.append('image', imageBlob, 'image.png');
    }

    // Panggil Pitucode
    const response = await fetch(process.env.GROK_API_URL, {
      method: 'POST',
      headers: { 'x-api-key': pitucodeApiKey },
      body: pituFormData
    });

    const result = await response.json();

    if (result.success) {
      // Karena Pitucode Grok seringkali langsung memberikan URL hasil, 
      // kita tetap buatkan internalTaskId agar sistem polling JobMonitor konsisten
      // dan engine asli tetap tersembunyi.
      const internalId = `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Simpan hasil ke koleksi active_tasks sebagai 'done' jika sudah ada video_url
      // atau simpan sebagai 'processing' jika Pitucode memberikan task_id
      const isDone = !!result.result.result;

      await userRef.collection('active_tasks').doc(internalId).set({
        taskUrl: '', // Tidak butuh polling jika sudah done
        result: result.result.result,
        status: isDone ? 'done' : 'processing',
        type: 'video',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await userRef.update({ videoTimestamps: [...recentVideos, now] });

      return NextResponse.json({ ok: true, taskId: internalId });
    } else {
      throw new Error(result.message || 'Gagal generate video Grok');
    }

  } catch (error: any) {
    return NextResponse.json({ ok: false, message: 'Layanan Sedang Sibuk' }, { status: 500 });
  }
}
