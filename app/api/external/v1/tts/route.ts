import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth-middleware';
import axios from 'axios';

export async function POST(req: Request) {
    const auth = await validateApiKey(req);
    if (auth.error) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { text, voice, language, engine } = body;

        if (!text) return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });

        // Use internal TTS logic or call provider directly
        // Replicating logic from /api/tts
        const url = process.env.KIE_API_URL + '/tts';
        const kieKey = process.env.KIE_API_KEY;

        // Use default voice if not provided
        const payload = {
            text,
            voice: voice || 'alloy',
            language: language || 'en-US',
            engine: engine || 'openai' // or speechify/azure depending on voice
        };

        // Note: Internal TTS often uses GET, but external should be POST for larger text
        // Adjusting to match probable provider requirement (GET in original code)
        const response = await axios.get(url, {
            params: payload,
            headers: { 'x-api-key': kieKey }
        });

        if (response.data && response.data.url) {
            return NextResponse.json({ success: true, url: response.data.url });
        }

        throw new Error("TTS Provider returned invalid data");

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'TTS Engine Failure' }, { status: 500 });
    }
}
