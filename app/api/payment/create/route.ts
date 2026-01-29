
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

export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const { amount, plan } = await req.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ success: false, message: 'Nominal tidak valid.' }, { status: 400 });
    }

    const orderId = `INV-${decoded.uid.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const apiKey = process.env.KLIKQRIS_API_KEY;
    const merchantId = process.env.KLIKQRIS_MERCHANT_ID;

    if (!apiKey || !merchantId) {
      throw new Error("KlikQRIS configuration is missing in environment variables.");
    }
    
    // Integrasi KlikQRIS Create Transaction
    const response = await axios.post('https://klikqris.com/api/qrisv2/create', {
      order_id: orderId,
      id_merchant: merchantId,
      amount: amount
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'id_merchant': merchantId
      }
    });

    const result = response.data;

    if (result.status) {
      // Sesuai dokumentasi: total_amount berisi kode unik yang harus dibayar user
      await admin.firestore().collection('payments').doc(orderId).set({
        uid: decoded.uid,
        amount_requested: amount,
        total_amount: result.data.total_amount, 
        plan: plan,
        status: 'PENDING',
        qris_url: result.data.qris_url,
        expired_at: result.data.expired_at,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return NextResponse.json({
        success: true,
        checkout_url: result.data.qris_url, 
        data: result.data
      });
    }

    throw new Error(result.message || "Gagal menghubungi KlikQRIS API.");

  } catch (error: any) {
    console.error("KlikQRIS Create Order Error:", error.response?.data || error.message);
    return NextResponse.json({ 
      success: false, 
      message: 'Gagal membuat tagihan QRIS. Silakan coba lagi.' 
    }, { status: 500 });
  }
}
