import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type Guest = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  invited: boolean;
  rsvpStatus: "pending" | "accepted" | "declined";
  seats: number;
  createdAt?: any;
  category?: string;
  notes?: string;
  statusRaw?: string;
};

type GuestInput = {
  name: string;
  email?: string;
  phone?: string;
  invited?: boolean;
  rsvpStatus?: "pending" | "accepted" | "declined";
  seats?: number;
  category?: string;
  notes?: string;
  statusRaw?: string;
};

type GuestUpdate = Partial<Omit<GuestInput, "name">>;

function guestsCollection(uid: string) {
  return collection(db, "users", uid, "guests");
}

export function subscribeGuests(
  uid: string,
  cb: (guests: Guest[]) => void,
  onError?: (error: unknown) => void
) {
  const q = query(guestsCollection(uid), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      const items: Guest[] = [];
      snap.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Guest, "id">),
        });
      });
      cb(items);
    },
    (err) => onError?.(err)
  );
}

export async function addGuest(uid: string, data: GuestInput) {
  const name = data.name.trim();
  if (!name) return;
  const seatsNum = Number(data.seats);
  const safeSeats = Number.isFinite(seatsNum) && seatsNum > 0 ? Math.round(seatsNum) : 1;
  const payload: Omit<Guest, "id"> = {
    name,
    email: data.email?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    invited: data.invited ?? false,
    rsvpStatus: data.rsvpStatus ?? "pending",
    seats: safeSeats,
    createdAt: serverTimestamp(),
    category: data.category?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    statusRaw: data.statusRaw?.trim() || undefined,
  };
  await addDoc(guestsCollection(uid), payload);
}

export async function updateGuest(uid: string, id: string, data: GuestUpdate) {
  const ref = doc(db, "users", uid, "guests", id);
  const payload: Record<string, unknown> = {};
  if (data.email !== undefined) payload.email = data.email?.trim() || undefined;
  if (data.phone !== undefined) payload.phone = data.phone?.trim() || undefined;
  if (data.invited !== undefined) payload.invited = data.invited;
  if (data.rsvpStatus !== undefined) payload.rsvpStatus = data.rsvpStatus;
  if (data.seats !== undefined) {
    const seats = Number(data.seats);
    payload.seats = Number.isFinite(seats) && seats > 0 ? Math.round(seats) : 1;
  }
  if (data.category !== undefined) payload.category = data.category?.trim() || undefined;
  if (data.notes !== undefined) payload.notes = data.notes?.trim() || undefined;
  if (data.statusRaw !== undefined) payload.statusRaw = data.statusRaw?.trim() || undefined;
  await updateDoc(ref, payload);
}

export async function deleteGuest(uid: string, id: string) {
  const ref = doc(db, "users", uid, "guests", id);
  await deleteDoc(ref);
}
