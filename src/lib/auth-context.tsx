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
    // Subscribe to auth state and then to the user's profile doc.
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);

      // Clean previous profile sub
      setProfile(null);

      if (u) {
        try {
          await ensureUserDoc(u);
          const unsubscribeProfile = subscribeToUserProfile(u.uid, setProfile);
          // Return a cleanup for this branch
          return () => unsubscribeProfile();
        } catch (e) {
          console.error("[Auth] ensureUserDoc failed:", e);
        }
      }
    });

    return () => unsubscribeAuth();
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
    await signOut(auth);
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
