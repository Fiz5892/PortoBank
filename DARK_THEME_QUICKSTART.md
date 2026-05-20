## 🌓 Dark Theme - Quick Start

### Toggle Dark Mode
Klik ikon **☀️ Sun/🌙 Moon** di navbar untuk membuka menu theme picker.

**Pilihan:**
- 🌞 **Light** - Mode terang
- 🌙 **Dark** - Mode gelap  
- 💻 **System** - Mengikuti preferensi sistem operasi

### Fitur
✅ **Otomatis Tersimpan** - Pilihan theme Anda disimpan di browser  
✅ **Instan** - Beralih tema tanpa refresh halaman  
✅ **Responsif** - Tersedia di desktop dan mobile  
✅ **Sistem Sync** - Jika pilih "System", otomatis mengikuti pengaturan OS

### Dark Mode Colors
```
Background:   Gelap (#0F1219)
Text:         Putih (#FAFBFC)
Primary:      Biru cerah (#3B7DE6)
Accents:      Adjusted untuk contrast
```

### Untuk Developer
Gunakan hook `useTheme()` di component:
```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();
  // theme: 'light' | 'dark' | 'system'
  // isDark: boolean (current dark state)
}
```

### Pro Tips
1. **Custom Image untuk Dark Mode:**
   ```tsx
   const { isDark } = useTheme();
   <img src={isDark ? '/dark.png' : '/light.png'} />
   ```

2. **Styling dengan Dark Variant:**
   ```tsx
   <div className="bg-background text-foreground">
     {/* Otomatis beradaptasi dengan theme */}
   </div>
   ```

3. **Test Dark Mode:** Buka DevTools → Ctrl+Shift+P → Search "emulate CSS" → Toggle `prefers-color-scheme`

---

**Lihat `DARK_THEME.md` untuk dokumentasi lengkap**
