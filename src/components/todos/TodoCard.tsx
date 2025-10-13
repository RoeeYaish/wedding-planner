import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader } from "@/components/ui/Card";
import { addTodo, deleteTodo, subscribeToTodos, toggleTodo } from "@/lib/todos";
import type { Todo } from "@/lib/todos";

export default function TodoCard() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToTodos(user.uid, (items) => {
      setTodos(items);
      setLoading(false);
    });
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

  return (
    <Card>
      <CardHeader title="To-Do List" subtitle="Track your tasks" />
      <form onSubmit={onAdd} className="flex gap-2 mb-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Add a task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="px-3 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
          type="submit"
        >
          Add
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading...</div>
      ) : todos.length === 0 ? (
        <div className="text-sm text-neutral-500">No tasks yet.</div>
      ) : (
        <ul className="space-y-2">
          {todos.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between border rounded px-3 py-2"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => onToggle(t)}
                />
                <span className={t.completed ? "line-through text-neutral-400" : ""}>
                  {t.text}
                </span>
              </label>
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() => onDelete(t)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
