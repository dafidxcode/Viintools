import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Admin SDK if not already done
function initAdmin() {
    if (!admin.apps.length) {
        try {
            const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (!sa) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
            const serviceAccount = JSON.parse(sa.trim());
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (e: any) {
            console.error("Firebase Admin Init Error:", e.message);
        }
    }
}

export async function validateApiKey(req: Request) {
    initAdmin();

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
        return { error: 'Missing x-api-key header', status: 401 };
    }

    try {
        const keysRef = admin.firestore().collection('api_keys');
        const q = await keysRef.where('key', '==', apiKey).limit(1).get();

        if (q.empty) {
            return { error: 'Invalid API Key', status: 401 };
        }

        const keyDoc = q.docs[0];
        const keyData = keyDoc.data();

        if (!keyData.isActive) {
            return { error: 'API Key is disabled', status: 403 };
        }

        // CORS / Domain Check
        const origin = req.headers.get('origin') || req.headers.get('referer');
        if (keyData.domain !== '*' && origin) {
            // Basic check: origin contains allowed domain
            // Production: strict URL parsing
            if (!origin.includes(keyData.domain)) {
                return { error: `Domain not allowed for this key. Allowed: ${keyData.domain}`, status: 403 };
            }
        }

        // Update Usage Count (Fire and forget, don't await blocking)
        keyDoc.ref.update({
            usageCount: admin.firestore.FieldValue.increment(1)
        }).catch(console.error);

        return { success: true, ownerId: keyData.ownerId, keyId: keyDoc.id };

    } catch (e: any) {
        console.error("Auth Middleware Error:", e);
        return { error: 'Internal Auth Error', status: 500 };
    }
}
