import { useEffect, useState } from 'react';
import { api } from '../lib/axios';

export interface PrayerTimes {
  subuh: string;
  syuruq: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  lokasi: string;
  date: string;
}

export const usePrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get('/api/analytics/prayer-times');
      
      if (res.status !== 200) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      setPrayerTimes(res.data);
    } catch (err) {
      console.warn('Prayer times tidak tersedia:', err);
      setError('Gagal memuat jadwal sholat');
      setPrayerTimes(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayerTimes();
    
    // Auto-refresh setiap 30 menit
    const interval = setInterval(() => {
      fetchPrayerTimes();
    }, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    prayerTimes, 
    loading, 
    error,
    refetch: fetchPrayerTimes 
  };
};