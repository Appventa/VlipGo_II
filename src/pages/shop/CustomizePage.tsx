import { useState } from "react";
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customize: {template.title}</h1>
          <p className="text-gray-500 mt-1">Fill in your details below. Renders in ~5–8 min.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
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
                    <label className="text-sm font-medium text-gray-700">
                      {field.label}{field.required ? " *" : ""}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={values[field._id] ?? "#000000"}
                        onChange={(e) => setValue(field._id, e.target.value)}
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 font-mono">{values[field._id] ?? "#000000"}</span>
                    </div>
                  </div>
                )}

                {field.type === "IMAGE" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
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
                      className="text-sm"
                    />
                    {uploading[field._id] && <span className="text-xs text-blue-500">Uploading…</span>}
                    {values[field._id] && !uploading[field._id] && (
                      <span className="text-xs text-green-600">✓ Image ready</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{template.title}</p>
              <p className="text-sm text-gray-500">One-time payment</p>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(template.price, template.currency)}
            </span>
          </div>

          <Button type="submit" size="lg" loading={loading}>
            Submit & Start Render →
          </Button>
        </form>
      </div>
    </ShopLayout>
  );
}
