import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CalendarRange,
  RefreshCw,
  Clock,
  History,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { colors, spacing, borderRadius, shadows, transitions } from '../../../lib/theme';
import type { ThemeColors } from '../../../lib/theme';
import type { Event } from '../../../lib/types';
import {
  getComputedEventStatus,
  getScheduleLabel,
  getParticipantCount,
  formatCreatedAt,
} from '../../../lib/utils';

// ─── Mobile hook ──────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [breakpoint]);
  return isMobile;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Event['status'],
  { label: string; dotColor: string; badgeBg: string; badgeText: string; borderColor: string }
> = {
  active: {
    label: 'Aktif',
    dotColor: colors.success,
    badgeBg: `${colors.success}1A`,
    badgeText: colors.success,
    borderColor: `${colors.success}30`,
  },
  inactive: {
    label: 'Tidak Aktif',
    dotColor: '#9ca3af',
    badgeBg: '#f3f4f620',
    badgeText: '#9ca3af',
    borderColor: '#9ca3af30',
  },
  completed: {
    label: 'Selesai',
    dotColor: '#9ca3af',
    badgeBg: '#f3f4f620',
    badgeText: '#9ca3af',
    borderColor: '#9ca3af30',
  },
  upcoming: {
    label: 'Mendatang',
    dotColor: colors.warning,
    badgeBg: `${colors.warning}1A`,
    badgeText: colors.warning,
    borderColor: `${colors.warning}30`,
  },
};

// ─── Icon & Gradient per event type ─────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  Event['type'],
  { icon: React.ElementType; gradient: string; accentColor: string }
