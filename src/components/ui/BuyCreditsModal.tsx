import { X, Zap, Star, Crown, ArrowRight, Coins } from "lucide-react";
import { cn } from "../../lib/utils";

const PACKAGES = [
  {
    id: "basic",
    label: "Basic",
    Icon: Zap,
    credits: 25,
    price: 20,
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/[0.06]",
    badge: "text-[#C3C0FF]",
    iconBg: "bg-indigo-500/10",
    iconColor: "text-[#C3C0FF]",
    popular: false,
  },
  {
    id: "pro",
    label: "Pro",
    Icon: Star,
    credits: 85,
    price: 50,
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.06]",
    badge: "text-amber-400",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    popular: true,
  },
  {
    id: "gold",
    label: "Gold",
    Icon: Crown,
    credits: 300,
    price: 150,
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/[0.06]",
    badge: "text-yellow-400",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    popular: false,
  },
] as const;

interface Props {
  onClose: () => void;
}

export function BuyCreditsModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1e1e1e] rounded-2xl w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-[#2a2a2a]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C3C0FF]/10 flex items-center justify-center">
              <Coins size={17} className="text-[#C3C0FF]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Buy Credits</h2>
              <p className="text-xs text-gray-500 mt-0.5">1 credit = €1 · used for video renders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-[#262626] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Packages */}
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          {PACKAGES.map(({ id, label, Icon, credits, price, border, bg, badge, iconBg, iconColor, popular }) => (
            <div
              key={id}
              className={cn(
                "relative rounded-2xl border p-4 flex flex-col gap-3",
                border, bg,
                popular && "ring-1 ring-amber-500/40"
              )}
            >
              {popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500 text-black whitespace-nowrap">
                  Best value
                </span>
              )}
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
                <Icon size={15} className={iconColor} />
              </div>
              <div>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-0.5", badge)}>{label}</p>
                <p className="text-2xl font-bold text-white leading-none">{credits}</p>
                <p className="text-xs text-gray-600 mt-0.5">credits</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">€{price}</p>
                <p className="text-[10px] text-gray-600">€{(price / credits).toFixed(2)} / credit</p>
              </div>
              <button
                type="button"
                onClick={() => alert("Credit purchase coming soon — please contact support to top up.")}
                className="mt-auto flex items-center justify-center gap-1 w-full py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Buy <ArrowRight size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-700">
            Need a custom package?{" "}
            <a href="mailto:support@vlipgo.com" className="text-gray-500 hover:text-gray-300 transition-colors">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
