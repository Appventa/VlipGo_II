import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCreditsModal } from "../../contexts/CreditsModalContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ImageCropModal } from "../../components/ui/ImageCropModal";
import { formatPrice, cn } from "../../lib/utils";
import {
  ArrowLeft, ArrowRight, Maximize2,
  Type, FileImage, Palette,
  CheckCircle2, UploadCloud, Pencil,
} from "lucide-react";

interface CropTarget {
  fieldId: string;
  dimensions?: string;
  src: string; // object URL of raw picked file
}

export function CustomizePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = useQuery(api.templates.getById, { templateId: id as Id<"templates"> });
  const createJob = useMutation(api.jobs.create);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);

  const [values, setValues] = useState<Record<string, string>>({});
  // Local object URLs for displaying cropped previews (before + after upload)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState<Record<string, boolean>>({});
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const { openBuyCredits } = useCreditsModal();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ytId = useMemo(() => {
    if (!template?.previewVideoUrl) return null;
    const m = template.previewVideoUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    return m ? m[1] : null;
  }, [template?.previewVideoUrl]);

  if (template === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!template) return <ShopLayout><div className="py-20 text-center text-gray-500">Template not found.</div></ShopLayout>;

  function setValue(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  /** Step 1 — file picked: open the crop modal */
  function openCropper(fieldId: string, file: File, dimensions?: string) {
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB.");
      return;
    }
    // Revoke any existing object URL for this field
    if (cropTarget?.src) URL.revokeObjectURL(cropTarget.src);
    const src = URL.createObjectURL(file);
    setCropTarget({ fieldId, dimensions, src });
  }

  /** Step 2 — user confirmed crop: upload the JPEG blob */
  async function handleCroppedUpload(blob: Blob) {
    if (!cropTarget) return;
    const { fieldId } = cropTarget;

    // Build a local preview URL from the blob
    const previewUrl = URL.createObjectURL(blob);
    // Revoke the raw source URL
    URL.revokeObjectURL(cropTarget.src);
    setCropTarget(null);

    // Show preview immediately
    setImagePreviews((prev) => {
      if (prev[fieldId]) URL.revokeObjectURL(prev[fieldId]);
      return { ...prev, [fieldId]: previewUrl };
    });

    setUploading((prev) => ({ ...prev, [fieldId]: true }));
    setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { storageId } = await uploadRes.json();
      setValue(fieldId, storageId);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading((prev) => ({ ...prev, [fieldId]: false }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    for (const field of template!.fields) {
      if (field.required && !values[field._id]) {
        setError(`"${field.label}" is required.`);
        return;
      }
    }
    setLoading(true);
    try {
      const jobId = await createJob({
        templateId: template!._id,
        assets: template!.fields
          .filter((f) => values[f._id] !== undefined)
          .map((f) => ({ fieldId: f._id, value: values[f._id] })),
      });
      navigate(`/orders/${jobId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create job";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        openBuyCredits();
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShopLayout>
      {/* Crop modal — rendered at root level, above everything */}
      {cropTarget && (
        <ImageCropModal
          src={cropTarget.src}
          dimensions={cropTarget.dimensions}
          onConfirm={handleCroppedUpload}
          onCancel={() => {
            URL.revokeObjectURL(cropTarget.src);
            setCropTarget(null);
          }}
        />
      )}

      {/* ── Step progress ── */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            1
          </div>
          <span className="text-sm font-semibold text-white">Customize</span>
        </div>
        <div className="w-16 sm:w-28 h-px bg-[#2a2a2a] mx-3" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center text-gray-600 text-xs font-medium shrink-0">
            2
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">Preview</span>
        </div>
        <div className="w-16 sm:w-28 h-px bg-[#2a2a2a] mx-3" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#262626] border border-[#333] flex items-center justify-center text-gray-600 text-xs font-medium shrink-0">
            3
          </div>
          <span className="text-sm text-gray-600 hidden sm:block">Final Render</span>
        </div>
      </div>

      {/* ── 2-col layout ── */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">

        {/* ── Left: Preview ── */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Preview</p>
              <h1 className="text-2xl font-bold text-white">{template.title}</h1>
            </div>
            <button
              type="button"
              title="View fullscreen"
              className="w-9 h-9 rounded-lg bg-[#262626] flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2e2e2e] transition-colors mt-1 shrink-0"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Video / thumbnail */}
          <div className="aspect-video bg-[#1e1e1e] rounded-xl overflow-hidden">
            {template.previewVideoUrl ? (
              ytId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?controls=0&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={template.previewVideoUrl} controls className="w-full h-full object-cover" />
              )
            ) : template.thumbnailUrl ? (
              <img src={template.thumbnailUrl} alt={template.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm">No preview available</div>
            )}
          </div>

          {/* Metadata chips */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-[#1e1e1e] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1">Category</p>
              <p className="text-sm text-white font-medium">{template.category}</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1">Preview</p>
              <p className="text-sm text-white font-medium">Free Render</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1">Output</p>
              <p className="text-sm text-white font-medium">Full HD</p>
            </div>
          </div>

          {template.description && (
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">{template.description}</p>
          )}
        </div>

        {/* ── Right: Config panel ── */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-1">Configure Template</h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Adjust the properties below to personalize your video. Changes will be reflected in the final export.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {template.fields.map((field) => (
              <div key={field._id}>

                {/* TEXT */}
                {field.type === "TEXT" && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={field._id} className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Type size={13} className="text-[#C3C0FF]" />
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <Input
                      id={field._id}
                      value={values[field._id] ?? ""}
                      onChange={(e) => {
                        const v = field.maxLength
                          ? e.target.value.slice(0, field.maxLength)
                          : e.target.value;
                        setValue(field._id, v);
                      }}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}…`}
                    />
                    {field.maxLength && (() => {
                      const len = (values[field._id] ?? "").length;
                      const remaining = field.maxLength - len;
                      return (
                        <p className={cn(
                          "text-xs text-right tabular-nums",
                          remaining <= 0 ? "text-red-400" :
                          remaining <= Math.ceil(field.maxLength * 0.15) ? "text-amber-400" :
                          "text-gray-600"
                        )}>
                          {len} / {field.maxLength}
                        </p>
                      );
                    })()}
                  </div>
                )}

                {/* COLOR */}
                {field.type === "COLOR" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Palette size={13} className="text-[#C3C0FF]" />
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <div className="flex items-center gap-3 bg-[#262626] rounded-xl px-4 py-3">
                      <input
                        type="color"
                        value={values[field._id] ?? "#6366f1"}
                        onChange={(e) => setValue(field._id, e.target.value)}
                        className="h-8 w-12 rounded-lg cursor-pointer bg-transparent border-0 p-0.5"
                      />
                      <span className="text-sm text-gray-400 font-mono">{values[field._id] ?? "#6366f1"}</span>
                    </div>
                  </div>
                )}

                {/* IMAGE — smart crop-upload zone */}
                {field.type === "IMAGE" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <FileImage size={13} className="text-[#C3C0FF]" />
                      {field.label}{field.required ? " *" : ""}
                    </label>

                    {/* ── Confirmed state: show cropped thumbnail ── */}
                    {values[field._id] && imagePreviews[field._id] ? (
                      <div className="relative rounded-xl overflow-hidden bg-[#262626] group">
                        <img
                          src={imagePreviews[field._id]}
                          alt={field.label}
                          className="w-full object-cover"
                          style={{ maxHeight: 180 }}
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[field._id]?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262626] text-sm text-white hover:bg-[#2e2e2e] transition-colors"
                          >
                            <Pencil size={12} /> Replace
                          </button>
                        </div>
                        {/* Status bar */}
                        <div className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                            <CheckCircle2 size={12} /> Image ready
                          </span>
                          {field.dimensions && (
                            <span className="text-xs text-[#C3C0FF]/70 tabular-nums">
                              {field.dimensions.replace("x", " × ")} px
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* ── Empty / uploading drop zone ── */
                      <div
                        onClick={() => !uploading[field._id] && fileInputRefs.current[field._id]?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver((p) => ({ ...p, [field._id]: true })); }}
                        onDragLeave={() => setDragOver((p) => ({ ...p, [field._id]: false }))}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver((p) => ({ ...p, [field._id]: false }));
                          const file = e.dataTransfer.files?.[0];
                          if (file) openCropper(field._id, file, field.dimensions);
                        }}
                        className={cn(
                          "rounded-xl border border-dashed transition-all select-none",
                          "flex flex-col items-center justify-center gap-2.5 py-8",
                          uploading[field._id]
                            ? "border-[#C3C0FF]/30 bg-indigo-600/5 cursor-wait"
                            : dragOver[field._id]
                              ? "border-[#C3C0FF]/60 bg-indigo-600/10 cursor-copy"
                              : "border-[#C3C0FF]/15 bg-[#262626] hover:border-[#C3C0FF]/35 hover:bg-[#2a2a2a] cursor-pointer"
                        )}
                      >
                        {uploading[field._id] ? (
                          <>
                            <div className="relative w-10 h-10">
                              <svg className="animate-spin w-full h-full text-indigo-500" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                              </svg>
                              <UploadCloud size={16} className="absolute inset-0 m-auto text-indigo-400" />
                            </div>
                            <p className="text-sm text-indigo-300 font-medium">Uploading…</p>
                            <p className="text-xs text-gray-600">Please wait</p>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center">
                              <UploadCloud size={18} className="text-gray-500" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-300">
                                Drop image or{" "}
                                <span className="text-[#C3C0FF] font-medium">Browse</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">PNG, JPG, WEBP — max 20MB</p>
                            </div>
                            {field.dimensions && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C3C0FF]/8 border border-[#C3C0FF]/15">
                                <FileImage size={11} className="text-[#C3C0FF] shrink-0" />
                                <span className="text-xs font-semibold text-[#C3C0FF]">
                                  Required: {field.dimensions.replace("x", " × ")} px
                                </span>
                              </div>
                            )}
                            {field.dimensions && (
                              <p className="text-[11px] text-gray-700 text-center">
                                You'll crop your image to the exact size after selecting
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={(el) => { fileInputRefs.current[field._id] = el; }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        // Reset so same file can be picked again
                        e.target.value = "";
                        if (file) openCropper(field._id, file, field.dimensions);
                      }}
                    />
                  </div>
                )}

              </div>
            ))}

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Pricing */}
            <div className="bg-indigo-600/10 rounded-xl border border-[#C3C0FF]/15 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-sm">{template.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">One-time · HD render included</p>
              </div>
              <span className="text-xl font-bold text-[#C3C0FF]">
                {formatPrice(template.price, template.currency)}
              </span>
            </div>

            <Button type="submit" size="lg" loading={loading} className="gap-2">
              Get Preview <span className="text-indigo-200/70 font-normal text-sm">· 1 credit</span> <ArrowRight size={16} />
            </Button>
          </form>
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="mt-8 pt-5 border-t border-[#1e1e1e]">
        <Link
          to={`/templates/${template._id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Template
        </Link>
      </div>
    </ShopLayout>
  );
}
