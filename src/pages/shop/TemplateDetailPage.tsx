import { useQuery, useConvexAuth } from "convex/react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { Button } from "../../components/ui/Button";
import { FavoriteButton } from "../../components/ui/FavoriteButton";
import { formatPrice, cn } from "../../lib/utils";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

function getYouTubeEmbedId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

const PERKS = [
  "Commercial Use Licensed",
  "Full HD Export Included",
  "Lifetime Cloud Storage",
];

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const template = useQuery(api.templates.getById, {
    templateId: id as Id<"templates">,
  });
  const allTemplates = useQuery(api.templates.listPublished, {});

  if (template === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!template) return <ShopLayout><div className="py-20 text-center text-gray-500">Template not found.</div></ShopLayout>;

  const ytId = template.previewVideoUrl ? getYouTubeEmbedId(template.previewVideoUrl) : null;
  const similar = allTemplates
    ?.filter((t) => t._id !== template._id && t.category === template.category)
    .slice(0, 4) ?? [];

  return (
    <ShopLayout>
      {/* ── Back link ── */}
      <div className="mb-6">
        <Link
          to="/templates"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} /> All Templates
        </Link>
      </div>

      {/* ── 2-col hero ── */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

        {/* ── Left: Preview ── */}
        <div>
          <div className="relative aspect-video bg-[#1e1e1e] rounded-2xl overflow-hidden">
            <span className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide">
              ● PREVIEW
            </span>
            {template.previewVideoUrl && ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?controls=0&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : template.previewVideoUrl ? (
              <video src={template.previewVideoUrl} controls className="w-full h-full object-cover" />
            ) : template.thumbnailUrl ? (
              <img src={template.thumbnailUrl} alt={template.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">No preview available</div>
            )}
          </div>

          {/* Metadata grid */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#1e1e1e] rounded-xl px-5 py-4">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1.5">Category</p>
              <p className="text-sm font-semibold text-white">{template.category}</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl px-5 py-4">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1.5">Orientation</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-block rounded-[3px] border border-white/30",
                  (template.orientation ?? "WIDE") === "WIDE" ? "w-5 h-3" : "w-3 h-5"
                )} />
                <p className="text-sm font-semibold text-white">
                  {(template.orientation ?? "WIDE") === "WIDE" ? "Wide · 16:9" : "Vertical · 9:16"}
                </p>
              </div>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl px-5 py-4">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1.5">Edit Type</p>
              <p className="text-sm font-semibold text-white">Cloud Render</p>
            </div>
            <div className="bg-[#1e1e1e] rounded-xl px-5 py-4">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-medium mb-1.5">Resolution</p>
              <p className="text-sm font-semibold text-white">
                {(template.orientation ?? "WIDE") === "WIDE" ? "1920 × 1080" : "1080 × 1920"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Product info ── */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-3 block">
              Premium Asset
            </span>
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-3xl font-bold text-white leading-tight">{template.title}</h1>
              <FavoriteButton templateId={template._id} className="mt-1.5 shrink-0" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{template.description}</p>
          </div>

          {/* Price card */}
          <div className="bg-[#1e1e1e] rounded-2xl p-5">
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">
                {formatPrice(template.price, template.currency)}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5 mb-5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 text-sm text-gray-400">
                  <CheckCircle2 size={15} className="text-indigo-400 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
            <Link
              to={isAuthenticated ? `/templates/${template._id}/customize` : `/login`}
              className="block"
            >
              <Button size="lg" className="w-full gap-2 justify-center text-base">
                Customize this video <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Customisable fields */}
          {template.fields.length > 0 && (
            <div className="bg-[#1e1e1e] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-3">What you can customize</h2>
              <ul className="flex flex-col gap-2">
                {template.fields.map((f) => (
                  <li key={f._id} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {f.label}
                    <span className="text-xs text-gray-600 ml-auto">{f.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Similar Templates ── */}
      {similar.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Similar Templates</h2>
              <p className="text-sm text-gray-500 mt-1">Expand your project with these hand-picked matches.</p>
            </div>
            <Link to="/templates" className="text-sm text-[#C3C0FF] hover:underline flex items-center gap-1">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map((t) => (
              <Link
                key={t._id}
                to={`/templates/${t._id}`}
                className="group bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-[#222] transition-colors"
              >
                <div className="aspect-video bg-[#262626] overflow-hidden">
                  {t.thumbnailUrl ? (
                    <img
                      src={t.thumbnailUrl}
                      alt={t.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">No preview</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-white group-hover:text-[#C3C0FF] transition-colors truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatPrice(t.price, t.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </ShopLayout>
  );
}
