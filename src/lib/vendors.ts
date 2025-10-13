import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type VendorStatus = "pending" | "contacted" | "booked" | "canceled";

export type Vendor = {
  id: string;
  name: string;
  serviceType?: string | null;
  phone?: string | null;
  budgetEstimate?: number | null;
  status?: VendorStatus | null;
  notes?: string | null;
  createdAt?: any;
};

export function vendorsCol(uid: string) {
  return collection(db, "users", uid, "vendors");
}

export function subscribeVendors(uid: string, cb: (vendors: Vendor[]) => void) {
  const q = query(vendorsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const out: Vendor[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    cb(out);
  });
}

export async function addVendor(uid: string, data: Omit<Vendor, "id" | "createdAt">) {
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: serverTimestamp(),
  };
  for (const key of Object.keys(payload)) {
    const value = payload[key];
    if (value === undefined) {
      delete payload[key];
    } else if (typeof value === "string" && value.trim() === "") {
      delete payload[key];
    }
  }
  return addDoc(vendorsCol(uid), payload);
}

export async function updateVendor(uid: string, id: string, patch: Partial<Vendor>) {
  const ref = doc(db, "users", uid, "vendors", id);
  const cleaned: Record<string, unknown> = { ...patch };
  for (const key of Object.keys(cleaned)) {
    const value = cleaned[key];
    if (value === undefined) {
      delete cleaned[key];
    } else if (typeof value === "string" && value.trim() === "") {
      cleaned[key] = null;
    }
  }
  await updateDoc(ref, cleaned);
}

export async function deleteVendor(uid: string, id: string) {
  const ref = doc(db, "users", uid, "vendors", id);
  await deleteDoc(ref);
}
