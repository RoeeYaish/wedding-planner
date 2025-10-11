import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import EnvBanner from "@/components/EnvBanner";

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleClick = async () => {
    setBusy(true);
    console.log("[Login] Sign-in button clicked");
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("[Login] signInWithGoogle failed:", e);
      alert("Sign-in failed. See console for details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-neutral-100">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">Wedding Planner</h1>
        <p className="text-neutral-600">Sign in with Google to continue</p>
        <button
          onClick={handleClick}
          disabled={busy}
          className="px-4 py-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {busy ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
      <EnvBanner />
    </main>
  );
}
