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
        const { prompt, model, ratio } = body;

        if (!prompt) return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });

        const paxsenixKey = process.env.PAXSENIX_API_KEY;
        const url = `${process.env.PAXSENIX_BASE_URL}/generations/google/imagen-3`; // Assuming endpoint

        const payload = {
            prompt,
            model: model || 'imagen-3.0-fast-generate-001',
            aspect_ratio: ratio || '1:1'
        };

        const response = await axios.post(url, payload, {
            headers: { 'Authorization': `Bearer ${paxsenixKey}` }
        });

        if (response.data && response.data.task_id) {
            return NextResponse.json({
                success: true,
                taskId: response.data.task_id,
                status: 'processing'
            });
        }

        throw new Error(JSON.stringify(response.data));

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || 'Imagen Engine Failure' }, { status: 500 });
    }
}
