import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign-In popup failed:", err?.code || err?.message || err);
      // Known production issues: "auth/popup-blocked", "auth/unauthorized-domain"
      // Fallback to redirect (more reliable on some browsers/ad-blockers)
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (e) {
        console.error("Google Sign-In redirect also failed:", e);
        alert("Sign-in failed. Please check Authorized Domains & try again.");
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
