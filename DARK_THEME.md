# 🌓 Dark Theme Implementation

## Overview
Sistem dark theme telah diintegrasikan ke seluruh aplikasi PortoBank dengan fitur lengkap dan responsif.

## Komponen yang Dibuat

### 1. **ThemeProvider** (`src/components/providers/ThemeProvider.tsx`)
- Context provider untuk mengelola state dark theme
- Mendukung 3 opsi: `light`, `dark`, dan `system`
- Otomatis menyimpan preferensi user di localStorage dengan key `portobank-theme`
- Mendeteksi preferensi sistem menggunakan `prefers-color-scheme`
- Menambahkan/menghapus class `dark` pada `<html>` element

**Fitur:**
- ✅ Persistent storage (preferensi tersimpan antar sesi)
- ✅ System preference detection (mengikuti sistem operasi)
- ✅ Real-time theme switching
- ✅ Smooth transitions

### 2. **useTheme Hook** (`src/hooks/useTheme.ts`)
Hook custom untuk akses theme context di mana saja dalam aplikasi.

**Return value:**
```typescript
{
  theme: 'light' | 'dark' | 'system';  // Current theme setting
  setTheme: (theme) => void;            // Change theme
  isDark: boolean;                      // Current dark mode state (useful for component logic)
}
```

**Contoh penggunaan:**
```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Is dark mode: {isDark}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### 3. **ThemeToggle Component** (`src/components/layout/ThemeToggle.tsx`)
Dropdown button untuk memilih tema (Light, Dark, System).

**Lokasi:**
- Desktop navbar (hidden md:flex)
- Mobile navbar (md:hidden)

**Icon:**
- ☀️ Sun (untuk light mode)
- 🌙 Moon (untuk dark mode)

## Integrasi di App

### Setup di App.tsx
```tsx
<ThemeProvider defaultTheme="system">
  <QueryClientProvider client={queryClient}>
    {/* App content */}
  </QueryClientProvider>
</ThemeProvider>
```

### Navbar Integration
ThemeToggle button sudah ditambahkan di navbar, accessible dari:
- Desktop: Kanan navbar, sebelum messages/notifications
- Mobile: Right side dengan icons lainnya

## CSS Variables (Dark Mode)

Semua warna sudah dikonfigurasi di `src/index.css` dengan light dan dark variants:

**Light Mode (`:root`):**
```css
--background: 0 0% 100%;      /* White */
--foreground: 222 25% 12%;    /* Dark blue-gray */
--primary: 215 82% 51%;       /* Blue #1D6FE8 */
--secondary: 210 25% 97%;     /* Light gray #F5F7FA */
```

**Dark Mode (`.dark`):**
```css
--background: 222 25% 8%;     /* Dark gray */
--foreground: 0 0% 98%;       /* Almost white */
--primary: 215 82% 58%;       /* Brighter blue */
--secondary: 222 20% 16%;     /* Dark blue-gray */
```

## Tailwind Configuration

`tailwind.config.ts` sudah dikonfigurasi:
```typescript
darkMode: ["class"]  // Menggunakan class-based dark mode
```

Ini berarti Tailwind otomatis mengaplikasikan dark variant ketika ada class `dark` pada HTML element.

## Penggunaan di Components

### Menggunakan Tailwind Dark Variant
```tsx
<div className="bg-background dark:bg-background">
  {/* Otomatis menggunakan CSS variables */}
</div>

<button className="text-foreground dark:text-foreground">
  {/* Otomatis beradaptasi */}
</button>
```

### Conditional Styling berdasarkan Theme
```tsx
const { isDark } = useTheme();

<img
  src={isDark ? '/logo-dark.png' : '/logo-light.png'}
  alt="Logo"
/>
```

## Alur Kerja Dark Theme

1. **Initial Load:**
   - App mount → ThemeProvider initialize
   - Cek localStorage untuk saved preference
   - Jika tidak ada, gunakan `defaultTheme="system"`
   - Detect system preference dan apply class `dark` jika diperlukan

2. **User mengubah theme:**
   - Klik ThemeToggle button
   - Pilih Light/Dark/System
   - State update → localStorage update
   - Class `dark` added/removed dari HTML
   - Semua component otomatis re-render dengan CSS variables baru

3. **System preference berubah (ketika theme="system"):**
   - Browser detect perubahan `prefers-color-scheme`
   - Listener di ThemeProvider tertrigger
   - Theme otomatis di-update

## Browser Support

✅ Semua modern browsers:
- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- Mobile browsers

## Color Palette

### Light Mode
| Element | Color | Hex |
|---------|-------|-----|
| Background | 0 0% 100% | #FFFFFF |
| Foreground | 222 25% 12% | #1A1F3A |
| Primary | 215 82% 51% | #1D6FE8 |
| Secondary | 210 25% 97% | #F5F7FA |
| Muted | 210 25% 97% | #F5F7FA |

### Dark Mode
| Element | Color | Hex |
|---------|-------|-----|
| Background | 222 25% 8% | #0F1219 |
| Foreground | 0 0% 98% | #FAFBFC |
| Primary | 215 82% 58% | #3B7DE6 |
| Secondary | 222 20% 16% | #1E2738 |
| Muted | 222 20% 16% | #1E2738 |

## Tips & Best Practices

1. **Always use CSS variables** - Hindari hardcode warna
   ❌ `className="bg-white"` 
   ✅ `className="bg-background"`

2. **Gunakan compound variables** - Contoh: `text-foreground` untuk foreground text

3. **Test di dark mode** - Pastikan semua halaman terlihat baik di kedua mode

4. **Accessibility** - Gunakan contrast ratio yang cukup untuk readability

5. **Animations** - Perhatikan `prefers-reduced-motion` untuk accessibility

## Testing Dark Mode

### Manual Testing:
1. Buka DevTools (F12)
2. Ctrl+Shift+P → "Rendering"
3. Find "Emulate CSS media feature prefers-color-scheme"
4. Toggle antara `prefers-color-scheme: light` dan `dark`

### Atau gunakan ThemeToggle di navbar untuk switch antar mode

## Files Ditambahkan
- ✅ `src/components/providers/ThemeProvider.tsx`
- ✅ `src/hooks/useTheme.ts`
- ✅ `src/components/layout/ThemeToggle.tsx`

## Files Dimodifikasi
- ✅ `src/App.tsx` - Add ThemeProvider wrapper
- ✅ `src/components/layout/Navbar.tsx` - Add ThemeToggle button
- ✅ `src/index.css` - Already configured with dark variables
- ✅ `tailwind.config.ts` - Already configured for dark mode

## Next Steps (Optional Enhancements)

- [ ] Add theme switcher animation
- [ ] Add theme sync across tabs
- [ ] Add theme selection in user settings
- [ ] Custom user theme palette (future feature)
- [ ] Add gradients for dark mode
- [ ] Optimize images for dark mode

---

**Status:** ✅ Dark theme fully integrated and ready to use!
