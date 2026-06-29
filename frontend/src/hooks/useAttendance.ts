import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import { ATTENDANCE_DATA_CHANGED_EVENT } from '../lib/attendanceEvents';
import { AttendanceListResponse } from '../lib/types';

interface UseAttendanceParams {
    initialPage?: number;
    initialLimit?: number;
    initialSearch?: string;
    initialStartDate?: string;
    initialEndDate?: string;
    initialWaktuSholat?: string[];
    initialStatus?: 'tepat-waktu' | 'terlambat' | 'semua' | string;
    initialTab?: 'sholat' | 'diluar' | 'event';
}

export const useAttendance = ({
    initialPage = 1,
    initialLimit = 20,
    initialSearch = '',
    initialStartDate = '',
    initialEndDate = '',
    initialWaktuSholat = [],
    initialStatus = 'semua',
    initialTab = 'sholat',
}: UseAttendanceParams = {}) => {
    const [data, setData] = useState<AttendanceListResponse['data']>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        has_more: false,
        page: initialPage,
        limit: initialLimit,
    });

    // Filter states
    const [search, setSearch] = useState(initialSearch);
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [waktuSholat, setWaktuSholat] = useState(initialWaktuSholat);
    const [status, setStatus] = useState(initialStatus);
    const [tab, setTab] = useState<'sholat' | 'diluar' | 'event'>(initialTab);

    const fetchAttendance = useCallback(async (
        page = pagination.page,
        limit = pagination.limit,
        searchTerm = search,
        start = startDate,
        end = endDate,
        waktu = waktuSholat,
        stat = status,
        currentTab = tab
    ) => {
        setLoading(true);
        setError(null);

        try {
            const skip = (page - 1) * limit;

            const payload: any = {
                skip,
                limit,
                sort_by: 'scan_time',
                sort_order: 'desc'
            };

            payload.tab = currentTab;
            if (searchTerm) payload.search = searchTerm;
            if (start) payload.start_date = start;
            if (end) payload.end_date = end;
            if (waktu && waktu.length > 0) payload.waktu_sholat = waktu;

            // Map frontend status to backend enum if needed
            if (stat && stat !== 'semua') {
                payload.status_kehadiran = stat === 'tepat-waktu' ? 'TEPAT_WAKTU' : 'TERLAMBAT';
            }

            const response = await api.get<AttendanceListResponse>('/api/attendance/', {
                params: payload
            });

            setData(response.data.data);
            setPagination({
                total: response.data.pagination.total,
                has_more: response.data.pagination.has_more,
                page,
                limit
            });
        } catch (err: any) {
            console.error('Error fetching attendance:', err);
            setError(err.response?.data?.detail || 'Gagal memuat data absensi');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, startDate, endDate, waktuSholat, status, tab]);

    // Initial fetch and on filter change
    // Note: We normally don't put fetchAttendance in useEffect if we want manual control, 
    // but for a page that loads data on mount/change, this is fine.
    // To avoid infinite loops, we need to be careful with dependencies.

    // Here we expose a refetch function and let the component decide when to call it
    // or use a separate effect for filter changes if desired.

    const exportData = useCallback(async () => {
        try {
            const payload: any = {};
            if (search) payload.search = search;
            if (startDate) payload.start_date = startDate;
            if (endDate) payload.end_date = endDate;
            if (waktuSholat && waktuSholat.length > 0) payload.waktu_sholat = waktuSholat;
            if (status && status !== 'semua') {
                payload.status_kehadiran = status === 'tepat-waktu' ? 'TEPAT_WAKTU' : 'TERLAMBAT';
            }

            const response = await api.get('/api/attendance/export', {
                params: payload,
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `absensi_export_${dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (err) {
            console.error('Export failed:', err);
            return false;
        }
    }, [search, startDate, endDate, waktuSholat, status]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchAttendance();
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchAttendance]);

    return {
        data,
        loading,
        error,
        pagination,
        filters: {
            search,
            setSearch,
            startDate,
            setStartDate,
            endDate,
            setEndDate,
            waktuSholat,
            setWaktuSholat,
            status,
            setStatus,
            tab,
            setTab,
        },
        setPage: (page: number) => setPagination(prev => ({ ...prev, page })),
        setLimit: (limit: number) => setPagination(prev => ({ ...prev, limit })),
        refetch: fetchAttendance,
        exportData
    };
};
