# 📘 CSS Architecture Documentation

## 🎯 Overview

CSS untuk Dashboard Monitoring Absensi Masjid telah diorganisir dengan arsitektur modular untuk meningkatkan maintainability, reusability, dan performa.

---

## 📁 File Structure

```
/styles/
├── globals.css       # Entry point - imports all modules
├── base.css          # Variables, reset, typography
├── layout.css        # Grid, sidebar, containers
├── components.css    # Reusable component styles
├── pages.css         # Page-specific overrides
└── README.md         # This file
```

---

## 🎨 1. base.css

**Tanggung Jawab:**
- CSS Variables (single source of truth)
- Dark mode variables
- Base reset & normalize
- Typography base styles

**CSS Variables:**

### Brand Colors (Masjid Theme)
```css
--color-masjid-primary: #0C5E3C      /* Hijau Tua */
--color-masjid-primary-dark: #0a4d30
--color-masjid-secondary: #78C2A4    /* Hijau Muda */
--color-masjid-secondary-dark: #65a890
--color-masjid-gold: #D4AF37         /* Gold Accent */
--color-masjid-gold-dark: #B8941F
```

### Spacing System
```css
--spacing-xs: 0.25rem   /* 4px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
--spacing-2xl: 3rem     /* 48px */
```

### Border Radius
```css
--radius: 0.625rem       /* Base: 10px */
--radius-sm: ~6px
--radius-md: ~8px
--radius-lg: 10px
--radius-xl: ~14px
--radius-2xl: 16px
--radius-full: 9999px
```

### Transitions
```css
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms
```

**Dark Mode Support:**
Semua variable memiliki dark mode counterpart yang otomatis aktif ketika class `.dark` ditambahkan ke `<html>`.

---

## 🏗️ 2. layout.css

**Tanggung Jawab:**
- Page structure (container, wrapper)
- Sidebar layout & responsive behavior
- Grid systems (1-col, 2-col, 3-col, 4-col, auto)
- Flex utilities
- Responsive breakpoints

**Key Classes:**

### Grid Systems
```css
.grid-1        /* 1 column (mobile-first) */
.grid-2        /* 1 col mobile, 2 col tablet+ */
.grid-3        /* 1 col mobile, 2 col tablet, 3 col desktop */
.grid-4        /* 1 col mobile, 2 col tablet, 4 col desktop */
.grid-auto     /* Auto-fit responsive grid */
```

### Flex Utilities
```css
.flex-between  /* justify-between + align-center */
.flex-center   /* justify-center + align-center */
.flex-start    /* justify-start + align-center */
.flex-end      /* justify-end + align-center */
```

### Responsive Behavior
- **Mobile:** `< 768px` - Sidebar hidden, 1 column layouts
- **Tablet:** `768px - 1024px` - 2 column layouts
- **Desktop:** `> 1024px` - Sidebar visible, 3-4 column layouts

---

## 🎨 3. components.css

**Tanggung Jawab:**
- Reusable component classes
- Gradient backgrounds
- Icon containers
- Status indicators
- Badges, cards, modals
- Avatars, alerts, animations

**Key Classes:**

### Gradients (Reusable)
```css
.gradient-primary    /* Hijau Tua → Hijau Muda */
.gradient-secondary  /* Hijau Muda → Hijau Tua */
.gradient-gold       /* Gold → Gold Dark */
```

### Icon Containers
```css
.icon-container      /* 2.5rem (40px) */
.icon-container-sm   /* 2rem (32px) */
.icon-container-lg   /* 3rem (48px) */
```

### Status Indicators
```css
.status-online       /* Green dot */
.status-offline      /* Gray dot */
.status-warning      /* Yellow dot */
.status-error        /* Red dot */
```

### Badges
```css
.badge-masjid           /* Primary badge */
.badge-masjid-secondary /* Secondary badge */
.badge-gold             /* Gold badge */
```

### Cards
```css
.info-card          /* Gray background info card */
.card-border-accent /* Card with left border accent */
.card-interactive   /* Hoverable card with lift effect */
.stats-card         /* Stats card with gradient */
```

### Avatars
```css
.avatar-sm   /* 2rem */
.avatar-md   /* 3rem */
.avatar-lg   /* 4rem */
.avatar-xl   /* 8rem */
```

### Modals
```css
.modal-overlay   /* Fixed overlay with backdrop */
.modal-content   /* Modal container */
```

### Loading Spinners
```css
.spinner-sm   /* Small spinner */
.spinner-md   /* Medium spinner */
.spinner-lg   /* Large spinner */
```

### Alerts
```css
.alert-info     /* Blue info alert */
.alert-success  /* Green success alert */
.alert-warning  /* Yellow warning alert */
.alert-error    /* Red error alert */
```

---

## 📄 4. pages.css

**Tanggung Jawab:**
- Page-specific styles
- Settings page components
- Dashboard layout
- Data Jamaah details view
- Login page
- Report filters

**Key Classes:**

### Settings Page
```css
.settings-page           /* Main container */
.settings-section-card   /* Section card */
.settings-section-icon   /* Icon container in section header */
.settings-row            /* Row with gray background */
```

### Device Status (Settings)
```css
.device-status-grid   /* 2-4 column grid */
.device-status-item   /* Single status item */
.device-status-label  /* Label text */
.device-status-value  /* Value text (primary color) */
```

### ATT Log History (Settings)
```css
.attlog-history       /* Container */
.attlog-history-item  /* Single log item */
.attlog-timestamp     /* Timestamp text */
.attlog-status        /* Status indicator */
```

