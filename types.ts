
export enum View {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  LIBRARY = 'LIBRARY',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGEN = 'IMAGEN',
  DEEP_NUDE = 'DEEP_NUDE',
  TEMP_MAIL = 'TEMP_MAIL',
  TEXT_TO_SPEECH = 'TEXT_TO_SPEECH',
  SETTINGS = 'SETTINGS',
  COMING_SOON = 'COMING_SOON',
  UPGRADE_PACKAGE = 'UPGRADE_PACKAGE',
  VEO_VIDEO = 'VEO_VIDEO',
  GROK_VIDEO = 'GROK_VIDEO',
  MUSIC_GEN = 'MUSIC_GEN',
  MUSIC_COVER = 'MUSIC_COVER',
  MUSIC_SPLIT = 'MUSIC_SPLIT',
  SUNO_MUSIC_V2 = 'SUNO_MUSIC_V2',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
}

export interface Track {
  id: string;
  title: string;
  style: string;
  audioUrl: string;
  imageUrl: string;
  prompt?: string;
  duration?: number;
  createdAt: string | any;
  model?: string;
  userId?: string;
}

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error' | 'synced';
  taskUrl?: string;
  internalTaskId?: string; // ID aman dari server
  createdAt: number;
  parameters: any;
  result?: any;
}

export interface ImageJob {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  taskUrl?: string;
  internalTaskId?: string; // ID aman dari server
  createdAt: number;
  parameters: {
    prompt: string;
    model: string;
    ratio: string;
  };
  result?: string[];
}

export interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  taskUrl?: string;
  internalTaskId?: string; // ID aman dari server
  createdAt: number;
  parameters: {
    prompt: string;
    model: string;
    ratio: string;
    type: 'text-to-video' | 'image-to-video';
    imageUrls?: string;
  };
  result?: string;
}

export interface MailMessage {
  id: number;
  subject: string;
  sender_email: string;
  sender_name: string | null;
  date: string;
  datediff: string;
  content?: string;
  content_raw?: string;
  attachments?: Array<{ file: string; url: string }>;
}

export interface TempMailState {
  email: string | null;
  expiresAt: number | null;
  messages: MailMessage[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  imageTimestamps?: number[];
  tempMailTimestamps?: number[];
  ttsTimestamps?: number[];
  videoTimestamps?: number[];
  freeUsageCount?: number;
}
