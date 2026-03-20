import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { cn } from "../lib/utils";
import { LayoutDashboard, FileVideo, Users, LogOut } from "lucide-react";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/templates", label: "Templates", icon: FileVideo },
  { to: "/admin/users", label: "Users", icon: Users },
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
    <div className="min-h-screen flex bg-[#131313]">
      <aside className="w-56 bg-[#191919] text-white flex flex-col">
        <div className="h-16 flex items-center px-6">
          <span className="font-bold text-lg tracking-tight">
            Vlip<span className="text-[#C3C0FF]">Go</span>
            <span className="text-gray-600 text-sm font-normal ml-1.5">admin</span>
          </span>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-all relative",
                  active
                    ? "bg-indigo-600/15 text-[#C3C0FF]"
                    : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
                )}
              >
                {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-indigo-500 rounded-r" />}
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-4 text-sm text-gray-600 hover:text-gray-200 hover:bg-white/[0.04] transition-colors"
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
