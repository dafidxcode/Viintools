
import { NextResponse } from 'next/server';
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
      console.error("Firebase Admin Init Error (DeepNude):", e.message);
    }
  }
}

export async function POST(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const userRef = admin.firestore().collection('users').doc(decoded.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const plan = userSnap.data()?.plan || 'FREE';
      if (plan !== 'PRO') {
        return NextResponse.json({
          success: false,
          limit_reached: true,
          message: 'Fitur Deep Nude AI eksklusif untuk member PRO.'
        }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const image = formData.get('image') as Blob;
    const type = formData.get('type') as string;

    if (!image) {
      return NextResponse.json({ success: false, message: 'Gambar tidak ditemukan.' }, { status: 400 });
    }

    const pitucodeApiKey = process.env.PITUCODE_API_KEY;
    const pituFormData = new FormData();
    pituFormData.append('image', image);
    pituFormData.append('type', type || 'WOMAN');

    const response = await fetch(process.env.NUDE_API_URL, {
      method: 'POST',
      headers: { 'x-api-key': pitucodeApiKey },
      body: pituFormData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      return NextResponse.json({ success: false, message: result.message || 'Gagal memproses gambar.' }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Gagal memproses gambar.' }, { status: 500 });
  }
}
