
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

export async function GET(req: Request) {
  initAdmin();

  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const userData = userSnap.data();
      const plan = userData?.plan || 'FREE';
      const isPRO = plan === 'PRO';

      if (!isPRO) {
        const limit = 5;
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

        const recentUsage = (userData?.tempMailTimestamps || [])
          .filter((ts: number) => ts > twentyFourHoursAgo);

        if (recentUsage.length >= limit) {
          return NextResponse.json({
            ok: false,
            limit_reached: true,
            message: `Limit harian email sementara tercapai.`
          }, { status: 429 });
        }

        await userRef.update({
          tempMailTimestamps: [...recentUsage, now]
        });
      }
    }

    const paxsenixApiKey = process.env.PAXSENIX_API_KEY;
    if (!paxsenixApiKey) throw new Error("PAXSENIX_API_KEY is missing");

    const response = await axios.get(process.env.TEMPMAIL_CREATE_URL, {
      headers: {
        'Authorization': `Bearer ${paxsenixApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // MASKING
    return NextResponse.json({
      ok: true,
      creator: "@Viintools",
      email: response.data.email
    });

  } catch (error: any) {
    console.error("TempMail Create Error:", error.response?.data || error.message);
    return NextResponse.json({
      ok: false,
      message: 'Email service error.'
    }, { status: 500 });
  }
}
