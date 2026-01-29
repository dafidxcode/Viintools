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
        const { audioUrl } = body;

        if (!audioUrl) return NextResponse.json({ success: false, error: 'Audio URL is required' }, { status: 400 });

        const paxsenixKey = process.env.PAXSENIX_API_KEY;
        const url = `${process.env.PAXSENIX_BASE_URL}/audio/stems`;

        const response = await axios.post(url, {
            url: audioUrl,
            task: 'split'
        }, {
            headers: { 'Authorization': `Bearer ${paxsenixKey}` }
        });

        if (response.data && response.data.data) {
            return NextResponse.json({
                success: true,
                result: {
                    vocal: response.data.data.vocal_url,
                    instrumental: response.data.data.instrumental_url
                }
            });
        }

        throw new Error("Splitter failed to process audio");

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Splitter Engine Failure' }, { status: 500 });
    }
}
