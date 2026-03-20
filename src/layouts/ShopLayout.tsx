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
    <div className="min-h-screen bg-[#131313]">
      <header className="bg-[#191919]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            Vlip<span className="text-[#C3C0FF]">Go</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/templates" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors">Templates</Link>
            {user ? (
              <>
                <Link to="/orders" className="text-sm text-gray-400 hover:text-[#C3C0FF] transition-colors">My Orders</Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" className="text-sm text-[#C3C0FF] font-medium hover:brightness-110 transition-colors">Admin</Link>
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
