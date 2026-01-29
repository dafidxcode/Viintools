
import axios from 'axios';
import FormData from 'form-data';

const KIE_API_KEY = process.env.KIE_API_KEY;

interface KieResponse {
    success: boolean;
    code: number;
    msg: string;
    data: {
        fileName: string;
        filePath: string;
        downloadUrl: string;
        fileSize: number;
        mimeType: string;
        uploadedAt: string;
    };
}

export async function uploadUrlToKie(fileUrl: string, uploadPath: string, fileName?: string) {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is missing");

    try {
        const payload: any = { fileUrl, uploadPath };
        if (fileName) payload.fileName = fileName;

        const response = await axios.post<KieResponse>(
            'https://kieai.redpandaai.co/api/file-url-upload',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        // Normalize response to simple structure for app usage
        if (response.data.success && response.data.data) {
            return { success: true, downloadUrl: response.data.data.downloadUrl, original: response.data };
        }
        return { success: false, error: response.data.msg || 'Upload failed' };

    } catch (error: any) {
        console.error("Kie AI URL Upload Error:", error.response?.data || error.message);
        throw error;
    }
}

export async function uploadFileStreamToKie(file: Buffer, uploadPath: string, fileName?: string) {
    if (!KIE_API_KEY) throw new Error("KIE_API_KEY is missing");

    try {
        const formData = new FormData();
        formData.append('file', file, fileName || 'upload.bin');
        formData.append('uploadPath', uploadPath);
        if (fileName) formData.append('fileName', fileName);

        const response = await axios.post<KieResponse>(
            'https://kieai.redpandaai.co/api/file-stream-upload', // Corrected endpoint per docs
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${KIE_API_KEY}`,
                    ...formData.getHeaders()
                },
                maxBodyLength: Infinity,
                timeout: 60000
            }
        );

        if (response.data.success && response.data.data) {
            return { success: true, downloadUrl: response.data.data.downloadUrl, original: response.data };
        }
        return { success: false, error: response.data.msg || 'Upload failed' };

    } catch (error: any) {
        console.error("Kie AI File Stream Upload Error:", error.response?.data || error.message);
        throw error;
    }
}
