
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { GoogleGenAI } from "@google/genai";

if (!admin.apps.length) {
  try {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (sa) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa.trim())) });
  } catch (e) { console.error("Firebase Admin Init Error:", e); }
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await admin.auth().verifyIdToken(token);
    const body = await req.json();
    const { action, prompt, model, customMode } = body;

    // --- Action: Refine Music Prompt ---
    if (action === 'refine-music') {
      const isHighEnd = ['V5', 'V4.5', 'V4.5PLUS'].includes(model);
      // Limits: Simple mode = 400, Custom HighEnd = 5000, Custom Normal = 3000
      const limit = customMode ? (isHighEnd ? 5000 : 3000) : 400;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this music generation prompt into a highly detailed studio description. 
        Focus on genre, instruments, BPM, and mood. 
        CRITICAL: The output MUST NOT exceed ${limit} characters.
        Return ONLY the refined prompt text. 
        Input prompt: "${prompt}"`,
      });
      
      const refinedText = response.text.trim();
      return NextResponse.json({ refined: refinedText.substring(0, limit) });
    }

    // --- Action: Refine Image Prompt ---
    if (action === 'refine-image') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Expand this image prompt into a professional artistic description for an AI image generator. 
        Include details about lighting, art style, camera angle, and textures. 
        Return ONLY the refined prompt text. 
        Input prompt: "${prompt}"`,
      });
      return NextResponse.json({ refined: response.text.trim() });
    }

    // --- Action: Refine Video Prompt ---
    if (action === 'refine-video') {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Convert this simple video idea into a cinematic, high-detail prompt for an AI video generator (VEO 3.1). 
        Describe camera movement (pan, tilt, zoom), lighting, environmental details, and fluid motion. 
        Return ONLY the refined prompt text. 
        Input prompt: "${prompt}"`,
      });
      return NextResponse.json({ refined: response.text.trim() });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("Execute API Error:", error.message);
    return NextResponse.json({ error: 'Neural Engine Busy' }, { status: 500 });
  }
}
