import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, X, Check } from "lucide-react";
import { getCroppedImg } from "../../lib/cropImage";
import { cn } from "../../lib/utils";

interface Props {
  /** object URL of the image to crop */
  src: string;
  /** e.g. "1280x720" — drives the aspect ratio and output size */
  dimensions?: string;
  /** called with the cropped JPEG blob on confirm */
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

function parseDimensions(d?: string): { width: number; height: number } | null {
  if (!d) return null;
  const m = d.match(/^(\d+)[xX×](\d+)$/);
  if (!m) return null;
  return { width: parseInt(m[1]), height: parseInt(m[2]) };
}

export function ImageCropModal({ src, dimensions, onConfirm, onCancel }: Props) {
  const size = parseDimensions(dimensions);
  const aspect = size ? size.width / size.height : 16 / 9;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(src, croppedAreaPixels, rotation, size ?? undefined);
      onConfirm(blob);
    } catch {
      // surface to parent as needed
    } finally {
      setProcessing(false);
    }
  }

  function rotate(delta: number) {
    setRotation((r) => (r + delta + 360) % 360);
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(10,10,10,0.92)", backdropFilter: "blur(6px)" }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
        <div>
          <p className="text-sm font-semibold text-white">Crop Image</p>
          {size ? (
            <p className="text-xs text-gray-500 mt-0.5">
              Target: {size.width} × {size.height} px — drag to frame, pinch or scroll to zoom
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">Drag to frame, pinch or scroll to zoom</p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#262626] transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Crop canvas ── */}
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
          showGrid={true}
          style={{
            containerStyle: { background: "#0a0a0a" },
            cropAreaStyle: {
              border: "2px solid rgba(195,192,255,0.8)",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            },
          }}
        />
      </div>

      {/* ── Controls ── */}
      <div className="shrink-0 px-5 py-4 bg-[#131313] border-t border-[#2a2a2a] flex flex-col gap-4">

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#262626] transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <div className="relative flex-1 h-1.5 rounded-full bg-[#2a2a2a]">
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={cn(
                "absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
              )}
            />
            {/* Visual track fill */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#C3C0FF]/70 transition-all"
              style={{ width: `${((zoom - 1) / 2) * 100}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#C3C0FF] shadow-md transition-all pointer-events-none"
              style={{ left: `calc(${((zoom - 1) / 2) * 100}% - 8px)` }}
            />
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#262626] transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <span className="text-xs text-gray-600 tabular-nums w-8 text-right">{zoom.toFixed(1)}×</span>
        </div>

        {/* Rotation + action buttons */}
        <div className="flex items-center gap-3">
          {/* Rotate controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => rotate(-90)}
              title="Rotate 90° left"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#262626] transition-colors"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => rotate(90)}
              title="Rotate 90° right"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#262626] transition-colors"
            >
              <RotateCw size={14} />
            </button>
            {rotation !== 0 && (
              <span className="text-xs text-gray-600 tabular-nums ml-1">{rotation}°</span>
            )}
          </div>

          <div className="flex-1" />

          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-[#262626] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={processing}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all",
              "bg-gradient-to-b from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.98]",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {processing ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <Check size={14} />
                Crop &amp; Use
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
