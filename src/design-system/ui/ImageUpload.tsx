'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

/**
 * A local image the user just picked, held until the form is saved. Its `file` is
 * the picked file itself, so nothing about the image is guessed. The preview is a
 * local object URL and `url` is a data URL the browser produced itself; the API
 * layer uploads it and stores the hosted URL, never the data URL.
 */
export interface PickedImage {
  /** Object URL for the immediate preview. */
  previewUrl: string;
  /** The data URL that gets persisted, or an already-remote URL. */
  url: string;
  file?: File;
}

/** Mirrors the server's IMAGE_MAX_BYTES so an oversized pick fails here, not at publish. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface ImageUploadProps {
  value: PickedImage | null;
  onChange: (image: PickedImage | null) => void;
  label?: string;
  /** Fixed height, for slots that must not grow with the screen width. */
  height?: number;
  /**
   * Draws the 1px border as a 6/6 dashed rule. The browser picks its own dash length
   * for `border-style: dashed`, so the pattern is stroked with SVG instead — the
   * same rule the mobile build uses.
   */
  dashed?: boolean;
  /** Corner radius override, for slots that spec their own. */
  radius?: number;
  /** Called instead of failing silently, so a rejected pick is visible. */
  onError?: (message: string) => void;
}

/** Reusable local image picker with an immediate preview. */
export function ImageUpload({
  value,
  onChange,
  label = 'Upload image',
  height,
  dashed = false,
  radius = 14,
  onError,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Pick an image file.');
      return;
    }
    // The picker reports the compressed size, so an oversized pick is caught now
    // rather than as a 413 on publish, after the whole form has been filled in.
    if (file.size > MAX_IMAGE_BYTES) {
      onError?.('That image is over 5 MB. Pick a smaller one.');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      onChange({ previewUrl: dataUrl, url: dataUrl, file });
    } catch {
      onError?.('Could not read that image. Pick another one.');
    } finally {
      setBusy(false);
    }
  }

  const box = dashed
    ? 'relative overflow-hidden border-0 bg-surface-raised'
    : 'relative overflow-hidden border border-border bg-surface-raised';

  return (
    <>
      <button
        type="button"
        aria-label={value ? `Replace: ${label}` : label}
        aria-busy={busy || undefined}
        onClick={() => inputRef.current?.click()}
        style={{ height, borderRadius: radius }}
        className={`${box} flex w-full items-center justify-center`}
      >
        {dashed ? <DashedFrame radius={radius} /> : null}
        {value ? (
          <>
            {/* A picked data URL or a remote URL — plain <img> keeps both working. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt=""
              className="size-full object-cover"
              style={{ borderRadius: radius }}
            />
            <span className="absolute bottom-2 start-2 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
              Click to replace
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <Upload className="size-5 text-text-muted" aria-hidden />
            <span className="text-sm text-text-muted">{label}</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label={label}
        onChange={(event) => {
          void pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </>
  );
}

/** The 1px 6/6 dashed rule the mobile build strokes, measured so the corners and
 *  the dash pattern keep their real proportions instead of being scaled to the box. */
function DashedFrame({ radius }: { radius: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full">
      {size.width > 0 ? (
        <svg width={size.width} height={size.height}>
          <rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={radius - 0.5}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="6 6"
          />
        </svg>
      ) : null}
    </div>
  );
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}
