
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
    console.error("Admin Init Error:", e);
  }
}

export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const body = await req.json();
    const { type } = body;

    const db = admin.firestore();
    const kieApiKey = process.env.KIE_API_KEY;
    const userRef = db.collection('users').doc(decoded.uid);

    // --- LOGIKA SYNC MUSIK ---
    if (type === 'music') {
      const { tracks } = body;
      if (!Array.isArray(tracks)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

      const syncPromises = tracks.map(async (track) => {
        const safeTitle = (track.title || 'Studio_Track').replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 40);
        const internalId = track.id || `tr_${Date.now()}`;

        let finalAudioUrl = track.audioUrl;
        let finalImageUrl = track.imageUrl;

        // Persistensi Audio
        if (kieApiKey && finalAudioUrl && !finalAudioUrl.includes('kieai.redpandaai.co') && !finalAudioUrl.includes('tempfile.redpandaai.co')) {
          try {
            const audioRes = await axios.post('https://kieai.redpandaai.co/api/file-url-upload', {
              fileUrl: finalAudioUrl,
              uploadPath: `music-library/${decoded.uid}`,
              fileName: `${safeTitle}_${internalId}_audio.mp3`
            }, { headers: { 'Authorization': `Bearer ${kieApiKey}` }, timeout: 30000 });
            if (audioRes.data.success) finalAudioUrl = audioRes.data.downloadUrl;
          } catch (e) { console.error("Kie Audio Upload Error:", e.message); }
        }

        // Persistensi Cover
        if (kieApiKey && finalImageUrl && !finalImageUrl.includes('kieai.redpandaai.co')) {
          try {
            const imgRes = await axios.post('https://kieai.redpandaai.co/api/file-url-upload', {
              fileUrl: finalImageUrl,
              uploadPath: `music-library/${decoded.uid}`,
              fileName: `${safeTitle}_${internalId}_cover.jpg`
            }, { headers: { 'Authorization': `Bearer ${kieApiKey}` }, timeout: 15000 });
            if (imgRes.data.success) finalImageUrl = imgRes.data.downloadUrl;
          } catch (e) { console.error("Kie Image Upload Error:", e.message); }
        }

        const trackData = {
          ...track,
          audioUrl: finalAudioUrl || null,
          imageUrl: finalImageUrl || null,
          userId: decoded.uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await userRef.collection('tracks').doc(internalId).set(trackData);
        return trackData;
      });
      const results = await Promise.all(syncPromises);
      return NextResponse.json({ success: true, tracks: results });
    }

    // --- LOGIKA SYNC IMAGE ---
    if (type === 'image') {
      const { urls, prompt } = body;
      if (!Array.isArray(urls)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

      const syncPromises = urls.map(async (url: string, i: number) => {
        let finalUrl = url;
        if (kieApiKey && !url.includes('kieai.redpandaai.co') && !url.includes('tempfile.redpandaai.co')) {
          try {
            const res = await axios.post('https://kieai.redpandaai.co/api/file-url-upload', {
              fileUrl: url,
              uploadPath: `image-library/${decoded.uid}`,
              fileName: `img_${Date.now()}_${i}.jpg`
            }, { headers: { 'Authorization': `Bearer ${kieApiKey}` }, timeout: 30000 });
            if (res.data.success) finalUrl = res.data.downloadUrl;
          } catch (e) { console.error("Kie Image Sync Error:", e.message); }
        }
        await userRef.collection('images').add({
          url: finalUrl,
          prompt: prompt || 'AI Generated Image',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return finalUrl;
      });
      const finalUrls = await Promise.all(syncPromises);
      return NextResponse.json({ success: true, urls: finalUrls });
    }

    // --- LOGIKA SYNC VIDEO ---
    if (type === 'video') {
      const { url, prompt } = body;
      let finalUrl = url;
      if (kieApiKey && url && !url.includes('kieai.redpandaai.co') && !url.includes('tempfile.redpandaai.co')) {
        try {
          const res = await axios.post('https://kieai.redpandaai.co/api/file-url-upload', {
            fileUrl: url,
            uploadPath: `video-library/${decoded.uid}`,
            fileName: `vid_${Date.now()}.mp4`
          }, { headers: { 'Authorization': `Bearer ${kieApiKey}` }, timeout: 60000 });
          if (res.data.success) finalUrl = res.data.downloadUrl;
        } catch (e) { console.error("Kie Video Sync Error:", e.message); }
      }
      await userRef.collection('videos').add({
        url: finalUrl || null,
        prompt: prompt || 'AI Generated Video',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, url: finalUrl });
    }

    return NextResponse.json({ success: false, message: 'Unsupported type' }, { status: 400 });
  } catch (error: any) {
    console.error("Library Universal Sync Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
