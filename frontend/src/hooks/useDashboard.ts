import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/axios';
import { ATTENDANCE_DATA_CHANGED_EVENT } from '../lib/attendanceEvents';
import {
    QuickStatsResponse,
    DailyStatsResponse,
    SholatStatsResponse,
    AttendanceLogResponse
} from '../lib/types';
import { AxiosError } from 'axios';

export function useDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [quickStats, setQuickStats] = useState<QuickStatsResponse | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStatsResponse | null>(null);
    const [sholatStats, setSholatStats] = useState<SholatStatsResponse | null>(null);
    const [recentLogs, setRecentLogs] = useState<AttendanceLogResponse[]>([]);

    const [quickStatsError, setQuickStatsError] = useState<boolean>(false);
    const [dailyStatsError, setDailyStatsError] = useState<boolean>(false);
    const [sholatStatsError, setSholatStatsError] = useState<boolean>(false);
    const [recentLogsError, setRecentLogsError] = useState<boolean>(false);

    const getWIBDateString = () =>
        new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(new Date());

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setQuickStatsError(false);
        setDailyStatsError(false);
        setSholatStatsError(false);
        setRecentLogsError(false);

        try {
            const todayWIB = getWIBDateString();
            // Parallel requests using allSettled to prevent cascade failure
            const results = await Promise.allSettled([
                api.get<QuickStatsResponse>('/api/statistics/quick-stats'),
                api.get<DailyStatsResponse>('/api/attendance/stats/daily?days=7'),
                api.get<SholatStatsResponse>(`/api/attendance/stats/sholat?start_date=${todayWIB}&end_date=${todayWIB}`),
                api.get<{ recent_attendance: AttendanceLogResponse[] }>('/api/attendance/recent?limit=5')
            ]);

            // Handle Quick Stats
            if (results[0].status === 'fulfilled') {
                setQuickStats(results[0].value.data);
            } else {
                console.error('Quick stats failed:', results[0].reason);
                setQuickStatsError(true);
            }

            // Handle Daily Stats
            if (results[1].status === 'fulfilled') {
                setDailyStats(results[1].value.data);
            } else {
                console.error('Daily stats failed:', results[1].reason);
                setDailyStatsError(true);
            }

            // Handle Sholat Stats
            if (results[2].status === 'fulfilled') {
                setSholatStats(results[2].value.data);
            } else {
                console.error('Sholat stats failed:', results[2].reason);
                setSholatStatsError(true);
            }

            // Handle Recent Logs
            if (results[3].status === 'fulfilled') {
                setRecentLogs(results[3].value.data.recent_attendance);
            } else {
                console.error('Recent logs failed:', results[3].reason);
                setRecentLogsError(true);
            }

        } catch (err) {
            console.error('Unexpected error fetching dashboard data:', err);
            // Don't block the whole UI if just one thing failed, 
            // the individual error handling above covers it.
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 60 seconds for dashboard
        const interval = setInterval(fetchDashboardData, 60000);
        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchDashboardData();
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchDashboardData]);

    return {
        loading,
        error,
        quickStats,
        dailyStats,
        sholatStats,
        recentLogs,
        quickStatsError,
        dailyStatsError,
        sholatStatsError,
        recentLogsError,
        refetch: fetchDashboardData
    };
}
