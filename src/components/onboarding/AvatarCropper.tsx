import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';

interface AvatarCropperProps {
  imageSrc: string;           // data URL or object URL of the source image
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
  size?: number;              // output canvas size in px (default 256)
}

export const AvatarCropper = ({
  imageSrc,
  onConfirm,
  onCancel,
  size = 256,
}: AvatarCropperProps) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const isDragging   = useRef(false);
  const lastPos      = useRef({ x: 0, y: 0 });

  // Offset = translation of image center relative to canvas center (in canvas px)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale,  setScale]  = useState(1);
  const [loaded, setLoaded] = useState(false);

  const CANVAS_SIZE = 300; // display canvas size (px)
  const PREVIEW_RADIUS = CANVAS_SIZE / 2 - 2;

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image inside canvas circle on first load
      const fitScale = Math.max(
        CANVAS_SIZE / img.naturalWidth,
        CANVAS_SIZE / img.naturalHeight,
      );
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // ── Draw ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const ctx  = canvasRef.current.getContext('2d')!;
    const img  = imgRef.current;
    const cx   = CANVAS_SIZE / 2;
    const cy   = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, cx - w / 2 + offset.x, cy - h / 2 + offset.y, w, h);

    // Circular overlay mask — darkens outside
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(cx, cy, PREVIEW_RADIUS, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, PREVIEW_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [loaded, offset, scale]);

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastPos.current    = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((s) => Math.min(10, Math.max(0.1, s - e.deltaY * 0.001)));
  }, []);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const fitScale = Math.max(
      CANVAS_SIZE / img.naturalWidth,
      CANVAS_SIZE / img.naturalHeight,
    );
    setScale(fitScale);
    setOffset({ x: 0, y: 0 });
  };

  // ── Confirm — crop to circle ─────────────────────────────────────────────
  const handleConfirm = () => {
    if (!imgRef.current) return;
    const img  = imgRef.current;
    const out  = document.createElement('canvas');
    out.width  = size;
    out.height = size;
    const ctx  = out.getContext('2d')!;

    const ratio  = size / CANVAS_SIZE;
    const cx     = CANVAS_SIZE / 2;
    const cy     = CANVAS_SIZE / 2;
    const w      = img.naturalWidth  * scale;
    const h      = img.naturalHeight * scale;
    const srcX   = cx - w / 2 + offset.x;
    const srcY   = cy - h / 2 + offset.y;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX * ratio, srcY * ratio, w * ratio, h * ratio);

    onConfirm(out.toDataURL('image/png'));
  };

  const sliderScale = Math.round(((scale - 0.1) / (10 - 0.1)) * 100);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Canvas */}
      <div className="relative select-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="rounded-full cursor-grab active:cursor-grabbing touch-none"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full">
            <span className="text-xs text-gray-500">Loading…</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Drag to reposition • scroll or slider to zoom
      </p>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 w-full max-w-xs">
        <ZoomOut
          size={16}
          className="text-gray-500 cursor-pointer shrink-0"
          onClick={() => setScale((s) => Math.max(0.1, s - 0.1))}
        />
        <Slider
          min={0}
          max={100}
          step={1}
          value={[sliderScale]}
          onValueChange={([v]) =>
            setScale(0.1 + (v / 100) * (10 - 0.1))
          }
          className="flex-1"
        />
        <ZoomIn
          size={16}
          className="text-gray-500 cursor-pointer shrink-0"
          onClick={() => setScale((s) => Math.min(10, s + 0.1))}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full max-w-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-1 text-xs gap-1"
        >
          <RotateCcw size={13} />
          Reset
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs gap-1 text-destructive hover:text-destructive"
        >
          <X size={13} />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          className="flex-1 text-xs gap-1"
          disabled={!loaded}
        >
          <Check size={13} />
          Apply
        </Button>
      </div>
    </div>
  );
};