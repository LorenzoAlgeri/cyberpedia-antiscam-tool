import { useCallback, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, AlertTriangle } from 'lucide-react';
import type { DossierScreenshot } from '@/types/dossier';
import { MAX_SCREENSHOTS } from '@/types/dossier';
import { compressImage } from '@/lib/image-compression';

interface ScreenshotUploadProps {
  readonly screenshots: DossierScreenshot[];
  readonly onAdd: (screenshot: DossierScreenshot) => void;
  readonly onRemove: (index: number) => void;
}

export function ScreenshotUpload({ screenshots, onAdd, onRemove }: ScreenshotUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAdd = screenshots.length < MAX_SCREENSHOTS;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setIsCompressing(true);

    try {
      for (const file of Array.from(files)) {
        if (screenshots.length >= MAX_SCREENSHOTS) break;
        if (!file.type.startsWith('image/')) {
          setError('Solo file immagine sono accettati.');
          continue;
        }
        const dataUri = await compressImage(file);
        const screenshot: DossierScreenshot = {
          dataUri,
          filename: file.name,
          sizeBytes: Math.round(dataUri.length * 0.75), // approximate decoded bytes
          addedAt: new Date().toISOString(),
        };
        onAdd(screenshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la compressione');
    } finally {
      setIsCompressing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [screenshots.length, onAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    void handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-base font-medium text-foreground">
          Screenshot / Prove
        </label>
        <span className="text-sm text-muted-foreground">
          {screenshots.length}/{MAX_SCREENSHOTS}
        </span>
      </div>

      {/* Thumbnails */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {screenshots.map((s, i) => (
            <div key={s.addedAt + i} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-700/50">
              <img src={s.dataUri} alt={s.filename} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Rimuovi ${s.filename}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white/80">
                {s.filename}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canAdd && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-900/30 p-6 transition-colors hover:border-cyan-brand/40"
        >
          {isCompressing ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Compressione in corso...
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-slate-700"
                  style={{ minHeight: 44 }}
                >
                  <ImagePlus className="h-4 w-4" />
                  Scegli file
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-slate-700 sm:hidden"
                  style={{ minHeight: 44 }}
                >
                  <Camera className="h-4 w-4" />
                  Scatta foto
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                oppure trascina qui — max {MAX_SCREENSHOTS} immagini
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
