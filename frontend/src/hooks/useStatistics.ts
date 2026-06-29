import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import { ATTENDANCE_DATA_CHANGED_EVENT } from '../lib/attendanceEvents';
import { StatisticsSummaryResponse } from '../lib/types';
import { AxiosError } from 'axios';

export type StatisticsPeriod = 'hari-ini' | 'pekan-ini' | 'bulan-ini' | 'tahun-ini' | 'all-time';

export function useStatistics(initialPeriod: StatisticsPeriod = 'bulan-ini') {
    const [data, setData] = useState<StatisticsSummaryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<StatisticsPeriod>(initialPeriod);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<StatisticsSummaryResponse>('/api/statistics/summary', {
                params: { period }
            });
            setData(response.data);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal memuat data statistik'
                : 'Terjadi kesalahan sistem';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchStatistics();
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchStatistics]);

    return {
        data,
        loading,
        error,
        period,
        setPeriod,
        refetch: fetchStatistics
    };
}
