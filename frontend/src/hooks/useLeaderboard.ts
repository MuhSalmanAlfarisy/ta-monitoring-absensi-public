import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import { ATTENDANCE_DATA_CHANGED_EVENT } from '../lib/attendanceEvents';
import { LeaderboardListResponse } from '../lib/types';
import { AxiosError } from 'axios';

export type LeaderboardPeriod = 'hari-ini' | 'pekan-ini' | 'bulan-ini' | 'tahun-ini' | 'all-time' | 'custom';

interface UseLeaderboardParams {
    initialPeriod?: LeaderboardPeriod;
    initialLimit?: number;
}

export function useLeaderboard({ initialPeriod = 'bulan-ini', initialLimit = 50 }: UseLeaderboardParams = {}) {
    const [data, setData] = useState<LeaderboardListResponse>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
    const [waktuSholat, setWaktuSholat] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: any = {
                period,
                limit: initialLimit
            };

            if (waktuSholat && waktuSholat.length > 0) {
                params.waktu_sholat = waktuSholat;
            }

            if (period === 'custom' && startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            }

            const response = await api.get<LeaderboardListResponse>('/api/statistics/leaderboard', {
                params
            });
            setData(response.data);
        } catch (err) {
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal memuat data leaderboard'
                : 'Terjadi kesalahan sistem';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [period, waktuSholat, initialLimit, startDate, endDate]);

    // Auto fetch when period or waktuSholat changes
    useEffect(() => {
        if (period === 'custom' && (!startDate || !endDate)) {
            return; // Don't fetch if custom range is incomplete
        }
        fetchLeaderboard();
    }, [fetchLeaderboard, period, startDate, endDate]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchLeaderboard();
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchLeaderboard]);

    return {
        data,
        loading,
        error,
        period,
        setPeriod,
        waktuSholat,
        setWaktuSholat,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        refetch: fetchLeaderboard
    };
}
