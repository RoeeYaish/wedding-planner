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
  category?: string | null;
  seats?: number | null;
  phone?: string | null;
  rsvpStatus: "pending" | "accepted" | "declined";
  invited: boolean;
  notes?: string | null;
  statusRaw?: string | null;
  email?: string | null;
  createdAt?: unknown;
};

type GuestInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  invited?: boolean | null;
  rsvpStatus?: "pending" | "accepted" | "declined" | null;
  seats?: number | null;
  category?: string | null;
  notes?: string | null;
  statusRaw?: string | null;
};

type GuestUpdate = Partial<GuestInput>;

const toOptionalString = (value?: string | null) => {
  if (value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return undefined;
};

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
  const name = (data.name ?? "").trim();
  if (!name) return;

  let safeSeats: number | null = null;
  if (typeof data.seats === "number" && Number.isFinite(data.seats) && data.seats > 0) {
    safeSeats = Math.round(data.seats);
  }

  const rsvpStatus = data.rsvpStatus ?? "pending";
  const invited = typeof data.invited === "boolean" ? data.invited : rsvpStatus !== "pending";

  const payload: Omit<Guest, "id"> = {
    name,
    email: toOptionalString(data.email),
    phone: toOptionalString(data.phone),
    invited,
    rsvpStatus,
    seats: safeSeats,
    createdAt: serverTimestamp(),
    category: toOptionalString(data.category),
    notes: toOptionalString(data.notes),
    statusRaw: toOptionalString(data.statusRaw),
  };

  await addDoc(guestsCollection(uid), payload);
}

export async function updateGuest(uid: string, id: string, data: GuestUpdate) {
  const ref = doc(db, "users", uid, "guests", id);
  const payload: Record<string, unknown> = {};

  if (data.email !== undefined) payload.email = toOptionalString(data.email);
  if (data.phone !== undefined) payload.phone = toOptionalString(data.phone);
  if (data.invited !== undefined && data.invited !== null) payload.invited = data.invited;
  if (data.rsvpStatus !== undefined && data.rsvpStatus !== null) payload.rsvpStatus = data.rsvpStatus;
  if (data.seats !== undefined) {
    if (data.seats === null) {
      payload.seats = null;
    } else {
      const seats = Number(data.seats);
      payload.seats = Number.isFinite(seats) && seats > 0 ? Math.round(seats) : null;
    }
  }
  if (data.category !== undefined) payload.category = toOptionalString(data.category);
  if (data.notes !== undefined) payload.notes = toOptionalString(data.notes);
  if (data.statusRaw !== undefined) payload.statusRaw = toOptionalString(data.statusRaw);
  if (data.name !== undefined) payload.name = data.name;

  await updateDoc(ref, payload);
}

export async function deleteGuest(uid: string, id: string) {
  const ref = doc(db, "users", uid, "guests", id);
  await deleteDoc(ref);
}
