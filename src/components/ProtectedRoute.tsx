import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { Navigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { Loading } from "./ui/Loading";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "CUSTOMER";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);

  if (isLoading || (isAuthenticated && user === undefined)) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "ADMIN" && user?.role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  // Block frozen/banned customers (admins are never blocked)
  if (user?.role !== "ADMIN" && (user?.status === "FROZEN" || user?.status === "BANNED")) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center p-6">
        <div className="bg-[#1e1e1e] rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-400 text-xl">⊘</span>
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Account Restricted</h2>
          <p className="text-gray-500 text-sm">
            {user.status === "BANNED"
              ? "Your account has been banned. Please contact support."
              : "Your account has been temporarily frozen. Please contact support."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
