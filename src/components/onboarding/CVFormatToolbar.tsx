// ─── CVFormatToolbar.tsx ──────────────────────────────────────────────────────
import { AlignLeft, AlignCenter, AlignRight, Download, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontFamily =
  | 'Arial'
  | 'Georgia'
  | 'Times New Roman'
  | 'Helvetica'
  | 'Garamond'
  | 'Calibri'
  | 'Verdana'
  | 'Trebuchet MS';

export type FontSizePreset = 'Small' | 'Medium' | 'Large';

export type TextAlignment = 'left' | 'center' | 'right';

export type HeaderStyle = 'classic' | 'modern' | 'minimal' | 'bold';

export interface CVFormatOptions {
  fontFamily: FontFamily;
  fontSizePreset: FontSizePreset;
  lineSpacing: number;
  alignment: TextAlignment;
  headerColor: string;       // hex color for section headings
  headerStyle: HeaderStyle;  // visual style of the header block
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_FORMAT: CVFormatOptions = {
  fontFamily: 'Arial',
  fontSizePreset: 'Small',
  lineSpacing: 14,
  alignment: 'left',
  headerColor: '#111827',
  headerStyle: 'classic',
};

// ─── Font-size pixel map ──────────────────────────────────────────────────────

export const FONT_SIZE_MAP: Record<FontSizePreset, { base: number; name: number; section: number }> = {
  Small:  { base: 9,  name: 16, section: 10 },
  Medium: { base: 10, name: 18, section: 11 },
  Large:  { base: 11, name: 20, section: 12 },
};

// ─── Preset header colors ─────────────────────────────────────────────────────

const HEADER_COLORS = [
  { label: 'Hitam',    value: '#111827' },
  { label: 'Abu',      value: '#4B5563' },
  { label: 'Biru',     value: '#1D4ED8' },
  { label: 'Biru Tua', value: '#1e3a5f' },
  { label: 'Hijau',    value: '#065F46' },
  { label: 'Merah',    value: '#B91C1C' },
  { label: 'Ungu',     value: '#6D28D9' },
  { label: 'Teal',     value: '#0F766E' },
];

const HEADER_STYLES: { value: HeaderStyle; label: string }[] = [
  { value: 'classic', label: 'Header dan Baris' },
  { value: 'modern',  label: 'Modern Blok' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold',    label: 'Bold Accent' },
];

const FONT_FAMILIES: FontFamily[] = [
  'Arial', 'Georgia', 'Times New Roman', 'Helvetica',
  'Garamond', 'Calibri', 'Verdana', 'Trebuchet MS',
];

const FONT_SIZE_PRESETS: FontSizePreset[] = ['Small', 'Medium', 'Large'];

const ALIGNMENT_OPTIONS: { value: TextAlignment; icon: React.ReactNode }[] = [
  { value: 'left',   icon: <AlignLeft  size={14} /> },
  { value: 'center', icon: <AlignCenter size={14} /> },
  { value: 'right',  icon: <AlignRight  size={14} /> },
];

// ─── Toolbar ──────────────────────────────────────────────────────────────────

interface CVFormatToolbarProps {
  format: CVFormatOptions;
  onChange: (format: CVFormatOptions) => void;
  onDownload?: () => void;
}

export function CVFormatToolbar({ format, onChange, onDownload }: CVFormatToolbarProps) {
  const set = <K extends keyof CVFormatOptions>(key: K, value: CVFormatOptions[K]) =>
    onChange({ ...format, [key]: value });

  return (
    <div className="flex flex-col gap-1.5">
      {/* ── Row 1: Font, Size, Line Spacing, Alignment, Download ── */}
      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">

        {/* Font family */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-gray-500 select-none mr-0.5" aria-hidden>
            A<sub className="text-[8px]">A</sub>
          </span>
          <Select
            value={format.fontFamily}
            onValueChange={(v) => set('fontFamily', v as FontFamily)}
          >
            <SelectTrigger className="h-7 w-36 text-xs border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }} className="text-xs">
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Font size preset */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-gray-500 select-none mr-0.5" aria-hidden>
            T<sub className="text-[8px]">T</sub>
          </span>
          <Select
            value={format.fontSizePreset}
            onValueChange={(v) => set('fontSizePreset', v as FontSizePreset)}
          >
            <SelectTrigger className="h-7 w-24 text-xs border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_PRESETS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Line spacing */}
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-gray-500" aria-hidden>
            <line x1="21" y1="10" x2="7"  y2="10" />
            <line x1="21" y1="6"  x2="3"  y2="6"  />
            <line x1="21" y1="14" x2="3"  y2="14" />
            <line x1="21" y1="18" x2="7"  y2="18" />
          </svg>
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden h-7">
            <button
              type="button"
              onClick={() => set('lineSpacing', Math.max(8, format.lineSpacing - 1))}
              className="px-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm leading-none h-full"
              aria-label="Kurangi spasi baris"
            >‹</button>
            <span className="px-2 text-xs font-medium w-7 text-center tabular-nums">
              {format.lineSpacing}
            </span>
            <button
              type="button"
              onClick={() => set('lineSpacing', Math.min(30, format.lineSpacing + 1))}
              className="px-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm leading-none h-full"
              aria-label="Tambah spasi baris"
            >›</button>
          </div>
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Text alignment */}
        <div className="flex items-center gap-0.5">
          {ALIGNMENT_OPTIONS.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('alignment', value)}
              aria-label={`Rata ${value}`}
              aria-pressed={format.alignment === value}
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                format.alignment === value
                  ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Download */}
        {onDownload && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="h-7 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
          >
            <Download size={13} />
            Unduh
          </Button>
        )}
      </div>

      {/* ── Row 2: Header color + Header style ── */}
      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">

        {/* Header color circle + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 h-7 px-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Pilih warna header"
            >
              {/* Color circle */}
              <span
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: format.headerColor }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Warna Header</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-3 w-52">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Pilih Warna</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {HEADER_COLORS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('headerColor', value)}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                    format.headerColor === value
                      ? 'border-blue-500 scale-110 shadow-md'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
            {/* Custom color picker */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Custom:</label>
              <input
                type="color"
                value={format.headerColor}
                onChange={(e) => set('headerColor', e.target.value)}
                className="w-8 h-7 rounded cursor-pointer border border-gray-200"
              />
              <span className="text-xs font-mono text-gray-500">{format.headerColor}</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Header style */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-medium">Gaya:</span>
          <Select
            value={format.headerStyle}
            onValueChange={(v) => set('headerStyle', v as HeaderStyle)}
          >
            <SelectTrigger className="h-7 w-44 text-xs border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEADER_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}