import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // While checking auth, show a minimal placeholder (prevents flashing)
  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-neutral-500">Loading...</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
