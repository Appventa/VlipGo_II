import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShopLayout } from "../../layouts/ShopLayout";
import { Loading } from "../../components/ui/Loading";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { cn } from "../../lib/utils";
import {
  Camera, Check, Coins, Zap, Star, Crown,
  Mail, User, ArrowRight,
} from "lucide-react";

// ── Credit packages ───────────────────────────────────────────────

const PACKAGES = [
  {
    id: "basic",
    label: "Basic",
    icon: Zap,
    credits: 25,
    price: 20,
    color: "border-indigo-500/30 bg-indigo-500/[0.06]",
    badge: "text-[#C3C0FF]",
    iconColor: "text-[#C3C0FF]",
    popular: false,
  },
  {
    id: "pro",
    label: "Pro",
    icon: Star,
    credits: 85,
    price: 50,
    color: "border-amber-500/30 bg-amber-500/[0.06]",
    badge: "text-amber-400",
    iconColor: "text-amber-400",
    popular: true,
  },
  {
    id: "gold",
    label: "Gold",
    icon: Crown,
    credits: 300,
    price: 150,
    color: "border-yellow-500/30 bg-yellow-500/[0.06]",
    badge: "text-yellow-400",
    iconColor: "text-yellow-400",
    popular: false,
  },
] as const;

// ── ProfilePage ───────────────────────────────────────────────────

export function ProfilePage() {
  const profile = useQuery(api.users.getProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (profile === undefined) return <ShopLayout><Loading /></ShopLayout>;
  if (!profile) return <ShopLayout><div className="py-20 text-center text-gray-500">Not authenticated.</div></ShopLayout>;

  const displayName = name ?? profile.name ?? "";
  const credits = profile.credits ?? 0;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      const { storageId } = await res.json();
      await updateProfile({ avatarStorageId: storageId });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateProfile({ name: displayName });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const avatarUrl = avatarPreview ?? profile.avatarUrl;

  return (
    <ShopLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C3C0FF] mb-1">Account</p>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
        </div>

        {/* ── Avatar + Name card ── */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#C3C0FF] mb-5">Personal Info</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <UserAvatar name={profile.name} avatarUrl={avatarUrl} size="lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-50"
                title="Change avatar"
              >
                {avatarUploading ? (
                  <svg className="animate-spin w-3 h-3 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <Camera size={11} className="text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-white font-semibold">{profile.name ?? "No name set"}</p>
              <p className="text-xs text-gray-500 mt-0.5">Click the camera icon to change your photo</p>
            </div>
          </div>

          {/* Name form */}
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <User size={11} /> Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-[#262626] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-1 focus:ring-[#C3C0FF]/40 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Mail size={11} /> Email
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full bg-[#1a1a1a] rounded-xl px-3 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || displayName === (profile.name ?? "")}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
                  saved
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:brightness-110 disabled:opacity-40"
                )}
              >
                {saved ? <><Check size={13} /> Saved</> : saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Credits card ── */}
        <div className="bg-[#1e1e1e] rounded-2xl p-6" id="credits">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#C3C0FF]">Credits</h2>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold",
              credits === 0
                ? "bg-red-500/15 text-red-400"
                : credits < 5
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-[#262626] text-white"
            )}>
              <Coins size={14} className={credits === 0 ? "text-red-400" : credits < 5 ? "text-amber-400" : "text-[#C3C0FF]"} />
              {credits} credit{credits !== 1 ? "s" : ""}
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-1">
            1 credit = €1 — used to render videos. Each job costs 1 credit for the preview render,
            plus the remaining template price in credits for the final HD render.
          </p>
          {credits === 0 && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-4 mt-3">
              You have no credits. Purchase a package below to start generating videos.
            </p>
          )}

          {/* Packages */}
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            {PACKAGES.map((pkg) => {
              const Icon = pkg.icon;
              const perCredit = (pkg.price / pkg.credits).toFixed(2);
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative rounded-2xl border p-5 flex flex-col gap-3 transition-all",
                    pkg.color,
                    pkg.popular && "ring-1 ring-amber-500/40"
                  )}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500 text-black">
                      Best value
                    </span>
                  )}
                  <div className={cn("w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center", pkg.iconColor)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className={cn("text-xs font-semibold uppercase tracking-widest mb-1", pkg.badge)}>{pkg.label}</p>
                    <p className="text-2xl font-bold text-white">{pkg.credits}</p>
                    <p className="text-xs text-gray-500">credits</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">€{pkg.price}</p>
                    <p className="text-[11px] text-gray-600">€{perCredit} / credit</p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]",
                      "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:brightness-110"
                    )}
                    onClick={() => alert("Credit purchase coming soon — contact support to top up your account.")}
                  >
                    Buy now <ArrowRight size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-700 mt-4 text-center">
            Need a custom package? Contact us at <span className="text-gray-500">support@vlipgo.com</span>
          </p>
        </div>
      </div>
    </ShopLayout>
  );
}