### Password Section (Settings)
```css
.password-section       /* Container */
.password-hint          /* Helper text */
.password-requirements  /* List of requirements */
.password-requirement   /* Single requirement */
```

### Dark Mode Toggle (Settings)
```css
.theme-toggle-container  /* Special container with gradient border */
.theme-toggle-info       /* Info section */
.theme-toggle-icon       /* Icon with background */
```

### Dashboard Page
```css
.dashboard-stats-grid      /* 1-2-4 column responsive grid */
.dashboard-chart-container /* Chart container with min-height */
```

### Data Jamaah Page
```css
.jamaah-list-header  /* Windows Explorer style header */
.jamaah-list-item    /* List item row */
```

### Riwayat Kehadiran
```css
.riwayat-grid       /* 1-2-3 column grid for photos */
.riwayat-grid-item  /* Single grid item with hover */
```

### Empty States
```css
.empty-state       /* Centered empty state */
.empty-state-icon  /* Icon container */
.empty-state-text  /* Message text */
```

---

## 🌓 Dark Mode Implementation

### Aktivasi Dark Mode

**JavaScript:**
```javascript
// Enable dark mode
document.documentElement.classList.add('dark');

// Disable dark mode
document.documentElement.classList.remove('dark');
```

**CSS Variables:**
Semua variables di `base.css` memiliki override untuk `.dark` class. Contoh:

```css
:root {
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
```

### Dark Mode Responsive Classes

```css
.text-masjid-primary  /* Auto switches in dark mode */
.section-title        /* Primary → Secondary in dark */
.info-card            /* Auto adjusts background */
```

---

## 📱 Responsive Design

### Breakpoints
```css
Mobile:  < 640px   (sm)
Tablet:  640px+    (md: 768px+)
Desktop: 1024px+   (lg)
Large:   1280px+   (xl)
```

### Helper Classes
```css
.mobile-hidden   /* Display none < 640px */
.mobile-only     /* Display none >= 640px */
.tablet-hidden   /* Display none < 768px */
.desktop-hidden  /* Display none < 1024px */
```

---

## 🎬 Animations

### Built-in Animations
```css
@keyframes slideInFromRight
@keyframes slideInFromLeft
@keyframes fadeInUp
@keyframes scaleIn
@keyframes pulse-soft
```

### Animation Classes
```css
.animate-slide-in-right
.animate-slide-in-left
.animate-fade-in-up
.animate-scale-in
.pulse-soft
```

### Transition Utilities
```css
.transition-fast  /* 150ms */
.transition-base  /* 200ms */
.transition-slow  /* 300ms */
```

---

## 🎨 Color Usage Guide

### Primary Actions
```css
background-color: var(--color-masjid-primary);
color: white;
```

### Secondary Elements
```css
background-color: var(--color-masjid-secondary);
color: white;
```

### Highlights/Accents
```css
background-color: var(--color-masjid-gold);
color: white;
```

### Text Colors
```css
.text-masjid-primary    /* Hijau tua (auto dark mode) */
.text-masjid-secondary  /* Hijau muda */
.text-masjid-gold       /* Gold */
```

---

## 🚀 Performance Tips

### 1. GPU Acceleration
```css
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### 2. Will-Change
```css
.will-change-transform { will-change: transform; }
.will-change-opacity { will-change: opacity; }
```

### 3. Scrollbar Performance
Custom scrollbar sudah dioptimasi untuk performa smooth di `globals.css`.

---

## ✅ Best Practices

### 1. Gunakan CSS Variables
❌ **Jangan:**
```css
.my-button {
  background: #0C5E3C;
}
```

✅ **Lakukan:**
```css
.my-button {
  background-color: var(--color-masjid-primary);
}
```

### 2. Gunakan Reusable Classes
❌ **Jangan:**
```css
.custom-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #F5F5F5;
}
```

✅ **Lakukan:**
```css
<div class="flex-between info-card">...</div>
```

### 3. Dark Mode Aware
Pastikan komponen baru mendukung dark mode dengan:
```css
.my-component {
  background: var(--background);
  color: var(--foreground);
}
```

### 4. Responsive First
Gunakan grid classes yang sudah ada:
```css
<div class="grid-3">...</div>  /* Auto responsive */
```

---

## 🔧 Maintenance

### Menambah Variable Baru
Tambahkan di `base.css`:
```css
:root {
  --my-new-color: #value;
}

.dark {
  --my-new-color: #dark-value;
}
```

### Menambah Component Class
Tambahkan di `components.css`:
```css
.my-new-component {
  /* styles */
}
```

### Menambah Page-Specific Style
Tambahkan di `pages.css`:
```css
.my-page-specific {
  /* styles */
}
```

---

## 📊 CSS Stats

- **Total Files:** 5
- **Total Variables:** 80+
- **Reusable Classes:** 60+
- **Dark Mode Support:** ✅ Full
- **Responsive:** ✅ Mobile-first
- **Performance:** ✅ Optimized

---

## 🎯 Migration Guide

Jika Anda punya style lama di component, migrate dengan:

1. **Cari CSS Variables** yang cocok di `base.css`
2. **Gunakan Reusable Classes** dari `components.css`
3. **Pastikan Dark Mode** support
4. **Test Responsive** di berbagai screen sizes

---

**Last Updated:** 26 Januari 2026

**Maintained by:** Dashboard Masjid Development Team

**Version:** 2.0.0

---

🌟 **Happy Coding! Barakallahu fiikum!** 🤲
