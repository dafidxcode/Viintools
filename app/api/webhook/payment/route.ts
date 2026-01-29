
import { NextResponse } from 'next/server';
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
    console.error("Firebase Admin Init Error (Webhook Payment):", e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // KlikQRIS Webhook Payload: { status: "success", data: { order_id: "...", amount_paid: ... } }
    if (body.status === 'success' && body.data) {
      const orderId = body.data.order_id;
      const payRef = admin.firestore().collection('payments').doc(orderId);
      const paySnap = await payRef.get();

      if (paySnap.exists) {
        const paymentData = paySnap.data();

        if (paymentData && paymentData.status !== 'SUCCESS') {
          const { uid, plan } = paymentData;

          await admin.firestore().collection('users').doc(uid).update({
            plan: plan || 'PRO',
            planActivatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await payRef.update({
            status: 'SUCCESS',
            amount_paid: body.data.amount_paid,
            paid_at: body.data.payment_date || admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`KlikQRIS Webhook Success: User ${uid}, Order ${orderId}`);
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    console.error("KlikQRIS Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
