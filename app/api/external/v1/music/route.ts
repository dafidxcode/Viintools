import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth-middleware';
import axios from 'axios';
import admin from 'firebase-admin';

export async function POST(req: Request) {
    const auth = await validateApiKey(req);
    if (auth.error) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { prompt, customMode, style, title, instrumental, model } = body;

        // Validation
        if (customMode) {
            if (!style || !title || !prompt) {
                return NextResponse.json({ success: false, error: 'Custom mode requires: prompt (lyrics), style, and title.' }, { status: 400 });
            }
        } else {
            if (!prompt) return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
        }

        // Prepare Payload
        const payload = {
            prompt,
            tags: style, // Suno API uses 'tags' for style
            title,
            make_instrumental: instrumental,
            mv: model || 'chirp-v3-5', // Default model
            wait_audio: false // Async
        };

        // Call Suno Engine (Using existing proxy/engine logic)
        const paxsenixKey = process.env.PAXSENIX_API_KEY;
        const engineUrl = customMode
            ? `${process.env.SUNO_API_URL}/custom_generate`
            : `${process.env.SUNO_API_URL}/generate`;

        const response = await axios.post(engineUrl, payload, {
            headers: {
                'Authorization': `Bearer ${paxsenixKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Handle array response (Suno often returns array of 2 clips)
        const data = response.data;
        if (data && (Array.isArray(data) || data.id)) {
            const taskId = Array.isArray(data) ? data[0].id : data.id;

            return NextResponse.json({
                success: true,
                taskId: taskId,
                status: 'processing',
                message: 'Use GET /api/external/v1/status/:taskId to check progress.'
            });
        }

        throw new Error("Invalid response from music engine");

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Music Engine Failure' }, { status: 500 });
    }
}
