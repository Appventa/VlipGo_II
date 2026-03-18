import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { AdminLayout } from "../../layouts/AdminLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Plus, Trash2, GripVertical } from "lucide-react";

type FieldType = "TEXT" | "IMAGE" | "COLOR";

interface FieldDraft {
  label: string;
  type: FieldType;
  nexrenderLayer: string;
  required: boolean;
  order: number;
}

function emptyField(order: number): FieldDraft {
  return { label: "", type: "TEXT", nexrenderLayer: "", required: true, order };
}

export function AdminNewTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const upsert = useMutation(api.templates.upsert);
  const generateUploadUrl = useMutation(api.templates.generateUploadUrl);
  const existing = useQuery(
    api.templates.getByIdAdmin,
    id ? { templateId: id as Id<"templates"> } : "skip"
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [composition, setComposition] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
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
    setPrice(String(existing.price));
    setCurrency(existing.currency);
    setComposition(existing.nexrenderComposition);
    setIsPublished(existing.isPublished);
    setThumbnailUrl(existing.thumbnailUrl ?? "");
    setFields(existing.fields.map((f) => ({
      label: f.label,
      type: f.type,
      nexrenderLayer: f.nexrenderLayer,
      required: f.required,
      order: f.order,
    })));
    setInitialized(true);
  }

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: "POST", body: file, headers: { "Content-Type": file.type } });
      const { storageId } = await res.json();
      setThumbnailUrl(storageId);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title || !category || !composition || !price) {
      setError("Please fill in all required fields.");
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
        nexrenderComposition: composition,
        isPublished,
        thumbnailUrl: thumbnailUrl || undefined,
        fields,
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{id ? "Edit Template" : "New Template"}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Metadata */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-700">Template Info</h2>
            <Input id="title" label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="category" label="Category *" value={category} onChange={(e) => setCategory(e.target.value)} required />
              <Input id="tags" label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="price" label="Price (e.g. 29.99) *" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <Input id="composition" label="Nexrender Composition path/URL *" value={composition} onChange={(e) => setComposition(e.target.value)} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Thumbnail</label>
              <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="text-sm" />
              {uploading && <span className="text-xs text-blue-500">Uploading…</span>}
              {thumbnailUrl && !uploading && <span className="text-xs text-green-600">✓ Thumbnail saved</span>}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded" />
              <span className="font-medium text-gray-700">Publish immediately</span>
            </label>
          </div>

          {/* Fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">Customization Fields</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addField}>
                <Plus size={14} className="mr-1" /> Add Field
              </Button>
            </div>
            <div className="flex flex-col gap-3">
              {fields.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <GripVertical size={16} className="mt-2 text-gray-300 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      placeholder="Label *"
                      value={f.label}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      placeholder="AE Layer name *"
                      value={f.nexrenderLayer}
                      onChange={(e) => updateField(i, { nexrenderLayer: e.target.value })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="IMAGE">IMAGE</option>
                      <option value="COLOR">COLOR</option>
                    </select>
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                      Required
                    </label>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeField(i)}>
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" loading={loading} size="lg">{id ? "Save Changes" : "Create Template"}</Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/admin/templates")}>Cancel</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
