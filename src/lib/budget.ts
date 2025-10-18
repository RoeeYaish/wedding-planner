import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type BudgetDoc = {
  limit: number; // overall budget limit
  currency: string; // e.g., "USD"
};

export type Expense = {
  id: string;
  name: string;
  amount: number; // positive number
  createdAt?: unknown; // Firestore Timestamp
};

export function budgetDocRef(uid: string) {
  return doc(db, "users", uid, "budget", "summary");
}

export function expensesColRef(uid: string) {
  return collection(db, "users", uid, "budgetExpenses");
}

export function subscribeBudget(
  uid: string,
  cb: (budget: BudgetDoc | null) => void,
  onError?: (e: unknown) => void
) {
  return onSnapshot(
    budgetDocRef(uid),
    (snap) => {
      cb(snap.exists() ? (snap.data() as BudgetDoc) : null);
    },
    (err) => onError?.(err)
  );
}

export function subscribeExpenses(
  uid: string,
  cb: (expenses: Expense[]) => void,
  onError?: (e: unknown) => void
) {
  const q = query(expensesColRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const items: Expense[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...(d.data() as Omit<Expense, "id">) }));
      cb(items);
    },
    (err) => onError?.(err)
  );
}

export async function setBudgetLimit(uid: string, limit: number, currency = "USD") {
  const ref = budgetDocRef(uid);
  const current = await getDoc(ref);
  const payload: BudgetDoc = { limit, currency };
  if (current.exists()) {
    await setDoc(ref, payload, { merge: true });
  } else {
    await setDoc(ref, payload);
  }
}

export async function addExpense(uid: string, name: string, amount: number) {
  const trimmed = name.trim();
  const value = Number(amount);
  if (!trimmed || !isFinite(value) || value <= 0) return;

  await addDoc(expensesColRef(uid), {
    name: trimmed,
    amount: value,
    createdAt: serverTimestamp(),
  });
}

export async function deleteExpense(uid: string, id: string) {
  const ref = doc(db, "users", uid, "budgetExpenses", id);
  await deleteDoc(ref);
}
