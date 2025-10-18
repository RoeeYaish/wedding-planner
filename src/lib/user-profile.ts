import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: unknown; // Firestore timestamp
  // New optional fields
  weddingDate?: string | null; // ISO yyyy-mm-dd (from <input type="date">)
  weddingLocation?: string | null;
};

export async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, profile, { merge: true });
  }
  return ref;
}

export function subscribeToUserProfile(
  uid: string,
  cb: (data: UserProfile | null) => void
) {
  const ref = doc(db, "users", uid);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as UserProfile) : null);
  });
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "displayName" | "weddingDate" | "weddingLocation">>
) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
}
