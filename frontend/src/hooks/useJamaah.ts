import { useState, useCallback, useEffect } from 'react';
import { api } from '../lib/axios';
import { ATTENDANCE_DATA_CHANGED_EVENT } from '../lib/attendanceEvents';
import {
    JamaahDetailResponse,
    AttendanceListResponse,
    PaginationMeta,
    JamaahListResponse,
    JamaahDeleteResponse
} from '../lib/types';
import { AxiosError } from 'axios';

interface UseJamaahHistoryParams {
    initialLimit?: number;
}

interface HistoryFilters {
    startDate: string;
    endDate: string;
    waktuSholat: string[];
    status: 'semua' | 'tepat-waktu' | 'terlambat';
}

const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
    startDate: '',
    endDate: '',
    waktuSholat: [],
    status: 'semua'
};

interface UseJamaahListParams {
    initialLimit?: number;
}

export function useJamaahList({ initialLimit = 50 }: UseJamaahListParams = {}) {
    const [data, setData] = useState<JamaahListResponse['data']>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        skip: 0,
        limit: initialLimit,
        has_more: false
    });
    const [search, setSearch] = useState('');

    const fetchJamaah = useCallback(async (page = 1, searchQuery = search) => {
        setLoading(true);
        setError(null);
        try {
            const skip = (page - 1) * pagination.limit;
            const response = await api.get<JamaahListResponse>('/api/jamaah/', {
                params: {
                    skip,
                    limit: pagination.limit,
                    search: searchQuery,
                    sort_by: 'last_seen',
                    sort_order: 'desc'
                }
            });
            setData(response.data.data);
            setPagination(prev => ({
                ...prev,
                total: response.data.total,
                has_more: response.data.has_more,
                skip: response.data.skip
            }));
        } catch (err) {
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal memuat data jamaah'
                : 'Terjadi kesalahan sistem';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, search]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchJamaah(1, search);
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchJamaah, search]);

    return {
        data,
        loading,
        error,
        pagination,
        search,
        setSearch,
        refetch: fetchJamaah
    };
}

export function useJamaah() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getJamaahDetail = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<JamaahDetailResponse>(`/api/jamaah/${id}`);
            return response.data;
        } catch (err) {
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal mengambil detail jamaah'
                : 'Terjadi kesalahan saat memuat data';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteJamaah = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.delete<JamaahDeleteResponse>(`/api/jamaah/${id}`);
            return response.data;
        } catch (err) {
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal menghapus jamaah'
                : 'Terjadi kesalahan sistem';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    }, []);

    return { getJamaahDetail, deleteJamaah, loading, error };
}

export function useJamaahHistory(jamaahId: string, { initialLimit = 20 }: UseJamaahHistoryParams = {}) {
    const [data, setData] = useState<AttendanceListResponse['data']>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [pagination, setPagination] = useState<PaginationMeta>({
        total: 0,
        skip: 0,
        limit: initialLimit,
        has_more: false
    });

    const [filters, setFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);

    const [page, setPage] = useState(1);

    const fetchHistory = useCallback(async () => {
        if (!jamaahId) return;

        setLoading(true);
        setError(null);

        try {
            const skip = (page - 1) * pagination.limit;
            const limit = pagination.limit;

            const payload: any = {
                skip,
                limit,
            };

            if (filters.startDate) payload.start_date = filters.startDate;
            if (filters.endDate) payload.end_date = filters.endDate;
            if (filters.waktuSholat && filters.waktuSholat.length > 0) {
                payload.waktu_sholat = filters.waktuSholat;
            }

            if (filters.status && filters.status !== 'semua') {
                payload.status_kehadiran = filters.status === 'tepat-waktu' ? 'TEPAT_WAKTU' : 'TERLAMBAT';
            }

            const response = await api.get<AttendanceListResponse>(`/api/jamaah/${jamaahId}/logs`, {
                params: payload
            });

            setData(response.data.data);
            setPagination(prev => ({
                ...prev,
                ...response.data.pagination
            }));

        } catch (err) {
            const message = err instanceof AxiosError
                ? err.response?.data?.detail || 'Gagal memuat riwayat kehadiran'
                : 'Terjadi kesalahan sistem';
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [jamaahId, page, pagination.limit, filters]);

    const setFilter = (key: keyof HistoryFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page on filter change
    };

    const resetFilters = () => {
        setFilters(DEFAULT_HISTORY_FILTERS);
        setPage(1);
    };

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        const handleAttendanceDataChanged = () => {
            void fetchHistory();
        };

        window.addEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        return () => {
            window.removeEventListener(ATTENDANCE_DATA_CHANGED_EVENT, handleAttendanceDataChanged);
        };
    }, [fetchHistory]);

    return {
        data,
        loading,
        error,
        pagination,
        page,
        setPage,
        filters: {
            ...filters,
            setStartDate: (val: string) => setFilter('startDate', val),
            setEndDate: (val: string) => setFilter('endDate', val),
            setWaktuSholat: (val: string[]) => setFilter('waktuSholat', val),
            setStatus: (val: any) => setFilter('status', val),
            reset: resetFilters
        },
        refetch: fetchHistory
    };
}
