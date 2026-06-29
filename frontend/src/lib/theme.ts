/**
 * THEME SYSTEM
 * Centralized theme configuration for inline styles
 */

export const colors = {
  // Masjid Brand Colors
  primary: {
    main: '#0C5E3C',
    dark: '#0a4d30',
    light: '#78C2A4',
    lighter: '#a8d5c3',
  },
  gold: {
    main: '#D4AF37',
    dark: '#B8941F',
  },
  
  // Light Mode
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceHover: '#FAFAFA',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      tertiary: '#9ca3af',
    },
    border: '#e5e7eb',
    borderHover: '#d1d5db',
  },
  
  // Dark Mode
  dark: {
    background: '#1a1f2e', // Lebih terang dari #0f172a
    surface: '#232937',    // Lebih terang dari #1e293b
    surfaceHover: '#2d3548', // Lebih terang dari #334155
    text: {
      primary: '#f8fafc',  // Lebih terang untuk readability
      secondary: '#d1d5db', // Lebih terang
      tertiary: '#9ca3af',
    },
    border: '#374151',     // Lebih terang
    borderHover: '#4b5563', // Lebih terang
  },
  
  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
};

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const breakpoints = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

// Helper function to get theme colors
export const getThemeColors = (isDark: boolean) => ({
  background: isDark ? colors.dark.background : colors.light.background,
  surface: isDark ? colors.dark.surface : colors.light.surface,
  surfaceHover: isDark ? colors.dark.surfaceHover : colors.light.surfaceHover,
  text: {
    primary: isDark ? colors.dark.text.primary : colors.light.text.primary,
    secondary: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
    tertiary: isDark ? colors.dark.text.tertiary : colors.light.text.tertiary,
  },
  border: isDark ? colors.dark.border : colors.light.border,
  borderHover: isDark ? colors.dark.borderHover : colors.light.borderHover,
  primary: isDark ? colors.primary.light : colors.primary.main,
  primaryHover: isDark ? colors.primary.lighter : colors.primary.dark,
});

export type ThemeColors = ReturnType<typeof getThemeColors>;

// Animation keyframes as CSS strings
export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(10px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from { 
        opacity: 0;
        transform: translateY(-10px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
};
