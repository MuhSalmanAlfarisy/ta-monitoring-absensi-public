import { useState, useLayoutEffect, useRef } from 'react';
import { X, Activity, Loader2, Clock, Monitor } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { cn } from '../../../ui/utils';
import { colors } from '../../../../lib/theme';

export interface ActivityLog {
  id: number;
  email: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

interface ActivityLogModalProps {
  theme: any;
  isMobile: boolean;
  logs: ActivityLog[];
  isLoading: boolean;
  formatTimestamp: (v?: string | null) => string;
  onClose: () => void;
}

const AutoShrinkText = ({
  text,
  maxWidth,
  minFontSize = 8,
  maxFontSize = 11,
  className = ""
}: {
  text: string;
  maxWidth: number;
  minFontSize?: number;
  maxFontSize?: number;
  className?: string;
}) => {
  const [style, setStyle] = useState<React.CSSProperties>({ fontSize: `${maxFontSize}px` });
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!textRef.current) return;

    textRef.current.style.fontSize = `${maxFontSize}px`;
    textRef.current.style.letterSpacing = 'normal';
    textRef.current.style.display = 'inline-block';

    const naturalWidth = textRef.current.scrollWidth;

    if (naturalWidth > maxWidth) {
      const ratio = maxWidth / naturalWidth;
      let calculatedFontSize = Math.max(minFontSize, maxFontSize * ratio);
      const isExtreme = calculatedFontSize === minFontSize;

      setStyle({
        fontSize: `${calculatedFontSize}px`,
        letterSpacing: isExtreme ? '-0.025em' : 'normal',
        display: 'inline-block',
        textAlign: 'center'
      });
    } else {
      setStyle({ fontSize: `${maxFontSize}px`, display: 'inline-block', textAlign: 'center' });
    }
  }, [text, maxWidth, minFontSize, maxFontSize]);

  return (
    <div
      className={cn("flex items-center justify-center overflow-visible whitespace-nowrap", className)}
      style={{ width: '100%', maxWidth: maxWidth }}
    >
      <span ref={textRef} style={style} className="block transition-all duration-200">
        {text}
      </span>
    </div>
  );
};

// Badge color: fully explicit for both light and dark, no ambiguous opacity tricks
const getActionBadgeColor = (action: string) => {
  if (action === 'LOGIN_SUCCESS')
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
  if (action === 'LOGIN_FAILED')
    return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
  if (action.includes('LOGIN'))
    return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
};

// Dot indicator color per action
const getActionDotColor = (action: string) => {
  if (action === 'LOGIN_SUCCESS') return '#10b981';
  if (action === 'LOGIN_FAILED') return '#f43f5e';
  if (action.includes('LOGIN')) return '#6366f1';
  return '#94a3b8';
};

