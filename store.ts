
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { View, User, ImageJob, VideoJob, TempMailState, MailMessage, Job, Track } from './types';

interface AppState {
  view: View;
  viewLabel: string;
  user: User | null;
  authLoading: boolean;
  // Fix: Added missing state used in components
  jobs: Job[];
  imageJobs: ImageJob[];
  videoJobs: VideoJob[];
  library: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  isPublicPlayback: boolean;
  tempMail: TempMailState;
  isDark: boolean;
  isSidebarOpen: boolean;
  showUpgradeModal: boolean;

  setView: (view: View, label?: string) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setTheme: (isDark: boolean) => void;
  setSidebarOpen: (isSidebarOpen: boolean) => void;
  setShowUpgradeModal: (show: boolean) => void;

  // Fix: Added missing actions for general jobs
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;

  // Image Generation Actions
  addImageJob: (job: ImageJob) => void;
  updateImageJob: (id: string, updates: Partial<ImageJob>) => void;
  removeImageJob: (id: string) => void;

  // Video Generation Actions
  addVideoJob: (job: VideoJob) => void;
  updateVideoJob: (id: string, updates: Partial<VideoJob>) => void;
  removeVideoJob: (id: string) => void;

  // Fix: Added missing actions for player and library
  setLibrary: (tracks: Track[]) => void;
  setCurrentTrack: (track: Track | null, isPlaying?: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsPublicPlayback: (isPublic: boolean) => void;

  // Temp Mail Actions
  setTempMail: (email: string | null, expiresAt: number | null) => void;
  setMailMessages: (messages: MailMessage[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: View.LANDING,
      viewLabel: '',
      user: null,
      authLoading: true,
      // Fix: Initializing missing state
      jobs: [],
      imageJobs: [],
      videoJobs: [],
      library: [],
      currentTrack: null,
      isPlaying: false,
      isPublicPlayback: false,
      tempMail: { email: null, expiresAt: null, messages: [] },
      isDark: true,
      isSidebarOpen: false,
      showUpgradeModal: false,

      setView: (view, label = '') => set({ view, viewLabel: label, isSidebarOpen: false }),
      setUser: (user) => set((state) => ({
        user,
        authLoading: false,
        // Reset state jika user logout (null)
        jobs: user ? state.jobs : [],
        imageJobs: user ? state.imageJobs : [],
        videoJobs: user ? state.videoJobs : [],
        library: user ? state.library : [],
        currentTrack: user ? state.currentTrack : null,
        isPlaying: user ? state.isPlaying : false,
        tempMail: user ? state.tempMail : { email: null, expiresAt: null, messages: [] }
      })),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setTheme: (isDark) => set({ isDark }),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      setShowUpgradeModal: (showUpgradeModal) => set({ showUpgradeModal }),

      // Fix: Implementing new actions for general jobs
      addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs].slice(0, 10) })),
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map((job) => job.id === id ? { ...job, ...updates } : job)
      })),
      removeJob: (id) => set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id)
      })),

      addImageJob: (job) => set((state) => ({ imageJobs: [job, ...state.imageJobs].slice(0, 10) })),
      updateImageJob: (id, updates) => set((state) => ({
        imageJobs: state.imageJobs.map((job) => job.id === id ? { ...job, ...updates } : job)
      })),
      removeImageJob: (id) => set((state) => ({
        imageJobs: state.imageJobs.filter((job) => job.id !== id)
      })),

      addVideoJob: (job) => set((state) => ({ videoJobs: [job, ...state.videoJobs].slice(0, 10) })),
      updateVideoJob: (id, updates) => set((state) => ({
        videoJobs: state.videoJobs.map((job) => job.id === id ? { ...job, ...updates } : job)
      })),
      removeVideoJob: (id) => set((state) => ({
        videoJobs: state.videoJobs.filter((job) => job.id !== id)
      })),

      // Fix: Implementing library and player actions
      setLibrary: (library) => set({ library }),
      setCurrentTrack: (track, isPlaying = true) => set({
        currentTrack: track,
        isPlaying: track ? isPlaying : false
      }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setIsPublicPlayback: (isPublicPlayback) => set({ isPublicPlayback }),

      setTempMail: (email, expiresAt) => set((state) => ({
        tempMail: { ...state.tempMail, email, expiresAt, messages: [] }
      })),
      setMailMessages: (messages) => set((state) => ({
        tempMail: { ...state.tempMail, messages }
      })),
    }),
    {
      name: 'sunoxgen-v1-storage',
      partialize: (state) => ({
        isDark: state.isDark,
        user: state.user,
        jobs: state.jobs,
        imageJobs: state.imageJobs,
        videoJobs: state.videoJobs,
        library: state.library,
        tempMail: state.tempMail
      }),
    }
  ));

export const checkFreeLimit = (user: User | null) => {
  if (!user) return true; // Not logged in = Limited
  if (user.plan !== 'FREE') return false; // PRO = Not Limited
  return (user.freeUsageCount || 0) >= 1; // FREE Limit: Used >= 1 time
};
