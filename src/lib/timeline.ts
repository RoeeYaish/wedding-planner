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

export type TimelineEvent = {
  id: string;
  title: string;
  time: string;
  orderKey: number;
  durationMinutes?: number | null;
  location?: string | null;
  contact?: string | null;
  notes?: string | null;
  createdAt?: any;
};

export function timelineCol(uid: string) {
  return collection(db, "users", uid, "timeline");
}

export function subscribeTimeline(uid: string, cb: (events: TimelineEvent[]) => void) {
  const q = query(
    timelineCol(uid),
    orderBy("orderKey", "asc"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const out: TimelineEvent[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    cb(out);
  });
}

export function assertValidTimeHHmm(value: string) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) throw new Error("Invalid time; use HH:mm");
}

export function minutesSinceMidnight(timeHHmm: string) {
  const [hh, mm] = timeHHmm.split(":").map(Number);
  return hh * 60 + mm;
}

export async function addTimelineEvent(
  uid: string,
  data: Omit<TimelineEvent, "id" | "orderKey" | "createdAt">
) {
  assertValidTimeHHmm(data.time);
  const payload: Record<string, unknown> = {
    ...data,
    orderKey: minutesSinceMidnight(data.time),
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
  return addDoc(timelineCol(uid), payload);
}

export async function updateTimelineEvent(
  uid: string,
  id: string,
  patch: Partial<TimelineEvent>
) {
  const ref = doc(db, "users", uid, "timeline", id);
  const cleaned: Record<string, unknown> = { ...patch };
  if (cleaned.time) {
    const time = String(cleaned.time);
    assertValidTimeHHmm(time);
    cleaned.orderKey = minutesSinceMidnight(time);
  }
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

export async function deleteTimelineEvent(uid: string, id: string) {
  const ref = doc(db, "users", uid, "timeline", id);
  await deleteDoc(ref);
}
