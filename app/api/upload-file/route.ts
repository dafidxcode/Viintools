
import { NextResponse } from 'next/server';
import { uploadFileStreamToKie } from '@/lib/kie-upload';
import admin from 'firebase-admin';

// Init Firebase
if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa.trim())) });
  } catch (e) { }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;
    const path = formData.get('uploadPath') as string || formData.get('path') as string; // Support both
    const filename = formData.get('fileName') as string || formData.get('filename') as string;

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (token) {
      try { await admin.auth().verifyIdToken(token); } catch (e) { }
    }

    if (!file || !path) {
      return NextResponse.json({ error: 'Missing parameters: file, uploadPath' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadFileStreamToKie(buffer, path, filename);
    return NextResponse.json(result);

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
