import { useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type DashboardKpis = {
  nextSteps: { total: number; upcoming: number };
  todos: { open: number; done: number };
  budget: { remaining: number; limit: number; spent: number };
  vendors: { payments: number; pending: number; booked: number };
  guests: { total: number; declined: number; accepted: number };
  timeline: { count: number; nextInMinutes: number | null };
};

const ZERO: DashboardKpis = {
  nextSteps: { total: 0, upcoming: 0 },
  todos: { open: 0, done: 0 },
  budget: { remaining: 0, limit: 0, spent: 0 },
  vendors: { payments: 0, pending: 0, booked: 0 },
  guests: { total: 0, declined: 0, accepted: 0 },
  timeline: { count: 0, nextInMinutes: null },
};


export function useDashboardKpis(uid: string | null | undefined) {
  const [kpis, setKpis] = useState<DashboardKpis>(ZERO);

  useEffect(() => {
    if (!uid) {
      setKpis(ZERO);
      return;
    }

    const unsubscribers: Array<() => void> = [];

    // TODOS: lightweight listener counting completed vs open
    try {
      const todosCol = collection(db, "users", uid, "todos");
      const qAll = query(todosCol);
      const unsubTodos = onSnapshot(qAll, (snap) => {
        let open = 0;
        let done = 0;
        snap.forEach((d) => {
          const data = d.data() as unknown;
          const obj = data as Record<string, unknown>;
          if (obj?.completed as boolean) done += 1;
          else open += 1;
        });
        setKpis((prev) => ({ ...prev, todos: { open, done } }));
      });
      unsubscribers.push(unsubTodos);
    } catch (err) {
      console.warn("useDashboardKpis: todos listener setup failed", err);
    }

    // GUESTS: total, accepted, declined
    try {
      const guestsCol = collection(db, "users", uid, "guests");
      const unsubGuests = onSnapshot(guestsCol, (snap) => {
        let total = 0;
        let accepted = 0;
        let declined = 0;
        snap.forEach((d) => {
          total += 1;
          const data = d.data() as unknown;
          const obj = data as Record<string, unknown>;
          if (obj?.status === "accepted") accepted += 1;
          if (obj?.status === "declined") declined += 1;
        });
        setKpis((prev) => ({ ...prev, guests: { total, accepted, declined } }));
      });
      unsubscribers.push(unsubGuests);
    } catch (err) {
      console.warn("useDashboardKpis: guests listener setup failed", err);
    }

    // VENDORS: paymentStatus and bookingStatus counts
    try {
      const vendorsCol = collection(db, "users", uid, "vendors");
      const unsubVendors = onSnapshot(vendorsCol, (snap) => {
        let payments = 0;
        let pending = 0;
        let booked = 0;
        snap.forEach((d) => {
          const data = d.data() as unknown;
          const obj = data as Record<string, unknown>;
          if (obj?.paymentStatus === "paid") payments += 1;
          if (obj?.paymentStatus === "pending") pending += 1;
          if (obj?.bookingStatus === "booked" || obj?.status === "booked") booked += 1;
        });
        setKpis((prev) => ({ ...prev, vendors: { payments, pending, booked } }));
      });
      unsubscribers.push(unsubVendors);
    } catch (err) {
      console.warn("useDashboardKpis: vendors listener setup failed", err);
    }

    // NEXT STEPS: count total vs upcoming (date >= now)
    try {
      const stepsCol = collection(db, "users", uid, "nextSteps");
      const unsubSteps = onSnapshot(stepsCol, (snap) => {
        let total = 0;
        let upcoming = 0;
        const now = new Date();
        snap.forEach((d) => {
          total += 1;
          const data = d.data() as unknown;
          const obj = data as Record<string, unknown>;
          if (obj?.date) {
            const maybe = obj.date as unknown;
            const dt = maybe instanceof Timestamp ? maybe.toDate() : new Date(maybe as string);
            if (dt >= now) upcoming += 1;
          }
        });
        setKpis((prev) => ({ ...prev, nextSteps: { total, upcoming } }));
      });
      unsubscribers.push(unsubSteps);
    } catch (err) {
      console.warn("useDashboardKpis: nextSteps listener setup failed", err);
    }

    // BUDGET: listen to budget summary doc and small snapshot of expenses (only amounts)
    try {
      const summaryRef = doc(db, "users", uid, "budget", "summary");
      const unsubBudget = onSnapshot(summaryRef, async (snap) => {
        const limit = snap.exists() ? (snap.data()?.limit ?? 0) : 0;
        // get a light snapshot of expenses: only read amount fields via a query snapshot
        const expensesCol = collection(db, "users", uid, "budgetExpenses");
        const q = query(expensesCol);
        const expSnap = await getDocs(q);
        let spent = 0;
        expSnap.forEach((d) => {
          const data = d.data() as unknown;
          const obj = data as Record<string, unknown>;
          const amt = Number((obj.amount as number) ?? 0) || 0;
          spent += amt;
        });
        const remaining = Math.max(limit - spent, 0);
        setKpis((prev) => ({ ...prev, budget: { remaining, limit, spent } }));
      });
      unsubscribers.push(unsubBudget);
      } catch (err) {
        console.warn("useDashboardKpis: budget expense read failed", err);
      }

    // TIMELINE: count and nextInMinutes
    try {
      const timelineCol = collection(db, "users", uid, "timeline");
      const unsubTimeline = onSnapshot(timelineCol, async (snap) => {
        const count = snap.size;
        // find next event after now
        const now = new Date();
        const q = query(timelineCol, where("time", ">", now), orderBy("time", "asc"), limit(1));
        try {
          const nextSnap = await getDocs(q);
          let nextInMinutes: number | null = null;
          if (!nextSnap.empty) {
            const data = nextSnap.docs[0].data() as unknown;
            const obj = data as Record<string, unknown>;
            const maybe = obj.time as unknown;
            const t = maybe instanceof Timestamp ? maybe.toDate() : new Date(maybe as string);
            if (t && !isNaN(t.getTime())) {
              nextInMinutes = Math.max(0, Math.round((t.getTime() - Date.now()) / 60000));
            }
          }
          setKpis((prev) => ({ ...prev, timeline: { count, nextInMinutes } }));
        } catch (err) {
          console.warn("useDashboardKpis: timeline next event read failed", err);
          setKpis((prev) => ({ ...prev, timeline: { count, nextInMinutes: null } }));
        }
      });
      unsubscribers.push(unsubTimeline);
    } catch (err) {
      console.warn("useDashboardKpis: timeline listener setup failed", err);
    }

    // Cleanup on unmount or uid change
    return () => {
      unsubscribers.forEach((u) => {
        try {
          u();
        } catch (err) {
          console.warn("useDashboardKpis: unsubscribe failed", err);
        }
      });
    };
  }, [uid]);

  return kpis;
}
