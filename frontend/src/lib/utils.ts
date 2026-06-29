/**
 * UTILITY FUNCTIONS
 * Helper functions for display and formatting.
 * All attendance data comes from API backend; no mock or dummy data.
 */

import moment from 'moment-timezone';
import 'moment/locale/id';
import type { Event, WhitelistUser } from './types';

/**
 * Parse API date into a valid Date object.
 */
export const parseApiDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

/**
 * Format date for display (dd mmm yyyy, Asia/Jakarta).
 */
export const formatDate = (value?: string | null): string => {
  const date = parseApiDate(value);
  if (!date) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
};

/**
 * Format date + time for display (dd mmm yyyy HH:mm, Asia/Jakarta).
 */
export const formatDateTime = (value?: string | null): string => {
  const date = parseApiDate(value);
  if (!date) return '-';
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
};

/**
 * Normalize whitelist API payload to WhitelistUser[].
 */
export const mapWhitelistResponse = (items: any[]): WhitelistUser[] =>
  items.map((user) => ({
    id: user.uid || user.email,
    email: user.email,
    status: user.status,
    createdAt: user.created_at ?? null,
    activatedAt: user.activated_at ?? null,
    uid: user.uid ?? undefined,
  }));

/**
 * Normalize profile photo URL from API.
 */
export const getPhotoUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('/')) {
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  }
  return url;
};

/**
 * Format time for display
 */
export const formatTime = (timeStr: string): string => {
  return timeStr; // Already in HH:MM format
};

/**
 * Get relative time difference
 */
export const getRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari yang lalu`;
};

export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

const DAY_NAMES_BY_JS_DAY = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TIME_HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseIsoDate = (isoDate?: string) => {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  const dateObj = new Date(year, month - 1, day);
  if (Number.isNaN(dateObj.getTime())) return null;
  return { year, month, day };
};

const buildLocalDateTime = (isoDate?: string, timeValue?: string, fallbackTime = '00:00') => {
  const dateParts = parseIsoDate(isoDate);
  if (!dateParts) return null;
  const normalizedTime = isValidTimeValue(timeValue || '') ? (timeValue as string) : fallbackTime;
  const [hours, minutes] = normalizedTime.split(':').map(Number);
  return new Date(dateParts.year, dateParts.month - 1, dateParts.day, hours, minutes, 0, 0);
};

const toIsoDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isValidTimeValue = (value: string) => TIME_HHMM_PATTERN.test(value);

export const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};

export const getTodayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateWithDay = (isoDate?: string) => {
  if (!isoDate) return '-';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const dateObj = new Date(year, month - 1, day);
  if (Number.isNaN(dateObj.getTime())) return isoDate;
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatCreatedAt = (rawDateTime?: string) => {
  if (!rawDateTime) return '-';
  const m = moment.utc(rawDateTime).tz('Asia/Jakarta');
  if (!m.isValid()) {
    return rawDateTime;
  }

  m.locale('id');
  return `${m.format('dddd, DD MMMM YYYY')} pukul ${m.format('HH:mm')} WIB`;
};

export const getRecurringScheduleLabel = (days?: string[]) => {
  const selectedDays = new Set((days || []).map((day) => day.trim()).filter(Boolean));
  const orderedDays = DAYS_OF_WEEK.filter((day) => selectedDays.has(day));
  if (orderedDays.length === DAYS_OF_WEEK.length) {
    return 'Setiap Hari';
  }
  return orderedDays.length > 0 ? `Setiap ${orderedDays.join(', ')}` : 'Setiap -';
};

export const getRangeScheduleLabel = (startDate?: string, endDate?: string) => {
  return `${formatDateWithDay(startDate)} s/d ${formatDateWithDay(endDate)}`;
};

export const getScheduleLabel = (
  event: Pick<Event, 'type' | 'days' | 'startDate' | 'endDate' | 'date'>
) => {
  if (event.type === 'recurring') {
    return getRecurringScheduleLabel(event.days);
  }
  if (event.type === 'rentang') {
    return getRangeScheduleLabel(event.startDate, event.endDate);
  }
  return event.date || '-';
};

export const getParticipantCount = (event: Event) => {
  if (event.participants.length > 0) {
    return event.participants.length;
  }
  return event.participantCount;
};

export const getComputedEventStatus = (
  event: Pick<Event, 'type' | 'status' | 'date' | 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'days'>,
  now: Date
): Event['status'] => {
  if (event.status === 'completed') {
    return 'completed';
  }
  if (event.status === 'inactive') {
    return 'inactive';
  }

  if (event.type === 'one-time') {
    const startAt = buildLocalDateTime(event.date, event.startTime, '00:00');
    const endAt = buildLocalDateTime(event.date, event.endTime, '23:59');
    if (!startAt || !endAt) return 'upcoming';
    if (now < startAt) return 'upcoming';
    if (now > endAt) return 'completed';
    return 'active';
  }

  if (event.type === 'rentang') {
    if (!event.startDate || !event.endDate) return 'upcoming';

    const nowDateKey = toIsoDateKey(now);
    if (nowDateKey < event.startDate) return 'upcoming';
    if (nowDateKey > event.endDate) return 'completed';

    const startMinutes = isValidTimeValue(event.startTime) ? toMinutes(event.startTime) : null;
    const endMinutes = isValidTimeValue(event.endTime) ? toMinutes(event.endTime) : null;
    if (startMinutes === null || endMinutes === null) return 'upcoming';

    const nowMinutes = (now.getHours() * 60) + now.getMinutes();

    // Support both normal window (e.g. 08:00-10:00) and overnight window (e.g. 23:00-02:00)
    const isActiveNow = startMinutes <= endMinutes
      ? nowMinutes >= startMinutes && nowMinutes <= endMinutes
      : nowMinutes >= startMinutes || nowMinutes <= endMinutes;

    if (isActiveNow) return 'active';

    // On final date, once today's valid window is over, the range is considered completed.
    if (nowDateKey === event.endDate && startMinutes <= endMinutes && nowMinutes > endMinutes) {
      return 'completed';
    }

    return 'upcoming';
  }

  const selectedDays = new Set((event.days || []).map((day) => day.trim()).filter(Boolean));
  if (selectedDays.size === 0) {
    return 'upcoming';
  }

  const todayName = DAY_NAMES_BY_JS_DAY[now.getDay()];
  const startMinutes = isValidTimeValue(event.startTime) ? toMinutes(event.startTime) : null;
  const endMinutes = isValidTimeValue(event.endTime) ? toMinutes(event.endTime) : null;

  if (selectedDays.has(todayName) && startMinutes !== null && endMinutes !== null) {
    const nowMinutes = (now.getHours() * 60) + now.getMinutes();
    if (nowMinutes >= startMinutes && nowMinutes <= endMinutes) {
      return 'active';
    }
  }

  return 'upcoming';
};
