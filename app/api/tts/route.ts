
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
      console.error("Firebase Admin Init Error (TTS):", e.message);
    }
  }
}

export async function GET(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data();
      const plan = userData?.plan || 'FREE';
      const isPRO = plan === 'PRO';

      const limit = isPRO ? 1000 : 10;
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

      const recentUsage = (userData?.ttsTimestamps || [])
        .filter((ts: number) => ts > twentyFourHoursAgo);

      if (recentUsage.length >= limit) {
        if (isPRO) {
          return NextResponse.json({ ok: false, message: 'Sistem sedang sibuk. Silakan coba lagi nanti.' }, { status: 503 });
        }
        return NextResponse.json({
          ok: false,
          limit_reached: true,
          message: `Limit harian Text-to-Speech tercapai (10/hari).`
        }, { status: 429 });
      }

      await userRef.update({
        ttsTimestamps: [...recentUsage, now]
      });
    }

    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice');
    const language = searchParams.get('language') || 'id-ID';
    const engine = searchParams.get('engine') || 'azure';

    if (!text) {
      return NextResponse.json({ ok: false, message: 'Text is required.' }, { status: 400 });
    }

    const studioApiKey = process.env.PAXSENIX_API_KEY;
    if (!studioApiKey) throw new Error("Studio API key is missing");

    const baseUrl = process.env.TTS_API_URL;
    const apiUrl = `${baseUrl}?text=${encodeURIComponent(text)}&voice=${voice}&language=${language}&engine=${engine}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${studioApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;

    // --- LOGIKA RE-UPLOAD & SAVING ---
    if (data.ok && data.url) {
      try {
        const { uploadUrlToKie } = await import('@/lib/kie-upload');
        const uploadRes = await uploadUrlToKie(
          data.url,
          `tts/${uid}`,
          `tts_${Date.now()}.mp3`
        );

        if (uploadRes.success && uploadRes.downloadUrl) {
          // 1. Simpan ke Firestore Library
          const trackId = `tts_${Date.now()}`;

          // Note: userRef was defined earlier as admin.firestore().collection('users').doc(uid)
          await userRef.collection('tracks').doc(trackId).set({
            id: trackId,
            title: text || 'TTS Audio',
            audioUrl: uploadRes.downloadUrl, // Gunakan URL baru
            imageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${trackId}`,
            style: 'TTS',
            duration: data.duration || 0,
            model: 'TTS',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: uid
          });

          // 2. Return Response
          return NextResponse.json({
            creator: "@Viintools",
            ok: true,
            url: uploadRes.downloadUrl,
            transcript: data.transcript
          });
        }
      } catch (e: any) {
        console.error("TTS Upload/Save Error:", e.message);
        return NextResponse.json({ ok: false, message: 'Gagal mengunggah hasil ke cloud.' }, { status: 502 });
      }
    }

    // Jika response asli error atau tidak ada URL
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Studio TTS Engine Error:", error.message);
    return NextResponse.json({ ok: false, message: 'Gagal memproses TTS.' }, { status: 500 });
  }
}