export function ActivityLogModal({
  theme, isMobile, logs, isLoading, formatTimestamp, onClose,
}: ActivityLogModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-full flex flex-col overflow-hidden shadow-2xl transition-all"
        style={{
          maxWidth: isMobile ? '100%' : '1240px',
          backgroundColor: theme.surface,
          borderRadius: isMobile ? '16px' : '20px',
          height: isMobile ? '92vh' : '82vh',
          maxHeight: isMobile ? 'none' : '860px',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="px-6 py-5 sm:px-8 sm:py-6 flex justify-between items-center shrink-0 border-b"
          style={{
            borderBottomColor: theme.border,
            backgroundColor: theme.surface,
          }}
        >
          <h3
            className="flex items-center gap-3 font-bold text-lg sm:text-2xl tracking-tight"
            style={{ color: theme.text.primary }}
          >
            {/* Icon container — uses primary color safely */}
            <div
              className="p-2 rounded-xl"
              style={{
                backgroundColor: `${colors.primary.main}18`,
              }}
            >
              <Activity
                className="size-5 sm:size-6"
                style={{ color: colors.primary.main }}
              />
            </div>
            Log Aktivitas Keamanan
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all active:scale-90"
            style={{
              color: theme.text.tertiary,
              // explicit hover handled inline via CSS class below
            }}
            // Use a wrapper to avoid Tailwind dark: conflicts with theme prop
          >
            <span className="flex items-center justify-center rounded-xl p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <X className="size-5 sm:size-6" />
            </span>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: theme.background ?? theme.surface }}>
          {/* Loading */}
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2
                  className="size-10 animate-spin"
                  style={{ color: colors.primary.main }}
                />
                <span
                  className="text-xs font-semibold tracking-[0.25em] uppercase"
                  style={{ color: theme.text.tertiary }}
                >
                  Menarik data log…
                </span>
              </div>
            </div>

          /* Empty */
          ) : logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-16" style={{ color: theme.text.tertiary }}>
              <Activity className="size-16 opacity-20 stroke-[1.2]" />
              <p className="text-base font-semibold opacity-40 tracking-tight">
                Belum ada aktivitas yang tercatat.
              </p>
            </div>

          /* Mobile list */
          ) : isMobile ? (
            <div className="flex flex-col pb-10">
              {logs.map((log, idx) => (
                <div
                  key={log.id}
                  className={cn(
                    "px-5 py-5 flex flex-col gap-4",
                    idx !== logs.length - 1 && "border-b"
                  )}
                  style={{ borderColor: theme.border }}
                >
                  {/* Top row: timestamp + badge */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: theme.text.tertiary }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: getActionDotColor(log.action) }}
                        />
                        <span
                          className="text-sm font-bold tracking-tight"
                          style={{ color: theme.text.primary }}
                        >
                          {log.email || '—'}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase font-black px-2.5 py-1 rounded-lg border shrink-0",
                        getActionBadgeColor(log.action)
                      )}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Details block */}
                  <div
                    className="flex flex-col gap-3 pl-4 border-l-2 ml-1"
                    style={{ borderColor: theme.border }}
                  >
                    {/* IP */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="size-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: theme.border, opacity: 0.7 }}
                      >
                        <Monitor className="size-3.5" style={{ color: theme.text.tertiary }} />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: theme.text.tertiary }}
                        >
                          Alamat IP
                        </span>
                        <span
                          className="text-xs font-mono"
                          style={{ color: theme.text.secondary }}
                        >
                          {log.ip_address || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Detail text */}
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: theme.text.tertiary }}
                      >
                        Detail Aktivitas
                      </span>
                      <p
                        className="text-xs leading-relaxed font-medium"
                        style={{ color: theme.text.secondary }}
                      >
                        {log.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          /* Desktop table */
          ) : (
            <div className="min-w-full">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead
                  className="sticky top-0 z-20"
                  style={{ backgroundColor: theme.surface }}
                >
                  <tr className="text-left">
                    {[
                      { label: 'Waktu', width: '180px' },
                      { label: 'Aksi', width: '220px' },
                      { label: 'Identitas', width: '300px' },
                      { label: 'IP Alamat', width: '160px' },
                      { label: 'Detail', width: undefined },
                    ].map(({ label, width }) => (
                      <th
                        key={label}
                        className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-b"
                        style={{
                          borderBottomColor: theme.border,
                          color: theme.text.tertiary,
                          width,
                          // subtle header background stripe
                          backgroundColor: theme.surface,
                        }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className="group transition-colors"
                      style={{
                        borderBottom: `1px solid ${theme.border}`,
                        // Row hover via inline style isn't reactive, so use a wrapper approach
                      }}
                      // Tailwind hover won't respect `theme`, so we layer a subtle bg shift
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                          `${theme.border}30`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Waktu */}
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-start gap-2">
                          <Clock
                            className="size-3.5 mt-0.5 shrink-0 opacity-30"
                            style={{ color: theme.text.secondary }}
                          />
                          <span
                            className="text-xs font-semibold leading-snug"
                            style={{ color: theme.text.secondary }}
                          >
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-8 py-6 align-top">
                        <Badge
                          variant="outline"
                          className={cn(
                            "inline-flex min-h-9 w-fit max-w-[180px] px-4 py-2 items-center justify-center border rounded-xl font-black text-[10px] uppercase tracking-tight shadow-sm transition-transform hover:scale-105",
                            getActionBadgeColor(log.action)
                          )}
                        >
                          <AutoShrinkText
                            text={log.action.split('_').join(' ')}
                            maxWidth={160}
                            minFontSize={8}
                            maxFontSize={10}
                            className="text-center"
                          />
                        </Badge>
                      </td>

                      {/* Identitas */}
                      <td className="px-8 py-6 align-top">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-2 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: getActionDotColor(log.action) }}
                          />
                          <span
                            className="text-sm font-bold tracking-tight break-all leading-snug"
                            style={{ color: theme.text.primary }}
                          >
                            {log.email || '—'}
                          </span>
                        </div>
                      </td>

                      {/* IP Alamat */}
                      <td className="px-8 py-6 align-top">
                        <span
                          className="text-xs font-mono"
                          style={{ color: theme.text.tertiary }}
                        >
                          {log.ip_address || '—'}
                        </span>
                      </td>

                      {/* Detail */}
                      <td className="px-8 py-6 align-top">
                        <p
                          className="text-sm leading-relaxed font-medium whitespace-normal break-words"
                          style={{ color: theme.text.secondary }}
                        >
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}