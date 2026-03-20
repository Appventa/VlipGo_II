import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { cn } from "../../lib/utils";
import { Plus, Trash2, GripVertical, Upload, X, ImageIcon } from "lucide-react";

type FieldType = "TEXT" | "IMAGE" | "COLOR";

interface FieldDraft {
  label: string;
  type: FieldType;
  nexrenderLayer: string;
  required: boolean;
  order: number;
  maxLength?: number;
  dimensions?: string;
}

function emptyField(order: number): FieldDraft {
  return { label: "", type: "TEXT", nexrenderLayer: "", required: true, order };
}

const FIELD_TYPE_COLOR: Record<FieldType, string> = {
  TEXT:  "bg-indigo-500/10 text-[#C3C0FF] border-indigo-500/20",
  IMAGE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COLOR: "bg-green-500/10 text-green-400 border-green-500/20",
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1e1e1e] rounded-2xl p-6 flex flex-col gap-5">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-[#C3C0FF]">{title}</h2>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 transition-all";
const selectCls = `${inputCls} cursor-pointer`;

export function AdminNewTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const upsert = useMutation(api.templates.upsert);
  const generateUploadUrl = useMutation(api.templates.generateUploadUrl);
  const existing = useQuery(
    api.templates.getByIdAdmin,
    id ? { templateId: id as Id<"templates"> } : "skip"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [previewId, setPreviewId] = useState("");
  const [previewComp, setPreviewComp] = useState("");
  const [finalId, setFinalId] = useState("");
  const [finalComp, setFinalComp] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [thumbnailStorageId, setThumbnailStorageId] = useState(""); // raw ID sent to backend
  const [thumbnailPreview, setThumbnailPreview] = useState(""); // URL for display
  const [fields, setFields] = useState<FieldDraft[]>([emptyField(0)]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Pre-fill form when editing
  if (id && existing && !initialized) {
    setTitle(existing.title);
    setDescription(existing.description);
    setCategory(existing.category);
    setTags(existing.tags.join(", "));
    setPrice(String(existing.price / 100));
    setCurrency(existing.currency);
    setPreviewId(existing.nexrenderComposition);
    setPreviewComp(existing.nexrenderCompositionName ?? "");
    setFinalId(existing.nexrenderFinalComposition ?? "");
    setFinalComp(existing.nexrenderFinalCompositionName ?? "");
    setPreviewVideoUrl(existing.previewVideoUrl ?? "");
    setIsPublished(existing.isPublished);
    // thumbnailUrl is already resolved to http URL by getByIdAdmin
    setThumbnailStorageId(existing.thumbnailUrl ?? "");
    setThumbnailPreview(existing.thumbnailUrl ?? "");
    setFields(existing.fields.map((f) => ({
      label: f.label,
      type: f.type,
      nexrenderLayer: f.nexrenderLayer,
      required: f.required,
      order: f.order,
      maxLength: f.maxLength,
      dimensions: f.dimensions,
    })));
    setInitialized(true);
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    setThumbnailPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      setThumbnailStorageId(storageId);
    } finally {
      setUploading(false);
    }
  }

  function clearThumbnail() {
    setThumbnailStorageId("");
    setThumbnailPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !category || !previewId || !price) {
      setError("Please fill in all required fields (title, category, nexrender template ID, price).");
      return;
    }
    setLoading(true);
    try {
      await upsert({
        templateId: id as Id<"templates"> | undefined,
        title,
        description,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        price: Math.round(parseFloat(price) * 100),
        currency,
        nexrenderComposition: previewId,
        nexrenderCompositionName: previewComp || undefined,
        nexrenderFinalComposition: finalId || undefined,
        nexrenderFinalCompositionName: finalComp || undefined,
        previewVideoUrl: previewVideoUrl || undefined,
        isPublished,
        thumbnailUrl: thumbnailStorageId || undefined,
        fields: fields.map((f) => ({
          ...f,
          maxLength: f.maxLength || undefined,
          dimensions: f.dimensions?.trim() || undefined,
        })),
      });
      navigate("/admin/templates");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function addField() {
    setFields((prev) => [...prev, emptyField(prev.length)]);
  }

  function removeField(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, order: idx })));
  }

  function updateField(i: number, patch: Partial<FieldDraft>) {
    setFields((prev) => prev.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  }

  if (id && existing === undefined) return <AdminLayout><Loading /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">
            {id ? "Edit" : "Create"}
          </p>
          <h1 className="text-2xl font-bold text-white">{id ? "Edit Template" : "New Template"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Template Info ── */}
          <SectionCard title="Template Info">
            <FieldRow label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Corporate Promo" className={inputCls} />
            </FieldRow>
            <FieldRow label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description shown to customers…"
                className={`${inputCls} resize-none`}
              />
            </FieldRow>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Category *">
                <input value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="e.g. Corporate" className={inputCls} />
              </FieldRow>
              <FieldRow label="Tags (comma-separated)">
                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="promo, business, clean" className={inputCls} />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="Price *">
                <input
                  type="number" min="0" step="0.01"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  required placeholder="29.99"
                  className={inputCls}
                />
              </FieldRow>
              <FieldRow label="Currency">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </FieldRow>
            </div>

            {/* ── Thumbnail ── */}
            <FieldRow label="Thumbnail">
              <div className="flex items-center gap-4">
                {/* Preview box */}
                <div className={cn(
                  "w-24 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center",
                  thumbnailPreview ? "bg-[#262626]" : "bg-[#262626] border-2 border-dashed border-white/10"
                )}>
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={18} className="text-gray-600" />
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#262626] text-sm text-gray-300 hover:text-white hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                      <Upload size={13} />
                      {uploading ? "Uploading…" : thumbnailPreview ? "Change" : "Upload image"}
                    </button>
                    {thumbnailPreview && !uploading && (
                      <button
                        type="button"
                        onClick={clearThumbnail}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove thumbnail"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-700">JPG, PNG or WebP. Recommended: 16:9 ratio.</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>
            </FieldRow>

            {/* ── Preview Video ── */}
            <FieldRow label="Preview Video URL">
              <input
                type="url"
                value={previewVideoUrl}
                onChange={(e) => setPreviewVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or direct .mp4 URL"
                className={inputCls}
              />
              <p className="text-xs text-gray-700 mt-1">YouTube must be <span className="text-gray-500">Unlisted</span> (not Private) for embedding.</p>
            </FieldRow>

            {/* ── Publish ── */}
            <label className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors",
              isPublished ? "bg-green-500/10" : "bg-[#262626] hover:bg-[#2a2a2a]"
            )}>
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center shrink-0",
                isPublished ? "bg-green-500" : "bg-[#3a3a3a] border border-white/10"
              )}>
                {isPublished && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="hidden"
              />
              <div>
                <p className={cn("text-sm font-medium", isPublished ? "text-green-400" : "text-gray-400")}>
                  Publish immediately
                </p>
                <p className="text-xs text-gray-600">
                  {isPublished ? "Visible to customers in the template catalog" : "Saved as draft — not visible to customers"}
                </p>
              </div>
            </label>
          </SectionCard>

          {/* ── Nexrender Templates ── */}
          <SectionCard title="Nexrender Templates">
            <p className="text-xs text-gray-600 -mt-2">Two separate nexrender templates — LQ preview for customer approval, HQ final for delivery.</p>

            {/* LQ Preview */}
            <div className="rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">LQ Preview</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Nexrender Template ID *">
                  <input
                    value={previewId}
                    onChange={(e) => setPreviewId(e.target.value)}
                    required
                    placeholder="e.g. 01KM17B27C6WY…"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="AE Composition Name">
                  <input
                    value={previewComp}
                    onChange={(e) => setPreviewComp(e.target.value)}
                    placeholder="e.g. TestCompHD_Preview"
                    className={inputCls}
                  />
                </FieldRow>
              </div>
            </div>

            {/* HQ Final */}
            <div className="rounded-xl bg-green-500/[0.06] border border-green-500/20 p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">HQ Final</p>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Nexrender Template ID">
                  <input
                    value={finalId}
                    onChange={(e) => setFinalId(e.target.value)}
                    placeholder="e.g. 01KM17B27C6WY…"
                    className={inputCls}
                  />
                </FieldRow>
                <FieldRow label="AE Composition Name">
                  <input
                    value={finalComp}
                    onChange={(e) => setFinalComp(e.target.value)}
                    placeholder="e.g. TestCompHD"
                    className={inputCls}
                  />
                </FieldRow>
              </div>
              {!finalId && (
                <p className="text-xs text-green-500/60">If left empty, the LQ preview template is used as fallback for HD renders.</p>
              )}
            </div>
          </SectionCard>

          {/* ── Customization Fields ── */}
          <SectionCard title="Customization Fields">
            <div className="flex flex-col gap-2.5">
              {fields.map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3.5 bg-[#262626] rounded-xl">
                  <GripVertical size={15} className="mt-2.5 text-gray-600 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-2.5">
                    <input
                      placeholder="Label *"
                      value={f.label}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                      className="bg-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                    />
                    <input
                      placeholder="AE Layer name *"
                      value={f.nexrenderLayer}
                      onChange={(e) => updateField(i, { nexrenderLayer: e.target.value })}
                      className="bg-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => updateField(i, { type: e.target.value as FieldType, maxLength: undefined, dimensions: undefined })}
                      className={cn("bg-[#1e1e1e] rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 border", FIELD_TYPE_COLOR[f.type])}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="COLOR">COLOR</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <div className={cn(
                        "w-4 h-4 rounded flex items-center justify-center shrink-0",
                        f.required ? "bg-indigo-500" : "bg-[#333] border border-white/10"
                      )}>
                        {f.required && <span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                      <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="hidden" />
                      Required
                    </label>

                    {/* TEXT: max length */}
                    {f.type === "TEXT" && (
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-xs text-gray-600 shrink-0">Max chars:</span>
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          placeholder="e.g. 100 (optional)"
                          value={f.maxLength ?? ""}
                          onChange={(e) => updateField(i, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="flex-1 bg-[#1e1e1e] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                        />
                      </div>
                    )}

                    {/* IMAGE: dimensions */}
                    {f.type === "IMAGE" && (
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-xs text-gray-600 shrink-0">Dimensions:</span>
                        <input
                          type="text"
                          placeholder="e.g. 1280x720 (optional)"
                          value={f.dimensions ?? ""}
                          onChange={(e) => updateField(i, { dimensions: e.target.value })}
                          className="flex-1 bg-[#1e1e1e] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-gray-600 hover:text-gray-300 hover:border-white/20 transition-colors mt-1"
              >
                <Plus size={13} /> Add Field
              </button>
            </div>
          </SectionCard>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loading ? "Saving…" : id ? "Save Changes" : "Create Template"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/templates")}
              className="px-6 py-3 rounded-xl bg-[#262626] text-sm font-medium text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
