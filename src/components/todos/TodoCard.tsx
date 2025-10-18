import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { SectionCard } from "@/components/ui/section-card";
import { Input, Button } from "@/components/ui/primitives";
import { addTodo, deleteTodo, subscribeToTodos, toggleTodo } from "@/lib/todos";
import type { Todo } from "@/lib/todos";
import { Skeleton } from "@/components/ui/skeleton";

const inputClass =
  "flex-1 rounded-xl border border-border bg-paper px-4 py-2 text-sm shadow-soft transition-all placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-lift";
const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-medium text-paper shadow-soft transition-all hover:bg-gold/90 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50";

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
    <SectionCard title="To-Do List" subtitle="Track your tasks" className="scroll-body">
      <form onSubmit={onAdd} className="flex gap-2">
        <Input
          ref={inputRef}
          className={inputClass}
          placeholder="Add a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button className={buttonClass} type="submit" disabled={!input.trim()}>
          Add Task
        </Button>
      </form>

      {loading ? (
        <div>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="mb-2 h-4 w-full last:mb-0" />
          ))}
        </div>
      ) : errMsg ? (
        <div className="text-sm text-red-600">{errMsg}</div>
      ) : todos.length === 0 ? (
        <div className="rounded-xl bg-ivory p-8 text-center text-muted" dir="rtl">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm font-medium mb-1">אין משימות עדיין</p>
          <p className="text-xs">הוסיפו משימה ראשונה כדי להתחיל</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <ul className="space-y-3">
            {todos.map((t) => (
              <li key={t.id} className="group flex items-center justify-between rounded-xl bg-paper p-4 transition-all">
                <label className="flex items-center gap-3 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-gold cursor-pointer"
                    checked={t.completed}
                    onChange={() => onToggle(t)}
                  />
                  <span className={t.completed ? "line-through text-muted" : ""}>{t.text}</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-red-600 transition hover:text-red-700 opacity-0 group-hover:opacity-100"
                  onClick={() => onDelete(t)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
