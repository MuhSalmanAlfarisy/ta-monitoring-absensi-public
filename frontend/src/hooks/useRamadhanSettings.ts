import { useCallback, useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { api } from '../lib/axios';
import { RamadhanSettingsResponse } from '../lib/types';

interface RamadhanSettingsPayload {
  ramadhan_mode: boolean;
  ramadhan_start_date: string | null;
  ramadhan_end_date: string | null;
}

export function useRamadhanSettings() {
  const [data, setData] = useState<RamadhanSettingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<RamadhanSettingsResponse>('/api/profile/ramadhan-settings');
      setData(response.data);
      return response.data;
    } catch (err) {
      const message = err instanceof AxiosError
        ? err.response?.data?.detail || 'Gagal memuat pengaturan Ramadhan'
        : 'Terjadi kesalahan sistem';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (payload: RamadhanSettingsPayload) => {
    setSaving(true);
    setError(null);
    try {
      const response = await api.put<RamadhanSettingsResponse>('/api/profile/ramadhan-settings', payload);
      setData((prev) => ({
        ...prev,
        ...response.data,
      } as RamadhanSettingsResponse));
      return response.data;
    } catch (err) {
      const message = err instanceof AxiosError
        ? err.response?.data?.detail || 'Gagal menyimpan pengaturan Ramadhan'
        : 'Terjadi kesalahan sistem';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return {
    data,
    loading,
    saving,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
