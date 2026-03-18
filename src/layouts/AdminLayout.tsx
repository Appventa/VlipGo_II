import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "../lib/utils";
import { LayoutDashboard, FileVideo, Briefcase, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/templates", label: "Templates", icon: FileVideo },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-[#0f0f0f]">
      <aside className="w-56 bg-[#141414] border-r border-white/[0.06] text-white flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <span className="font-bold text-lg tracking-tight">
            Vlip<span className="text-blue-500">Go</span>
            <span className="text-gray-500 text-sm font-normal ml-1.5">admin</span>
          </span>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                  active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors border-t border-white/[0.06]"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
