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
    <div className="min-h-screen bg-[#131313] flex flex-col">
      <header className="bg-[#191919]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <img src="/logo.png" alt="VlipGo" className="h-8 w-auto" draggable={false} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-4">
            {user ? (
              <>
                <Link to="/orders" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1">My Orders</Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" className="text-sm text-[#C3C0FF] font-medium hover:brightness-110 transition-colors px-2 py-1">Admin</Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign out</Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors px-2 py-1">Sign In</Link>
                <Link to="/register">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </nav>
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
