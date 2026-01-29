
import { NextResponse } from 'next/server';
import axios from 'axios';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa.trim())) });
  } catch (e) { console.error("Firebase Admin Error:", e); }
}

export async function GET(req: Request, { params }: { params: { taskId: string } }) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const { taskId } = params;

    const taskRef = admin.firestore().collection('users').doc(uid).collection('active_tasks').doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      return NextResponse.json({ ok: false, message: 'Task not found' }, { status: 404 });
    }

    const taskData = taskSnap.data();

    // If task is already marked as done in our database
    if (taskData?.status === 'done') {
      await taskRef.delete();
      return NextResponse.json({ status: 'done', result: taskData.result });
    }

    const taskUrl = taskData?.taskUrl;
    if (!taskUrl) {
      return NextResponse.json({ status: 'processing' });
    }

    // Call Engine (Paxsenix/Kie) from Server
    const response = await axios.get(taskUrl, {
      headers: { 'Authorization': `Bearer ${process.env.PAXSENIX_API_KEY}` },
      timeout: 15000,
      validateStatus: () => true // Handle 4xx/5xx manually
    });

    if (response.status >= 400) {
      console.error(`Engine returned ${response.status} for ${taskUrl}`);
      // Don't delete yet, might be a temporary engine hiccup
      return NextResponse.json({ status: 'processing', message: 'Engine busy' });
    }

    const data = response.data;

    // Check for success indicators
    const statusStr = String(data.status || '').toLowerCase();
    const isDoneStatus = ['done', 'completed', 'success', 'finished'].includes(statusStr);
    const hasImmediateResult = !!(data.url || data.image_url || data.image_urls || data.video_url || data.data);

    // Paxsenix nano-banana and imagen often return ok: true and the url immediately
    const isSuccessfullyFinished = (data.ok === true && (isDoneStatus || hasImmediateResult)) || isDoneStatus;

    if (isSuccessfullyFinished) {
      let finalResult = data.video_url || data.url || data.image_urls || data.image_url || data.result;

      // Handle Music (Suno) structure
      const musicTracks = data.records || data.data;
      if (taskData?.type === 'music' && Array.isArray(musicTracks)) {
        finalResult = musicTracks.map((track: any) => ({
          id: track.id || `tr_${Math.random().toString(36).slice(2, 6)}`,
          title: track.title || "Untitled Masterpiece",
          style: track.tags || track.style || "AI Music",
          audioUrl: track.audio_url || track.url,
          imageUrl: track.image_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}`,
          duration: track.duration || 0,
          model: track.model_name || 'V5',
          createdAt: new Date().toISOString(),
          userId: uid
        }));

        // Save to Firestore Library
        const batch = admin.firestore().batch();
        const tracksRef = admin.firestore().collection('users').doc(uid).collection('tracks');

        finalResult.forEach((track: any) => {
          const docRef = tracksRef.doc(track.id);
          batch.set(docRef, track);
        });

        await batch.commit();
      }

      await taskRef.delete();
      return NextResponse.json({ status: 'done', result: finalResult });
    }

    // Check for failure indicators
    const activeStatuses = ['processing', 'pending', 'started', 'queued', 'generating', 'uploading'];
    const isFailed = (statusStr === 'error' || statusStr === 'failed') || (data.ok === false && !activeStatuses.includes(statusStr));

    if (isFailed) {
      console.error("Task failed on engine side:", data);
      await taskRef.delete();
      return NextResponse.json({ status: 'error', message: data.message || 'Engine execution failed' });
    }

    // Default to processing
    return NextResponse.json({ status: 'processing' });

  } catch (error: any) {
    console.error("Polling System Internal Error:", error.message);
    return NextResponse.json({ status: 'processing', message: 'Synchronizing...' });
  }
}
