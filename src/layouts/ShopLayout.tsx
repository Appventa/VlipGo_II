import { Link, useNavigate } from "react-router-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../components/ui/Button";

export function ShopLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <header className="bg-[#141414] border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            Vlip<span className="text-blue-500">Go</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/templates" className="text-sm text-gray-400 hover:text-white transition-colors">Templates</Link>
            {user ? (
              <>
                <Link to="/orders" className="text-sm text-gray-400 hover:text-white transition-colors">My Orders</Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" className="text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">Admin</Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
