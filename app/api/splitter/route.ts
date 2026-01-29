
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
      console.error("Firebase Admin Init Error (Splitter):", e.message);
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
          message: 'Fitur Stem Splitter eksklusif untuk member PRO.'
        }, { status: 403 });
      }
    }

    const formData = await req.formData();
    const fileBlob = formData.get('file') as File;

    if (!fileBlob || fileBlob.size === 0) {
      return NextResponse.json({ success: false, message: 'File audio tidak ditemukan atau kosong.' }, { status: 400 });
    }

    const pitucodeApiKey = process.env.PITUCODE_API_KEY || '514663643e';

    // FIX 400: Gunakan key 'file' (bukan filePath) dan buat FormData baru untuk dikirim ke provider
    const pituFormData = new FormData();
    // Mengubah Blob menjadi File dengan nama agar API mengenali sebagai file audio
    pituFormData.append('file', fileBlob, fileBlob.name || 'audio_source.mp3');

    const response = await fetch(process.env.SPLITTER_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': pitucodeApiKey
        // Jangan set Content-Type secara manual, biarkan fetch yang menanganinya untuk boundary multipart
      },
      body: pituFormData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Splitter Engine Failure:", result);
      return NextResponse.json({
        success: false,
        message: result.message || 'Gagal memisahkan audio. Pastikan format file didukung.'
      }, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Splitter Internal Error:", error.message);
    return NextResponse.json({ success: false, message: 'Gagal memproses audio (Internal Error).' }, { status: 500 });
  }
}
