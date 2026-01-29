
import React, { useState } from 'react';
import {
  Volume2, RefreshCw, Play, Download,
  Sparkles, ChevronDown, Loader2, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { auth, deleteTrackFromFirestore } from '../firebase';
import { useAppStore } from '../store';
import { Track } from '../types';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Mapping language codes to readable names for labels
const langMap: Record<string, string> = {
  "en-US": "English (US)", "en-GB": "English (UK)", "en-AU": "English (AU)",
  "en-IN": "English (IN)", "en-NG": "English (NG)", "en-ZA": "English (ZA)",
  "id-ID": "Indonesian", "af-ZA": "Afrikaans", "ar-AE": "Arabic (AE)",
  "ar-IQ": "Arabic (IQ)", "bn-IN": "Bengali", "bg-BG": "Bulgarian",
  "ca-ES": "Catalan", "zh-CN": "Chinese (Mandarin)", "zh-HK": "Chinese (Cantonese)",
  "zh-TW": "Chinese (Taiwan)", "hr-HR": "Croatian", "cs-CZ": "Czech",
  "da-DK": "Danish", "nl-NL": "Dutch", "nl-BE": "Dutch (BE)",
  "et-EE": "Estonian", "fil-PH": "Filipino", "fi-FI": "Finnish",
  "fr-FR": "French", "fr-CA": "French (CA)", "fr-BE": "French (BE)",
  "fr-CH": "French (CH)", "de-DE": "German", "ka-GE": "Georgian",
  "el-GR": "Greek", "he-IL": "Hebrew", "hi-IN": "Hindi",
  "hu-HU": "Hungarian", "is-IS": "Icelandic", "it-IT": "Italian",
  "ja-JP": "Japanese", "kk-KZ": "Kazakh", "ko-KR": "Korean",
  "lt-LT": "Lithuanian", "lv-LV": "Latvian", "ms-MY": "Malay",
  "ne-NP": "Nepali", "nb-NO": "Norwegian", "fa-IR": "Persian",
  "pl-PL": "Polish", "pt-BR": "Portuguese (BR)", "pt-PT": "Portuguese (PT)",
  "ro-RO": "Romanian", "ru-RU": "Russian", "sk-SK": "Slovak",
  "sl-SI": "Slovenian", "si-LK": "Sinhala", "es-ES": "Spanish (ES)",
  "es-MX": "Spanish (MX)", "es-US": "Spanish (US)", "sv-SE": "Swedish",
  "sw-TZ": "Swahili", "ta-IN": "Tamil (IN)", "ta-LK": "Tamil (LK)",
  "ta-MY": "Tamil (MY)", "ta-SG": "Tamil (SG)", "te-IN": "Telugu",
  "th-TH": "Thai", "tr-TR": "Turkish", "ur-IN": "Urdu (IN)",
  "ur-PK": "Urdu (PK)", "uk-UA": "Ukrainian", "vi-VN": "Vietnamese",
  "ga-IE": "Irish"
};

const AVAILABLE_VOICES = [
  { name: "henry", language: "en-US", engine: "speechify" },
  { name: "bwyneth", language: "en-US", engine: "speechify" },
  { name: "snoop", language: "en-US", engine: "resemble" },
  { name: "mrbeast", language: "en-US", engine: "speechify" },
  { name: "gwyneth", language: "en-US", engine: "speechify" },
  { name: "cliff", language: "en-US", engine: "speechify" },
  { name: "guy", language: "en-US", engine: "azure" },
  { name: "jane", language: "en-US", engine: "azure" },
  { name: "matthew", language: "en-US", engine: "neural" },
  { name: "benwilson", language: "en-US", engine: "speechify" },
  { name: "presidential", language: "en-US", engine: "speechify" },
  { name: "carly", language: "en-US", engine: "speechify" },
  { name: "kyle", language: "en-US", engine: "speechify" },
  { name: "kristy", language: "en-US", engine: "speechify" },
  { name: "oliver", language: "en-US", engine: "speechify" },
  { name: "tasha", language: "en-US", engine: "speechify" },
  { name: "joe", language: "en-US", engine: "speechify" },
  { name: "lisa", language: "en-US", engine: "speechify" },
  { name: "george", language: "en-US", engine: "speechify" },
  { name: "emily", language: "en-US", engine: "speechify" },
  { name: "rob", language: "en-US", engine: "speechify" },
  { name: "russell", language: "en-GB", engine: "speechify" },
  { name: "benjamin", language: "en-GB", engine: "speechify" },
  { name: "jenny", language: "en-US", engine: "azure" },
  { name: "aria", language: "en-US", engine: "azure" },
  { name: "joanna", language: "en-US", engine: "neural" },
  { name: "nate", language: "en-US", engine: "speechify" },
  { name: "mary", language: "en-US", engine: "speechify" },
  { name: "salli", language: "en-US", engine: "neural" },
  { name: "joey", language: "en-US", engine: "neural" },
  { name: "ryan", language: "en-GB", engine: "azure" },
  { name: "sonia", language: "en-GB", engine: "azure" },
  { name: "oliver_gb", name_original: "oliver", language: "en-GB", engine: "azure" },
  { name: "amy", language: "en-GB", engine: "neural" },
  { name: "michael", language: "en-GB", engine: "speechify" },
  { name: "thomas", language: "en-GB", engine: "azure" },
  { name: "libby", language: "en-GB", engine: "azure" },
  { name: "narrator", language: "en-GB", engine: "speechify" },
  { name: "brian", language: "en-GB", engine: "neural" },
  { name: "natasha", language: "en-AU", engine: "azure" },
  { name: "william", language: "en-AU", engine: "azure" },
  { name: "freya", language: "en-AU", engine: "azure" },
  { name: "ken", language: "en-AU", engine: "azure" },
  { name: "olivia", language: "en-AU", engine: "neural" },
  { name: "aditi", language: "en-IN", engine: "standard" },
  { name: "abeo", language: "en-NG", engine: "azure" },
  { name: "ezinne", language: "en-NG", engine: "azure" },
  { name: "luke", language: "en-ZA", engine: "azure" },
  { name: "leah", language: "en-ZA", engine: "azure" },
  { name: "willem", language: "af-ZA", engine: "azure" },
  { name: "adri", language: "af-ZA", engine: "azure" },
  { name: "fatima", language: "ar-AE", engine: "azure" },
  { name: "hamdan", language: "ar-AE", engine: "azure" },
  { name: "hala", language: "ar-AE", engine: "neural" },
  { name: "rana", language: "ar-IQ", engine: "azure" },
  { name: "bassel", language: "ar-IQ", engine: "azure" },
  { name: "bashkar", language: "bn-IN", engine: "azure" },
  { name: "tanishaa", language: "bn-IN", engine: "azure" },
  { name: "kalina", language: "bg-BG", engine: "azure" },
  { name: "borislav", language: "bg-BG", engine: "azure" },
  { name: "joana", language: "ca-ES", engine: "azure" },
  { name: "enric", language: "ca-ES", engine: "azure" },
  { name: "xiaoxiao", language: "zh-CN", engine: "azure" },
  { name: "yunfeng", language: "zh-CN", engine: "azure" },
  { name: "xiaomeng", language: "zh-CN", engine: "azure" },
  { name: "yunjian", language: "zh-CN", engine: "azure" },
  { name: "xiaoyan", language: "zh-CN", engine: "azure" },
  { name: "yunze", language: "zh-CN", engine: "azure" },
  { name: "zhiyu", language: "cmn-CN", engine: "neural" },
  { name: "hiumaan", language: "zh-HK", engine: "azure" },
  { name: "wanlung", language: "zh-HK", engine: "azure" },
  { name: "hiujin", language: "yue-CN", engine: "neural" },
  { name: "hsiaochen", language: "zh-TW", engine: "azure" },
  { name: "hsiaoyu", language: "zh-TW", engine: "azure" },
  { name: "yunjhe", language: "zh-TW", engine: "azure" },
  { name: "srecko", language: "hr-HR", engine: "azure" },
  { name: "gabrijela", language: "hr-HR", engine: "azure" },
  { name: "antonin", language: "cs-CZ", engine: "azure" },
  { name: "vlasta", language: "cs-CZ", engine: "azure" },
  { name: "christel", language: "da-DK", engine: "azure" },
  { name: "jeppe", language: "da-DK", engine: "azure" },
  { name: "colette", language: "nl-NL", engine: "azure" },
  { name: "maarten", language: "nl-NL", engine: "azure" },
  { name: "laura", language: "nl-NL", engine: "neural" },
  { name: "ruben", language: "nl-NL", engine: "standard" },
  { name: "dena", language: "nl-BE", engine: "azure" },
  { name: "arnaud", language: "nl-BE", engine: "azure" },
  { name: "anu", language: "et-EE", engine: "azure" },
  { name: "kert", language: "et-EE", engine: "azure" },
  { name: "blessica", language: "fil-PH", engine: "azure" },
  { name: "angelo", language: "fil-PH", engine: "azure" },
  { name: "harri", language: "fi-FI", engine: "azure" },
  { name: "selma", language: "fi-FI", engine: "azure" },
  { name: "denise", language: "fr-FR", engine: "azure" },
  { name: "henri", language: "fr-FR", engine: "azure" },
  { name: "celeste", language: "fr-FR", engine: "azure" },
  { name: "claude", language: "fr-FR", engine: "azure" },
  { name: "sylvie", language: "fr-CA", engine: "azure" },
  { name: "jean", language: "fr-CA", engine: "azure" },
  { name: "charline", language: "fr-BE", engine: "azure" },
  { name: "gerard", language: "fr-BE", engine: "azure" },
  { name: "ariane", language: "fr-CH", engine: "azure" },
  { name: "fabrice", language: "fr-CH", engine: "azure" },
  { name: "katja", language: "de-DE", engine: "azure" },
  { name: "christoph", language: "de-DE", engine: "azure" },
  { name: "louisa", language: "de-DE", engine: "azure" },
  { name: "conrad", language: "de-DE", engine: "azure" },
  { name: "vicki", language: "de-DE", engine: "neural" },
  { name: "daniel", language: "de-DE", engine: "neural" },
  { name: "giorgi", language: "ka-GE", engine: "azure" },
  { name: "eka", language: "ka-GE", engine: "azure" },
  { name: "athina", language: "el-GR", engine: "azure" },
  { name: "nestoras", language: "el-GR", engine: "azure" },
  { name: "avri", language: "he-IL", engine: "azure" },
  { name: "hila", language: "he-IL", engine: "azure" },
  { name: "madhur", language: "hi-IN", engine: "azure" },
  { name: "swara", language: "hi-IN", engine: "azure" },
  { name: "noemi", language: "hu-HU", engine: "azure" },
  { name: "tamas", language: "hu-HU", engine: "azure" },
  { name: "gudrun", language: "is-IS", engine: "azure" },
  { name: "gunnar", language: "is-IS", engine: "azure" },
  { name: "gadis", language: "id-ID", engine: "azure" },
  { name: "ardi", language: "id-ID", engine: "azure" },
  { name: "irma", language: "it-IT", engine: "azure" },
  { name: "benigno", language: "it-IT", engine: "azure" },
  { name: "elsa", language: "it-IT", engine: "azure" },
  { name: "gianni", language: "it-IT", engine: "azure" },
  { name: "palmira", language: "it-IT", engine: "azure" },
  { name: "diego", language: "it-IT", engine: "azure" },
  { name: "imelda", language: "it-IT", engine: "azure" },
  { name: "cataldo", language: "it-IT", engine: "azure" },
  { name: "bianca", language: "it-IT", engine: "neural" },
  { name: "adriano", language: "it-IT", engine: "neural" },
  { name: "mayu", language: "ja-JP", engine: "azure" },
  { name: "naoki", language: "ja-JP", engine: "azure" },
  { name: "nanami", language: "ja-JP", engine: "azure" },
  { name: "daichi", language: "ja-JP", engine: "azure" },
  { name: "shiori", language: "ja-JP", engine: "azure" },
  { name: "keita", language: "ja-JP", engine: "azure" },
  { name: "daulet", language: "kk-KZ", engine: "azure" },
  { name: "aigul", language: "kk-KZ", engine: "azure" },
  { name: "sunhi", language: "ko-KR", engine: "azure" },
  { name: "injoon", language: "ko-KR", engine: "azure" },
  { name: "jimin", language: "ko-KR", engine: "azure" },
  { name: "bongjin", language: "ko-KR", engine: "azure" },
  { name: "seoyeon", language: "ko-KR", engine: "neural" },
  { name: "ona", language: "lt-LT", engine: "azure" },
  { name: "leonas", language: "lt-LT", engine: "azure" },
  { name: "everita", language: "lv-LV", engine: "azure" },
  { name: "nils", language: "lv-LV", engine: "azure" },
  { name: "osman", language: "ms-MY", engine: "azure" },
  { name: "yasmin", language: "ms-MY", engine: "azure" },
  { name: "sagar", language: "ne-NP", engine: "azure" },
  { name: "hemkala", language: "ne-NP", engine: "azure" },
  { name: "iselin", language: "nb-NO", engine: "azure" },
  { name: "finn", language: "nb-NO", engine: "azure" },
  { name: "pernille", language: "nb-NO", engine: "azure" },
  { name: "farid", language: "fa-IR", engine: "azure" },
  { name: "dilara", language: "fa-IR", engine: "azure" },
  { name: "agnieszka", language: "pl-PL", engine: "azure" },
  { name: "marek", language: "pl-PL", engine: "azure" },
  { name: "zofia", language: "pl-PL", engine: "azure" },
  { name: "brenda", language: "pt-BR", engine: "azure" },
  { name: "donato", language: "pt-BR", engine: "azure" },
  { name: "yara", language: "pt-BR", engine: "azure" },
  { name: "fabio", language: "pt-BR", engine: "azure" },
  { name: "leila", language: "pt-BR", engine: "azure" },
  { name: "julio", language: "pt-BR", engine: "azure" },
  { name: "camila", language: "pt-BR", engine: "neural" },
  { name: "thiago", language: "pt-BR", engine: "neural" },
  { name: "fernanda", language: "pt-PT", engine: "azure" },
  { name: "duarte", language: "pt-PT", engine: "azure" },
  { name: "ines", language: "pt-PT", engine: "neural" },
  { name: "cristiano", language: "pt-PT", engine: "standard" },
  { name: "alina", language: "ro-RO", engine: "azure" },
  { name: "emil", language: "ro-RO", engine: "azure" },
  { name: "dariya", language: "ru-RU", engine: "azure" },
  { name: "dmitry", language: "ru-RU", engine: "azure" },
  { name: "tatyana", language: "ru-RU", engine: "standard" },
  { name: "maxim", language: "ru-RU", engine: "standard" },
  { name: "viktoria", language: "sk-SK", engine: "azure" },
  { name: "lukas", language: "sk-SK", engine: "azure" },
  { name: "petra", language: "sl-SI", engine: "azure" },
  { name: "rok", language: "sl-SI", engine: "azure" },
  { name: "sameera", language: "si-LK", engine: "azure" },
  { name: "thilini", language: "si-LK", engine: "azure" },
  { name: "saul", language: "es-ES", engine: "azure" },
  { name: "vera", language: "es-ES", engine: "azure" },
  { name: "arnau", language: "es-ES", engine: "azure" },
  { name: "triana", language: "es-ES", engine: "azure" },
  { name: "gerardo", language: "es-MX", engine: "azure" },
  { name: "carlota", language: "es-MX", engine: "azure" },
  { name: "luciano", language: "es-MX", engine: "azure" },
  { name: "larissa", language: "es-MX", engine: "azure" },
  { name: "lupe", language: "es-US", engine: "neural" },
  { name: "hillevi", language: "sv-SE", engine: "azure" },
  { name: "mattias", language: "sv-SE", engine: "azure" },
  { name: "sofie", language: "sv-SE", engine: "azure" },
  { name: "rehema", language: "sw-TZ", engine: "azure" },
  { name: "daudi", language: "sw-TZ", engine: "azure" },
  { name: "pallavi", language: "ta-IN", engine: "azure" },
  { name: "valluvar", language: "ta-IN", engine: "azure" },
  { name: "saranya", language: "ta-LK", engine: "azure" },
  { name: "kumar", language: "ta-LK", engine: "azure" },
  { name: "kani", language: "ta-MY", engine: "azure" },
  { name: "surya", language: "ta-MY", engine: "azure" },
  { name: "venba", language: "ta-SG", engine: "azure" },
  { name: "anbu", language: "ta-SG", engine: "azure" },
  { name: "mohan", language: "te-IN", engine: "azure" },
  { name: "shruti", language: "te-IN", engine: "azure" },
  { name: "premwadee", language: "th-TH", engine: "azure" },
  { name: "niwat", language: "th-TH", engine: "azure" },
  { name: "emel", language: "tr-TR", engine: "azure" },
  { name: "ahmet", language: "tr-TR", engine: "azure" },
  { name: "gul", language: "ur-IN", engine: "azure" },
  { name: "salman", language: "ur-IN", engine: "azure" },
  { name: "uzma", language: "ur-PK", engine: "azure" },
  { name: "asad", language: "ur-PK", engine: "azure" },
  { name: "polina", language: "uk-UA", engine: "azure" },
  { name: "ostap", language: "uk-UA", engine: "azure" },
  { name: "hoaimy", language: "vi-VN", engine: "azure" },
  { name: "namminh", language: "vi-VN", engine: "azure" },
  { name: "orla", language: "ga-IE", engine: "azure" },
  { name: "colm", language: "ga-IE", engine: "azure" }
].map(v => ({
  ...v,
  label: `${v.name.charAt(0).toUpperCase() + v.name.slice(1)} - ${langMap[v.language] || v.language} (${v.engine.toUpperCase()})`
}));

const TextToSpeech: React.FC = () => {
  const { setCurrentTrack, setIsPlaying, user, setShowUpgradeModal } = useAppStore();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return toast.error("Silakan masukkan teks terlebih dahulu.");
    setIsGenerating(true);
    setResultUrl(null);
    const toastId = toast.loading("Sedang memproses suara...");

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await axios.get('/api/tts', {
        params: {
          text: text.trim(),
          voice: (selectedVoice as any).name_original || selectedVoice.name,
          language: selectedVoice.language,
          engine: selectedVoice.engine
        },
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.ok) {
        let url = response.data.url;

        // Note: Saving to library is now handled server-side by /api/tts

        setResultUrl(url);
        toast.success("Suara berhasil dibuat!", { id: toastId });
      } else {
        throw response.data;
      }
    } catch (error: any) {
      if (error.response?.data?.limit_reached || error.response?.status === 429) {
        setShowUpgradeModal(true);
      } else {
        toast.error(error.message || "Gagal membuat suara.", { id: toastId });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    setIsDownloading(true);
    const toastId = toast.loading("Menyiapkan audio...");
    try {
      const url = `/api/proxy?url=${encodeURIComponent(resultUrl)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Viintools_TTS_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Download dimulai!", { id: toastId });
    } catch (error) {
      console.error("Download Error:", error);
      toast.error("Gagal mendownload audio.", { id: toastId });
    } finally { setIsDownloading(false); }
  };

  const handlePlayPreview = () => {
    if (!resultUrl) return;
    const previewTrack: Track = {
      id: `tts_${Date.now()}`,
      title: "Suara AI Pro",
      style: `TTS • ${selectedVoice.name}`,
      prompt: text.substring(0, 100),
      audioUrl: resultUrl,
      imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=tts-preview',
      duration: 0,
      createdAt: new Date().toISOString(),
      model: 'TTS_V2'
    };
    setCurrentTrack(previewTrack);
    setIsPlaying(true);
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm("Hapus item riwayat ini?")) return;
    try {
      await deleteTrackFromFirestore((user as any)?.uid!, trackId);
      toast.success("Item dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus.");
      console.error(e);
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '-';
    // Handle Firestore Timestamp (seconds)
    if (dateInput.seconds) {
      return new Date(dateInput.seconds * 1000).toLocaleDateString();
    }
    // Handle standard Date string or object
    return new Date(dateInput).toLocaleDateString();
  };

  return (
    <div className="max-w-[700px] mx-auto pb-20 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black font-heading italic uppercase text-white leading-none">
          SUARA <span className="text-[#3BF48F]">AI</span>
        </h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Konversi Teks ke Suara Profesional</p>
      </div>

      <div className="glass p-10 rounded-[3rem] border-white/20 shadow-2xl space-y-8 relative overflow-hidden">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Teks Input ({text.length}/2000)</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3BF48F] animate-pulse" />
          </div>
          <textarea
            rows={6}
            className="w-full bg-[#090B14] border border-white/20 rounded-2xl px-6 py-6 text-sm text-white focus:border-[#3BF48F]/50 outline-none resize-none transition-all placeholder:text-slate-700"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tuliskan teks untuk disuarakan..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Pilih Suara</span>
            <div className="relative group">
              <select
                className="w-full bg-[#090B14] border border-white/20 rounded-2xl px-6 py-4 text-xs text-white focus:border-[#3BF48F]/50 outline-none appearance-none cursor-pointer font-bold h-14"
                value={AVAILABLE_VOICES.findIndex(v => v.name === selectedVoice.name && v.language === selectedVoice.language && v.engine === selectedVoice.engine)}
                onChange={e => setSelectedVoice(AVAILABLE_VOICES[parseInt(e.target.value)])}
              >
                {AVAILABLE_VOICES.map((v, i) => (
                  <option key={i} value={i} className="bg-[#151926]">{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 bg-[#3BF48F] hover:bg-[#2ED079] text-[#090B14] shadow-lg shadow-[#3BF48F]/10 transition-all disabled:opacity-50 uppercase italic tracking-tighter"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Buat Suara</>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={handlePlayPreview}
                className="w-full flex-1 py-4 bg-white text-[#090B14] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all"
              >
                <Play size={18} fill="currentColor" /> Putar Suara
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full sm:w-16 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white pl-4 border-l-4 border-[#3BF48F]">Riwayat Generasi</h2>
        <div className="grid gap-4">
          {useAppStore.getState().library
            .filter(track => (track.model === 'TTS' || track.model === 'TTS_V2' || track.style?.includes('TTS')))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((track) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#090B14] border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-[#3BF48F]/30 transition-all"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-[#151926] flex items-center justify-center shrink-0 text-[#3BF48F]">
                    <Volume2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate pr-4">{track.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
                      <span>{new Date(track.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{track.style?.replace('TTS • ', '') || 'AI Voice'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentTrack(track);
                      setIsPlaying(true);
                    }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-[#3BF48F] hover:text-black text-white transition-all"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                  <a
                    href={`/api/proxy?url=${encodeURIComponent(track.audioUrl)}`}
                    download={`${track.title}.mp3`}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/20 text-slate-400 hover:text-white transition-all"
                  >
                    <Download size={18} />
                  </a>
                </div>
              </motion.div>
            ))}
          {useAppStore.getState().library.filter(track => (track.model === 'TTS' || track.model === 'TTS_V2' || track.style?.includes('TTS'))).length === 0 && (
            <div className="text-center py-10 text-slate-600 text-sm italic">
              Belum ada riwayat suara.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
