import { api } from '../lib/axios';

export interface EventParticipantResponse {
    id: number;
    event_id: number;
    jamaah_id: string;
    added_at: string;
    nama_jamaah?: string;
    foto_profil_url?: string;
}

export interface EventHistoryRecord {
    id: string;
    name: string;
    status: 'hadir' | 'telat' | 'tidak hadir';
    timestamp?: string;
}

export interface EventHistory {
    date: string;
    records: EventHistoryRecord[];
}

export interface EventResponse {
    id: number;
    title: string;
    description?: string;
    event_type: 'one-time' | 'recurring' | 'rentang';
    start_time: string;
    end_time: string;
    date?: string;
    days?: string;
    start_date?: string;
    end_date?: string;
    late_threshold: number;
    status: 'active' | 'inactive' | 'completed';
    created_by?: string;
    created_at: string;
    updated_at?: string;
    participants_count: number;
    participants?: EventParticipantResponse[];
    history?: EventHistory[];
}

export interface EventListResponse {
    data: EventResponse[];
    total: number;
    skip: number;
    limit: number;
}

export interface EventCreateData {
    title: string;
    description?: string;
    event_type: 'one-time' | 'recurring' | 'rentang';
    start_time: string;
    end_time: string;
    date?: string;
    days?: string;
    start_date?: string;
    end_date?: string;
    late_threshold?: number;
    status?: string;
    created_by?: string;
    participants?: string[];
}

export const eventsService = {
    getEvents: async (status?: string, skip = 0, limit = 100): Promise<EventListResponse> => {
        const params = new URLSearchParams();
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());
        if (status && status !== 'all') {
            params.append('status', status);
        }
        const response = await api.get(`/events/?${params.toString()}`);
        return response.data;
    },

    getEventDetails: async (eventId: number): Promise<EventResponse> => {
        const response = await api.get(`/events/${eventId}`);
        return response.data;
    },

    createEvent: async (data: EventCreateData): Promise<EventResponse> => {
        // Strip empty strings and undefined values so Pydantic receives None instead of ""
        const cleanData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null && value !== '') {
                cleanData[key] = value;
            }
        }
        const response = await api.post('/events/', cleanData);
        return response.data;
    },

    updateEvent: async (eventId: number, data: Partial<EventCreateData>): Promise<EventResponse> => {
        const response = await api.put(`/events/${eventId}`, data);
        return response.data;
    },

    updateEventStatus: async (eventId: number, status: string): Promise<EventResponse> => {
        const response = await api.put(`/events/${eventId}`, { status });
        return response.data;
    },

    deleteEvent: async (eventId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/events/${eventId}`);
        return response.data;
    },

    addParticipants: async (eventId: number, jamaahIds: string[]): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/events/${eventId}/participants`, jamaahIds);
        return response.data;
    },

    removeParticipant: async (eventId: number, jamaahId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/events/${eventId}/participants/${jamaahId}`);
        return response.data;
    }
};
