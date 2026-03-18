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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600">VlipGo</Link>
          <nav className="flex items-center gap-4">
            <Link to="/templates" className="text-sm text-gray-600 hover:text-gray-900">Templates</Link>
            {user ? (
              <>
                <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900">My Orders</Link>
                {user.role === "ADMIN" && (
                  <Link to="/admin" className="text-sm text-blue-600 font-medium">Admin</Link>
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
