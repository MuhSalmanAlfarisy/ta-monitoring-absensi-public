import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { colors, spacing, borderRadius, transitions, getThemeColors } from '../../lib/theme';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  theme: ReturnType<typeof getThemeColors>;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Pilih...",
  theme,
  style,
  containerStyle
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...containerStyle }}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '38px', // Menyamakan dengan input standar
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: borderRadius.md,
          border: `1px solid ${isOpen ? colors.primary.main : theme.border}`,
          backgroundColor: theme.surface,
          cursor: 'pointer',
          transition: `all ${transitions.fast}`,
          boxShadow: isOpen ? `0 0 0 2px ${colors.primary.main}20` : 'none',
          ...style
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: 'calc(100% - 24px)' }}>
          {selectedValues.length === 0 ? (
            <span style={{ color: theme.text.tertiary, fontSize: '0.875rem' }}>{placeholder}</span>
          ) : (
            selectedValues.map(val => {
              const opt = options.find(o => o.value === val);
              return (
                <div
                  key={val}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    backgroundColor: `${colors.primary.main}15`,
                    color: colors.primary.main,
                    borderRadius: borderRadius.sm,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {opt?.label || val}
                  <X 
                    size={12} 
                    onClick={(e) => { e.stopPropagation(); toggleOption(val); }}
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                  />
                </div>
              );
            })
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedValues.length > 0 && (
            <X 
              size={14} 
              onClick={clearAll} 
              style={{ color: theme.text.tertiary, cursor: 'pointer' }} 
            />
          )}
          <ChevronDown 
            size={16} 
            style={{ 
              color: theme.text.tertiary, 
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }} 
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: theme.surface,
            borderRadius: borderRadius.lg,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: spacing.xs,
            zIndex: 1000,
            maxHeight: '250px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: isSelected ? `${colors.primary.main}08` : 'transparent',
                  color: isSelected ? colors.primary.main : theme.text.primary,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: `all ${transitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = theme.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontWeight: isSelected ? 600 : 400 }}>{option.label}</span>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `1.5px solid ${isSelected ? colors.primary.main : theme.border}`,
                  backgroundColor: isSelected ? colors.primary.main : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.1s'
                }}>
                  {isSelected && <Check size={12} color="#ffffff" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