> = {
  'one-time': {
    icon: Calendar,
    gradient: `linear-gradient(135deg, ${colors.primary.main}, ${colors.primary.dark})`,
    accentColor: colors.primary.main,
  },
  'recurring': {
    icon: RefreshCw,
    gradient: `linear-gradient(135deg, #3b82f6, #1d4ed8)`,
    accentColor: '#3b82f6',
  },
  'rentang': {
    icon: CalendarRange,
    gradient: `linear-gradient(135deg, #f59e0b, #b45309)`,
    accentColor: '#f59e0b',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: Event;
  now: Date;
  isDark: boolean;
  theme: ThemeColors;
  canMarkRecurringAsCompleted: (event: Event) => boolean;
  onCardClick: (event: Event) => void;
  onHistoryClick: (event: Event) => void;
  onCompleteClick: (event: Event) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventCard({
  event,
  now,
  isDark,
  theme,
  canMarkRecurringAsCompleted,
  onCardClick,
  onHistoryClick,
  onCompleteClick,
}: EventCardProps) {
  const isMobile = useIsMobile(640);
  const eventStatus = getComputedEventStatus(event, now);
  const statusCfg = STATUS_CONFIG[eventStatus];
  const { icon: IconComponent, gradient: iconGradient, accentColor } = EVENT_TYPE_CONFIG[event.type];
  const participantCount = getParticipantCount(event);
  const canComplete = canMarkRecurringAsCompleted(event);

  // Responsive sizes
  const iconBoxSize  = isMobile ? 40 : 44;
  const iconSize     = isMobile ? 18 : 20;
  const titleSize    = isMobile ? '0.9375rem' : '1rem';
  const bodyPadding  = isMobile ? spacing.sm : spacing.md;
  const sectionGap   = isMobile ? spacing.sm : spacing.md;

  return (
    <motion.div
      whileHover={{ y: isMobile ? 0 : -4, boxShadow: isMobile ? shadows.sm : shadows.lg }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onCardClick(event)}
      style={{
        backgroundColor: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: borderRadius.xl,
        cursor: 'pointer',
        boxShadow: shadows.sm,
        transition: transitions.base,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Accent stripe kiri ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: '100%',
          background: iconGradient,
          borderRadius: `${borderRadius.xl} 0 0 ${borderRadius.xl}`,
        }}
      />


      {/* ════ CARD BODY ════ */}
      <div
        style={{
          padding: bodyPadding,
          paddingLeft: `calc(${bodyPadding} + 4px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: sectionGap,
          position: 'relative',
        }}
      >

        {/* ── SECTION 1: Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm, flex: 1, minWidth: 0 }}>
            {/* Gradient icon */}
            <div
              style={{
                width: iconBoxSize,
                height: iconBoxSize,
                background: iconGradient,
                borderRadius: borderRadius.md,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 10px ${accentColor}35`,
              }}
            >
              <IconComponent size={iconSize} color="#ffffff" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontSize: titleSize,
                  fontWeight: 700,
                  color: theme.text.primary,
                  margin: 0,
                  marginBottom: '4px',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.title}
              </h3>

              {/* Status badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: `2px ${spacing.sm}`,
                  borderRadius: borderRadius.full,
                  backgroundColor: statusCfg.badgeBg,
                  border: `1px solid ${statusCfg.borderColor}`,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: statusCfg.badgeText,
                  letterSpacing: '0.02em',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    backgroundColor: statusCfg.dotColor,
                    display: 'inline-block',
                    animation: eventStatus === 'active' ? 'statusPulse 2s infinite' : 'none',
                  }}
                />
                {statusCfg.label}
              </div>
            </div>
          </div>

          {/* History button */}
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: theme.surfaceHover }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onHistoryClick(event);
            }}
            title="Riwayat Event"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text.secondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: borderRadius.md,
              flexShrink: 0,
              transition: transitions.fast,
              minWidth: isMobile ? 32 : 'auto',
              minHeight: isMobile ? 32 : 'auto',
            }}
          >
            <History size={isMobile ? 14 : 15} />
          </motion.button>
        </div>

        {/* ── SECTION 2: Deskripsi ── */}
        {event.description && (
          <p
            style={{
              color: theme.text.secondary,
              fontSize: isMobile ? '0.8rem' : '0.8125rem',
              margin: 0,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.description}
          </p>
        )}

        {/* ── SECTION 3: Jadwal & Waktu ── */}
        {/* Desktop: 2 kolom | Mobile: 1 kolom (stack) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: spacing.sm,
          }}
        >
          {/* Jadwal */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              backgroundColor: isDark ? `${accentColor}0D` : `${accentColor}08`,
              border: `1px solid ${accentColor}20`,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.md,
            }}
          >
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Jadwal
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
              <Calendar size={12} color={accentColor} style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? '0.8125rem' : '0.8rem', color: theme.text.primary, fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {getScheduleLabel(event)}
              </span>
            </div>
          </div>

          {/* Waktu */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              backgroundColor: isDark ? `${accentColor}0D` : `${accentColor}08`,
              border: `1px solid ${accentColor}20`,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: borderRadius.md,
            }}
          >
            <span style={{ fontSize: '0.625rem', fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Waktu
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} color={accentColor} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? '0.8125rem' : '0.8rem', color: theme.text.primary, fontWeight: 500 }}>
                {event.startTime} – {event.endTime}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Footer ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: isMobile ? 'flex-start' : 'space-between',
            paddingTop: spacing.sm,
            borderTop: `1px solid ${theme.border}`,
            gap: spacing.sm,
          }}
        >
          {/* Partisipan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: borderRadius.md,
                backgroundColor: isDark ? `${colors.primary.main}20` : `${colors.primary.main}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={14} color={colors.primary.main} />
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.text.primary, lineHeight: 1 }}>
                {participantCount}
              </span>
              <span style={{ fontSize: '0.7rem', color: theme.text.secondary, marginLeft: '4px' }}>
                partisipan
              </span>
            </div>
          </div>

          {/* Tandai Selesai button */}
          {canComplete && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => {
                e.stopPropagation();
                onCompleteClick(event);
              }}
              style={{
                backgroundColor: colors.primary.main,
                color: '#ffffff',
                border: 'none',
                borderRadius: borderRadius.md,
                padding: isMobile ? `${spacing.sm} ${spacing.md}` : `6px ${spacing.md}`,
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: `0 4px 12px ${colors.primary.main}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <CheckCircle2 size={13} />
              Tandai Selesai
            </motion.button>
          )}
        </div>

        {/* ── SECTION 5: Created meta ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: isMobile ? 'clamp(0.5rem, 2.5vw, 0.6875rem)' : '0.6875rem',
            color: theme.text.tertiary,
            marginTop: `-${spacing.xs}`,
            minWidth: 0,
          }}
        >
          <Clock size={isMobile ? 8 : 10} style={{ flexShrink: 0 }} />
          <span
            style={{
              whiteSpace: 'nowrap',
            }}
          >
            Dibuat{' '}
            <span style={{ fontWeight: 500, color: theme.text.secondary }}>
              {formatCreatedAt(event.createdAt)}
            </span>
            {' '}oleh{' '}
            <span style={{ fontWeight: 500, color: theme.text.secondary }}>
              {event.createdBy}
            </span>
          </span>
        </div>

      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </motion.div>
  );
}
