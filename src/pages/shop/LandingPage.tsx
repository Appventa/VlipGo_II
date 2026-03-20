import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Button } from "../../components/ui/Button";
import { formatPrice } from "../../lib/utils";
import { ArrowRight, Clapperboard, Sliders, Download, Zap, ShieldCheck, Star } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Clapperboard,
    title: "Pick a Template",
    desc: "Browse our library of professionally crafted After Effects templates — no AI filler, every frame hand-built.",
  },
  {
    num: "02",
    icon: Sliders,
    title: "Customize It",
    desc: "Enter your text, colors, and images directly in the browser. No software needed.",
  },
  {
    num: "03",
    icon: Download,
    title: "Download Your Video",
    desc: "We render it in the cloud and deliver a full-HD MP4 straight to your downloads.",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "No AI-Slop",
    desc: "Every template is designed and animated by hand. What you see is what you get — no hallucinated motion, no generic outputs.",
  },
  {
    icon: Star,
    title: "Handcrafted Templates",
    desc: "Professional After Effects compositions built for brands, creators, and agencies. Cinema-grade quality at indie prices.",
  },
  {
    icon: Zap,
    title: "Instant Cloud Renders",
    desc: "Submit your customization and get a full-HD render delivered in minutes — no queue times, no waiting around.",
  },
  {
    icon: Clapperboard,
    title: "Preview Before You Pay",
    desc: "We generate a free low-quality preview first. Approve it, then we render the final HD version. Zero surprises.",
  },
];

export function LandingPage() {
  const templates = useQuery(api.templates.listPublished, {});
  const featured = templates?.slice(0, 4) ?? [];

  return (
    <ShopLayout>
      {/* ── Hero ── */}
      <section className="relative -mx-4 px-4 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative">
          {/* Left: copy */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#C3C0FF] bg-indigo-600/15 border border-[#C3C0FF]/20 px-3 py-1 rounded-full mb-5">
              <Zap size={11} /> Professional video templates, on demand
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-5">
              Elevate Your<br />
              <span className="text-[#C3C0FF]">Content.</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-md">
              Pick a cinematic template, customize it in seconds, and get a studio-quality video rendered in the cloud — no software, no skills required.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/templates">
                <Button size="lg" className="gap-2">
                  Browse Templates <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-600">Free preview render included — pay only when you love it.</p>
          </div>

          {/* Right: hero image */}
          <div className="relative flex justify-center">
            <div className="relative rounded-2xl overflow-hidden bg-[#f0f0f0]/5 shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
              <img
                src="/hero_img.jpeg"
                alt="VlipGo — Professional video templates"
                className="w-full max-w-lg object-cover"
                draggable={false}
              />
              {/* bottom fade into page bg */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#131313] to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">From template to download in minutes</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <div key={num} className="relative bg-[#1e1e1e] rounded-2xl p-7">
              <span className="absolute top-6 right-6 text-4xl font-black text-white/[0.04] select-none">{num}</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-5">
                <Icon size={18} className="text-[#C3C0FF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-3">Why VlipGo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Built differently, on purpose</h2>
          <p className="mt-3 text-gray-500 max-w-xl mx-auto">
            We don't generate videos with AI. We render your customized data inside real, hand-crafted After Effects templates.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#1e1e1e] rounded-2xl p-7 flex gap-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={18} className="text-[#C3C0FF]" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Templates ── */}
      {featured.length > 0 && (
        <section className="py-20 max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-3">Templates</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Popular right now</h2>
            </div>
            <Link to="/templates" className="text-sm text-[#C3C0FF] hover:underline hidden sm:flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((t) => (
              <Link
                key={t._id}
                to={`/templates/${t._id}`}
                className="group bg-[#1e1e1e] rounded-xl overflow-hidden hover:bg-[#222222] transition-colors"
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
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-[#C3C0FF] transition-colors leading-snug">{t.title}</h3>
                    <span className="text-sm font-bold text-[#C3C0FF] whitespace-nowrap">{formatPrice(t.price, t.currency)}</span>
                  </div>
                  <span className="inline-block text-xs bg-[#262626] text-gray-500 px-2 py-0.5 rounded-full">{t.category}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 sm:hidden text-center">
            <Link to="/templates">
              <Button variant="secondary">View all templates <ArrowRight size={14} className="ml-1" /></Button>
            </Link>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      <section className="py-20 max-w-6xl mx-auto">
        <div className="relative rounded-2xl bg-indigo-600/10 border border-[#C3C0FF]/10 overflow-hidden px-8 py-14 text-center">
          {/* glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-indigo-600/15 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to create something cinematic?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Join VlipGo today. Create a free account, pick your template, and get a preview render instantly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Start for Free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/templates">
                <Button variant="secondary" size="lg">Browse Templates</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ShopLayout>
  );
}
