import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ensureUserDoc, subscribeToUserProfile, type UserProfile } from "@/lib/user-profile";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // clear previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      setProfile(null);

      if (u) {
        try {
          await ensureUserDoc(u);
          unsubscribeProfile = subscribeToUserProfile(u.uid, setProfile);
        } catch (e) {
          console.error("[Auth] ensureUserDoc failed:", e);
        }
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn("[Auth] Popup failed, falling back to redirect:", err);
      await signInWithRedirect(auth, googleProvider);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Use hard redirect so this works even when AuthProvider is outside <Router/>
      window.location.replace("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, profile, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
