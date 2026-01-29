
import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import axios from 'axios';
import { toast } from 'sonner';

const JobMonitor: React.FC = () => {
  const { imageJobs, updateImageJob, videoJobs, updateVideoJob, jobs, updateJob, user } = useAppStore();
  const pollingJobs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Monitor Music Jobs (General Jobs)
    jobs.forEach(job => {
      const internalId = (job as any).internalTaskId;
      if (job.status === 'processing' && internalId && internalId !== job.id && !pollingJobs.current.has(job.id)) {
        startSecurePolling(job.id, internalId, 'music');
      }
    });

    // Monitor Video Jobs (VEO & GROK)
    videoJobs.forEach(job => {
      const internalId = job.internalTaskId;
      if (job.status === 'processing' && internalId && internalId !== job.id && !pollingJobs.current.has(job.id)) {
        startSecurePolling(job.id, internalId, 'video');
      }
    });

    // Monitor Image Jobs (NANO & IMAGEN)
    imageJobs.forEach(job => {
      const internalId = job.internalTaskId;
      if (job.status === 'processing' && internalId && internalId !== job.id && !pollingJobs.current.has(job.id)) {
        startSecurePolling(job.id, internalId, 'image');
      }
    });
  }, [imageJobs, videoJobs, jobs, user]);

  const startSecurePolling = async (jobStoreId: string, internalId: string, type: 'image' | 'video' | 'music') => {
    pollingJobs.current.add(jobStoreId);
    
    const interval = setInterval(async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await axios.get(`/api/v1/status/${internalId}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });

        const data = response.data;

        if (data.status === 'done') {
          clearInterval(interval);
          if (type === 'image') {
            const urls = Array.isArray(data.result) ? data.result : [data.result];
            updateImageJob(jobStoreId, { status: 'done', result: urls });
            toast.success("Gambar AI Berhasil!");
          } else if (type === 'video') {
            updateVideoJob(jobStoreId, { status: 'done', result: data.result });
            toast.success("Video AI Berhasil!");
          } else {
            // Music: Simpan hasil ke pustaka secara otomatis jika diperlukan
            updateJob(jobStoreId, { status: 'done', result: data.result });
            toast.success("Musik AI Berhasil!");
          }
          pollingJobs.current.delete(jobStoreId);
        } else if (data.status === 'error') {
          clearInterval(interval);
          if (type === 'image') updateImageJob(jobStoreId, { status: 'error' });
          else if (type === 'video') updateVideoJob(jobStoreId, { status: 'error' });
          else updateJob(jobStoreId, { status: 'error' });
          pollingJobs.current.delete(jobStoreId);
        }
      } catch (e: any) {
        if (e.response?.status === 404) {
          clearInterval(interval);
          pollingJobs.current.delete(jobStoreId);
        }
      }
    }, type === 'music' ? 8000 : 12000);
  };

  return null;
};

export default JobMonitor;
