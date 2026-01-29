
import { NextResponse } from 'next/server';
import { uploadUrlToKie } from '@/lib/kie-upload';
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
        const body = await req.json();
        const { url, path, filename } = body;

        const token = req.headers.get('Authorization')?.split('Bearer ')[1];
        if (token) {
            try { await admin.auth().verifyIdToken(token); } catch (e) { }
        }

        if (!url || !path) { // Filename might be optional per docs example 1? Actually docs show it in example 2. Let's make it optional.
            return NextResponse.json({ error: 'Missing parameters: url, path' }, { status: 400 });
        }

        const result = await uploadUrlToKie(url, path, filename);
        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
