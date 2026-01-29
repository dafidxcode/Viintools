
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Node.js runtime is stable for fetching large buffers
export const maxDuration = 60; // Allow up to 60s for slow CDN sources

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Source responded with ${response.status}: ${response.statusText}`);
    }

    // Clone headers for the response
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
    const contentLength = response.headers.get('Content-Length');

    // Determine extension
    let extension = 'bin';
    if (contentType.includes('audio/mpeg')) extension = 'mp3';
    else if (contentType.includes('video/mp4')) extension = 'mp4';
    else if (contentType.includes('image/png')) extension = 'png';
    else if (contentType.includes('image/jpeg')) extension = 'jpg';
    else if (contentType.includes('image/webp')) extension = 'webp';
    else {
      // Try to get from URL
      const extMatch = targetUrl.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
      if (extMatch) extension = extMatch[1];
    }

    // Return as a streaming response to bypass memory limits
    return new Response(response.body, {
      headers: {
        'Content-Type': contentType,
        ...(contentLength && { 'Content-Length': contentLength }),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Disposition': `attachment; filename="viintools_file_${Date.now()}.${extension}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Proxy Server Error:', error.message);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
