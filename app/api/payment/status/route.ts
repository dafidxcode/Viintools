
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
    console.error("Firebase Admin Init Error:", e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) return NextResponse.json({ error: 'Missing Order ID' }, { status: 400 });

  const apiKey = process.env.KLIKQRIS_API_KEY;
  const merchantId = process.env.KLIKQRIS_MERCHANT_ID;

  if (!apiKey || !merchantId) {
    return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
  }

  try {
    const response = await axios.get(`https://klikqris.com/api/qrisv2/status/${merchantId}/${orderId}`, {
      headers: {
        'x-api-key': apiKey,
        'id_merchant': merchantId
      }
    });

    const result = response.data;

    // KlikQRIS: status sukses adalah "SUCCESS"
    if (result.status && result.data.status === 'SUCCESS') {
      const payRef = admin.firestore().collection('payments').doc(orderId);
      const paySnap = await payRef.get();

      if (paySnap.exists) {
        const paymentData = paySnap.data();
        if (paymentData && paymentData.status !== 'SUCCESS') {
          const { uid, plan } = paymentData;
          await admin.firestore().collection('users').doc(uid).update({
            plan: plan || 'PRO',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await payRef.update({
            status: 'SUCCESS',
            paid_at: result.data.paid_at || new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("KlikQRIS Check Status Error:", error.message);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
