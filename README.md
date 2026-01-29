# Viintools AI Platform (V2)

A comprehensive AI Studio platform powered by advanced Neural Engines for Image, Video, Music, and Voice generation.

## 🚀 Key Features

### 🎵 AI Music Studio (V2)
- **Suno V2 Engine**: High-fidelity music generation with V3 endpoints.
- **Modes**:
  - **Simple**: Quick generation with a short prompt.
  - **Custom**: Full control over Lyrics (Verse/Chorus), Style/Genre, and Title.
  - **JSON**: Advanced payload construction for power users.
- **History & Playback**: Real-time generation status and integrated player.

### 🎥 AI Video Studio
- **Veo Video**: Text-to-Video and Image-to-Video generation using Veo 3.1.
- **Grok Video**: High-speed video generation engine.

### 🎨 AI Image Studio
- **Nano Banana**: Instant high-quality image generation.
- **Imagen 3**: Advanced photorealistic image synthesis.
- **Deep Nude**: (Restricted PRO feature) specialized image processing.

### 🎙️ AI Voice & Audio
- **Vocal Splitter**: Separate vocals and instruments from any audio track.
- **Text to Speech**: Natural sounding speech synthesis with multi-language support.
- **AI Cover**: Generate AI covers of popular songs.

### 🛠️ Utilities
- **Temp Mail**: Disposable email generator for privacy.
- **YouTube Downloader**: High-speed YouTube to MP4/MP3 downloader.

## 💻 Tech Stack

- **Framework**: React 18 / Vite / Next.js (Hybrid)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **State Management**: Zustand
- **Backend & Auth**: Firebase (Auth, Firestore, Storage)
- **API Integration**: Custom Proxy Server (Node.js/Next.js API Routes)

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/viintools-v2.git
   cd viintools-v2
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory. Use `.env.example` as a template.
   ```bash
   cp .env.example .env
   ```
   **Required Variables:**
   - Firebase Config (`NEXT_PUBLIC_FIREBASE_...`)
   - API Keys (`PAXSENIX_API_KEY`, etc.)
   - API Endpoint URLs (See `.env.example` for full list)

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🔒 Security

- All API keys and sensitive endpoint URLs are secured in `.env`.
- Frontend does **not** expose vendor names or keys.
- API Routes act as a proxy to mask upstream providers.

## 📄 License

Private / Proprietary.
