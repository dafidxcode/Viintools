import { NextResponse } from 'next/server';
import { validateApiKey } from '../../../../../lib/auth-middleware';
import axios from 'axios';

export async function POST(req: Request) {
    const auth = await validateApiKey(req);
    if (auth.error) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        const body = await req.json();
        const { prompt, model, ratio, type, imageUrl } = body;

        if (!prompt) return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });

        const paxsenixKey = process.env.PAXSENIX_API_KEY;
        // Construct URL for Veo
        // Assuming Veo logic matches internal: /generations/google/veo
        const engineUrl = `${process.env.PAXSENIX_BASE_URL}/generations/google/veo`;

        const payload = {
            prompt,
            model: model || 'veo-3.1-fast',
            aspect_ratio: ratio || '16:9',
            image_url: type === 'image-to-video' ? imageUrl : undefined
        };

        const response = await axios.post(engineUrl, payload, {
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
        return NextResponse.json({ success: false, error: error.message || 'Video Engine Failure' }, { status: 500 });
    }
}
