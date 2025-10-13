import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: any; // Firestore Timestamp (optional)
};

function todosColRef(uid: string) {
  return collection(db, "users", uid, "todos");
}

export function subscribeToTodos(
  uid: string,
  cb: (todos: Todo[]) => void
): () => void {
  const q = query(todosColRef(uid), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const items: Todo[] = [];
    snap.forEach((d) =>
      items.push({
        id: d.id,
        ...(d.data() as Omit<Todo, "id">),
      })
    );
    cb(items);
  });
}

export async function addTodo(uid: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(todosColRef(uid), {
    text: trimmed,
    completed: false,
    createdAt: serverTimestamp(),
  });
}

export async function toggleTodo(uid: string, id: string, completed: boolean) {
  const ref = doc(db, "users", uid, "todos", id);
  await updateDoc(ref, { completed });
}

export async function deleteTodo(uid: string, id: string) {
  const ref = doc(db, "users", uid, "todos", id);
  await deleteDoc(ref);
}
