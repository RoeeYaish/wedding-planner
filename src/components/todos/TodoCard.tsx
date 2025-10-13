import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/section-header";
import { addTodo, deleteTodo, subscribeToTodos, toggleTodo } from "@/lib/todos";
import type { Todo } from "@/lib/todos";

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";
const buttonClass =
  "inline-flex items-center justify-center rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

export default function TodoCard() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTodos(
      user.uid,
      (items) => {
        setTodos(items);
        setLoading(false);
        setErrMsg(null);
      },
      (e) => {
        console.error("Todos subscription error:", e);
        setErrMsg("Permission error. Please check Firestore rules.");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await addTodo(user.uid, input);
    setInput("");
  };

  const onToggle = async (t: Todo) => {
    if (!user) return;
    await toggleTodo(user.uid, t.id, !t.completed);
  };

  const onDelete = async (t: Todo) => {
    if (!user) return;
    await deleteTodo(user.uid, t.id);
  };

  useEffect(() => {
    if (location.hash === "#todos") {
      setTimeout(() => {
        document.getElementById("todos")?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    }
  }, [location.hash]);

  return (
    <Card>
      <CardContent className="space-y-4" id="todos">
        <SectionHeader title="To-Do List" subtitle="Track your tasks" />
        <form onSubmit={onAdd} className="flex flex-col gap-2 sm:flex-row">
          <input
            ref={inputRef}
            className={inputClass}
            placeholder="Add a task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className={buttonClass} type="submit">
            Add
          </button>
        </form>

        {loading ? (
          <div className="text-sm text-neutral-500">Loading...</div>
        ) : errMsg ? (
          <div className="text-sm text-red-600">{errMsg}</div>
        ) : todos.length === 0 ? (
          <div className="text-sm text-neutral-500">No tasks yet.</div>
        ) : (
          <ul className="space-y-2">
            {todos.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2"
              >
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-black"
                    checked={t.completed}
                    onChange={() => onToggle(t)}
                  />
                  <span className={t.completed ? "line-through text-neutral-400" : ""}>
                    {t.text}
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => onDelete(t)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
