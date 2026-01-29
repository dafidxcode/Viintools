
import { NextResponse } from 'next/server';
import axios from 'axios';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(sa.trim()))
      });
    }
  } catch (e) {
    console.error("Firebase Admin Init Error (Cover):", e);
  }
}

export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userRef = admin.firestore().collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    if (!userData) {
      return NextResponse.json({ ok: false, msg: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const plan = userData.plan || 'FREE';
    const isPRO = plan === 'PRO';

    if (!isPRO) {
      return NextResponse.json({
        ok: false,
        limit_reached: true,
        msg: 'Akses ditolak. Fitur AI Cover Engine eksklusif untuk member PRO.'
      }, { status: 403 });
    }

    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    const recentCovers = (userData.coverTimestamps || []).filter((ts: number) => ts > twentyFourHoursAgo);

    // LIMIT PRO: 10 Per Day
    if (recentCovers.length >= 10) {
      return NextResponse.json({ ok: false, msg: 'Sistem sedang sibuk. Silakan coba lagi nanti.' }, { status: 503 });
    }

    const body = await req.json();
    const uploadUrl = body.uploadUrl || body.audioUrl;
    if (!uploadUrl) {
      return NextResponse.json({ ok: false, msg: 'File audio diperlukan.' }, { status: 400 });
    }

    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const callback = `${protocol}://${host}/api/webhook/cover?uid=${decoded.uid}`;

    const isCustom = body.customMode === undefined ? true : !!body.customMode;
    const selectedModel = (body.model || "V5").toString().toUpperCase();

    const payload: any = {
      uploadUrl: uploadUrl,
      prompt: String(body.prompt || "Professional AI Cover").substring(0, isCustom ? 5000 : 400),
      customMode: isCustom,
      instrumental: isCustom ? !!body.instrumental : false,
      model: selectedModel,
      callBackUrl: callback,
      vocalGender: body.vocalGender === 'f' ? 'f' : 'm',
      styleWeight: Number(body.styleWeight || 0.65),
      weirdnessConstraint: Number(body.weirdnessConstraint || 0.65),
      audioWeight: Number(body.audioWeight || 0.65)
    };

    if (isCustom) {
      payload.style = String(body.style || "").substring(0, 1000);
      payload.title = String(body.title || "").substring(0, 100);
      payload.negativeTags = String(body.negativeTags || "").substring(0, 500);
      if (body.personaId) {
        payload.personaId = String(body.personaId).trim();
      }
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: false, msg: 'Layanan saat ini tidak tersedia.' }, { status: 503 });
    }

    try {
      const response = await axios.post(process.env.COVER_API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000
      });

      const result = response.data;
      if (result && (result.code === 200 || result.msg === 'success')) {
        const taskId = result.data?.taskId || result.taskId;
        await userRef.update({ coverTimestamps: [...recentCovers, now] });

        await admin.firestore().collection('users').doc(decoded.uid).collection('jobs').doc(taskId).set({
          taskId: taskId,
          userId: decoded.uid,
          type: 'cover',
          status: 'processing',
          progress: 'Sedang memproses audio...',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          parameters: payload
        });

        return NextResponse.json({ ...result, taskId, ok: true });
      }
      return NextResponse.json({ ok: false, msg: 'Layanan sedang sibuk. Silakan coba lagi.' }, { status: 400 });

    } catch (err: any) {
      return NextResponse.json({ ok: false, msg: 'Gagal memproses permintaan.' }, { status: err.response?.status || 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ ok: false, msg: 'Terjadi kesalahan pada sistem.' }, { status: 500 });
  }
}
