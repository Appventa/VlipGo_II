import { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/Button";
import { NotificationBell } from "../components/ui/NotificationBell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useCreditsModal } from "../contexts/CreditsModalContext";
import { cn } from "../lib/utils";
import { Coins, User, LogOut, ChevronDown, ShieldCheck } from "lucide-react";

// ── Credits chip ─────────────────────────────────────────────────

function CreditsChip({ credits }: { credits: number }) {
  const { openBuyCredits } = useCreditsModal();
  const low = credits === 0;
  const warn = credits > 0 && credits < 5;
  return (
    <button
      type="button"
      onClick={openBuyCredits}
      title="Credits — click to top up"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
        low
          ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
          : warn
            ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
            : "bg-[#262626] text-gray-300 hover:bg-[#2e2e2e]"
      )}
    >
      <Coins size={12} className={low ? "text-red-400" : warn ? "text-amber-400" : "text-[#C3C0FF]"} />
      {credits}
    </button>
  );
}

// ── User dropdown ─────────────────────────────────────────────────

interface UserMenuProps {
  name?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  onSignOut: () => void;
}

function UserMenu({ name, avatarUrl, isAdmin, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-full focus:outline-none hover:ring-2 hover:ring-[#C3C0FF]/20 transition-all"
      >
        <UserAvatar name={name} avatarUrl={avatarUrl} size="sm" />
        <ChevronDown
          size={11}
          className={cn("text-gray-500 transition-transform duration-150 ml-0.5", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-[#1e1e1e] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-[#2a2a2a] overflow-hidden z-50">
          {name && (
            <div className="px-3 py-2.5 border-b border-[#2a2a2a]">
              <p className="text-xs font-semibold text-white truncate">{name}</p>
            </div>
          )}
          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#262626] transition-colors"
            >
              <User size={13} /> My Profile
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#C3C0FF] hover:bg-indigo-500/10 transition-colors"
              >
                <ShieldCheck size={13} /> Admin Panel
              </Link>
            )}
            <div className="border-t border-[#2a2a2a] my-1" />
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────

function ShopLayoutInner({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuthActions();
  const profile = useQuery(api.users.getProfile);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col">
      <header className="bg-[#191919]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
          {/* Left: Logo */}
          <Link to="/">
            <img src="/logo.png" alt="VlipGo" className="h-8 w-auto" draggable={false} />
          </Link>

          {/* Center: Dashboard + Templates */}
          <div className="flex items-center justify-center gap-1">
            {profile && (
              <>
                <Link to="/dashboard" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1 hidden sm:block">Dashboard</Link>
                <Link to="/templates" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1 hidden sm:block">Templates</Link>
              </>
            )}
          </div>

          {/* Right: My Orders + Bell | Credits + Avatar */}
          <div className="flex items-center justify-end gap-2">
            {profile ? (
              <>
                <Link to="/orders" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1 hidden sm:block">My Orders</Link>
                <NotificationBell />
                <div className="w-px h-4 bg-white/10 hidden sm:block mx-1" />
                <CreditsChip credits={profile.credits ?? 0} />
                <UserMenu
                  name={profile.name}
                  avatarUrl={profile.avatarUrl}
                  isAdmin={profile.role === "ADMIN"}
                  onSignOut={handleSignOut}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1">Sign In</Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">{children}</main>

      <footer className="bg-[#191919]/60 border-t border-white/[0.04] mt-8">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/">
            <img src="/logo.png" alt="VlipGo" className="h-7 w-auto opacity-80" draggable={false} />
          </Link>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <Link to="/templates" className="hover:text-gray-400 transition-colors">Templates</Link>
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          </div>
          <p className="text-xs text-gray-700">© {new Date().getFullYear()} VlipGo Video Platforms Inc.</p>
        </div>
      </footer>
    </div>
  );
}

export function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopLayoutInner>{children}</ShopLayoutInner>;
}
