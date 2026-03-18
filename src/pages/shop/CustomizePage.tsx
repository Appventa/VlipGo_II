import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatPrice } from "../../lib/utils";

export function CustomizePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const template = useQuery(api.templates.getById, { templateId: id as Id<"templates"> });
  const createJob = useMutation(api.jobs.create);
  const generateUploadUrl = useMutation(api.jobs.generateUploadUrl);

  const [values, setValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ytId = useMemo(() => {
    if (!template?.previewVideoUrl) return null;
    const m = template.previewVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }, [template?.previewVideoUrl]);

  if (template === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!template) return <ShopLayout><div className="py-20 text-center text-gray-500">Template not found.</div></ShopLayout>;

  function setValue(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleImageUpload(fieldId: string, file: File) {
    setUploading((prev) => ({ ...prev, [fieldId]: true }));
    try {
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
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

    // Validate required fields
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
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ShopLayout>
      <div className="max-w-xl mx-auto">
        {template.previewVideoUrl && (
          <div className="aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden mb-6">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={template.previewVideoUrl} controls className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Customize: {template.title}</h1>
          <p className="text-gray-400 mt-1">Fill in your details below. We'll render a quick preview first.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-[#1a1a1a] rounded-xl border border-white/[0.08] p-6 flex flex-col gap-5">
            {template.fields.map((field) => (
              <div key={field._id}>
                {field.type === "TEXT" && (
                  <Input
                    id={field._id}
                    label={field.label + (field.required ? " *" : "")}
                    value={values[field._id] ?? ""}
                    onChange={(e) => setValue(field._id, e.target.value)}
                    required={field.required}
                  />
                )}

                {field.type === "COLOR" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-300">
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={values[field._id] ?? "#000000"}
                        onChange={(e) => setValue(field._id, e.target.value)}
                        className="h-10 w-16 rounded border border-white/[0.12] cursor-pointer bg-transparent"
                      />
                      <span className="text-sm text-gray-400 font-mono">{values[field._id] ?? "#000000"}</span>
                    </div>
                  </div>
                )}

                {field.type === "IMAGE" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-300">
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            setError("Image must be under 10MB.");
                            return;
                          }
                          handleImageUpload(field._id, file);
                        }
                      }}
                      className="text-sm text-gray-400"
                    />
                    {uploading[field._id] && <span className="text-xs text-blue-400">Uploading…</span>}
                    {values[field._id] && !uploading[field._id] && (
                      <span className="text-xs text-green-400">✓ Image ready</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="bg-blue-600/10 rounded-xl border border-blue-500/20 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-white">{template.title}</p>
              <p className="text-sm text-gray-400">One-time payment</p>
            </div>
            <span className="text-2xl font-bold text-blue-400">
              {formatPrice(template.price, template.currency)}
            </span>
          </div>

          <Button type="submit" size="lg" loading={loading}>
            Get Preview →
          </Button>
        </form>
      </div>
    </ShopLayout>
  );
}
