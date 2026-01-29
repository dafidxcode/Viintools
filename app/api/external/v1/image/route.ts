import { NextResponse } from 'next/server';
import { validateApiKey } from '../../../../lib/auth-middleware';
import axios from 'axios';
import admin from 'firebase-admin';

export async function POST(req: Request) {
    // 1. Validate API Key
    const auth = await validateApiKey(req);
    if (auth.error) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        // 2. Parse Body
        const body = await req.json();
        const { prompt, model, ratio } = body;

        if (!prompt) {
            return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
        }

        // 3. Call Nano Banana Engine
        const studioApiKey = process.env.PAXSENIX_API_KEY;
        const engineUrl = process.env.NANOBANANA_API_URL;
        const urlParams = new URLSearchParams();
        urlParams.append('prompt', prompt);
        urlParams.append('model', model || 'nano-banana-pro');
        urlParams.append('ratio', ratio || '1:1');

        const response = await axios.get(`${engineUrl}?${urlParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${studioApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        if (response.data.ok) {
            // 4. Log successful task for the key owner
            const internalId = `ext_img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            const resultUrl = response.data.url || response.data.image_url;
            const isDone = !!resultUrl;

            // Note: We can opt to save this to the user's history if desired, 
            // but for "External API" usually we just return the result.
            // Saving to DB helps with debugging.
            const userRef = admin.firestore().collection('users').doc(auth.ownerId!);
            await userRef.collection('active_tasks').doc(internalId).set({
                taskUrl: resultUrl,
                type: 'image_external',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                status: isDone ? 'done' : 'processing',
                source: 'external_api'
            });

            return NextResponse.json({
                success: true,
                taskId: internalId,
                url: resultUrl
            });
        }

        throw new Error(response.data.message || "Engine rejected request");

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message || 'Engine Failure'
        }, { status: 500 });
    }
}
