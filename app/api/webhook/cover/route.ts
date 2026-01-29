
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
    console.error("Firebase Admin Init Error (Webhook):", e);
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const body = await req.json();
    const { code, msg, data: kieData } = body;

    if (!kieData || !kieData.task_id) {
      return NextResponse.json({ status: 'ignored', reason: 'no_task_id' });
    }

    const { callbackType, task_id, data: records } = kieData;
    if (!uid) return NextResponse.json({ status: 'error', reason: 'no_uid' }, { status: 400 });

    const userRef = admin.firestore().collection('users').doc(uid);
    const jobRef = userRef.collection('jobs').doc(task_id);
    const jobSnap = await jobRef.get();

    if (code !== 200) {
      if (jobSnap.exists) {
        await jobRef.update({
          status: 'error',
          progress: msg || `AI Engine Error (Code ${code})`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      return NextResponse.json({ status: 'received' });
    }

    // Map semua hasil records yang dikirim engine
    const tracks = Array.isArray(records) ? records.map((r: any) => ({
      id: r.id || `v5_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: r.title || "V5 Remix Output",
      style: r.tags || "AI Cover",
      prompt: r.prompt || "",
      audioUrl: r.audio_url,
      imageUrl: r.image_url,
      duration: r.duration || 0,
      createdAt: new Date().toISOString(),
      model: 'V5'
    })) : (records ? [{
      id: records.id || `v5_${Date.now()}`,
      title: records.title || "V5 Remix Output",
      audioUrl: records.audio_url,
      imageUrl: records.image_url,
      createdAt: new Date().toISOString(),
      model: 'V5'
    }] : []);

    const updates: any = {
      status: callbackType === 'complete' ? 'done' : 'processing',
      progress: callbackType === 'complete' ? 'Final master render complete' : 'Synthesis in progress...',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      result: tracks // Simpan semua track di result job
    };

    if (callbackType === 'complete') {
      updates.completedAt = admin.firestore.FieldValue.serverTimestamp();
      
      // Sinkronisasi ke Library (Firestore)
      if (tracks.length > 0) {
        const batch = admin.firestore().batch();
        tracks.forEach((track) => {
          const trackRef = userRef.collection('tracks').doc(track.id);
          batch.set(trackRef, {
            ...track,
            userId: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        
        // Pemicu sinkronisasi cloud permanen (Opsional, karena webhook biasanya kirim URL CDN engine)
        // Kita bisa biarkan JobMonitor frontend yang memanggil /api/save-to-library untuk persistensi penuh
      }
    }

    if (jobSnap.exists) {
      await jobRef.update(updates);
    } else {
      await jobRef.set({
        ...updates,
        taskId: task_id,
        userId: uid,
        type: 'cover',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return NextResponse.json({ status: 'received' });
  } catch (error: any) {
    console.error("Webhook Processing Error:", error.message);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
