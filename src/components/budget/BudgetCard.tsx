import { useEffect, useMemo, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  BudgetDoc,
  Expense,
  addExpense,
  deleteExpense,
  setBudgetLimit,
  subscribeBudget,
  subscribeExpenses,
} from "@/lib/budget";
import { Card, CardHeader } from "@/components/ui/Card";

export default function BudgetCard() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<BudgetDoc | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [limitInput, setLimitInput] = useState<string>("");
  const [currencyInput, setCurrencyInput] = useState<string>("USD");
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeBudget(user.uid, (b) => {
      setBudget(b);
      if (b) {
        setLimitInput(String(b.limit ?? ""));
        setCurrencyInput(b.currency ?? "USD");
      }
    });
    const unsub2 = subscribeExpenses(user.uid, setExpenses);
    return () => {
      unsub1?.();
      unsub2?.();
    };
  }, [user]);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    [expenses]
  );

  const progress = useMemo(() => {
    const lim = budget?.limit ?? 0;
    if (lim <= 0) return 0;
    return Math.min(100, Math.round((totalSpent / lim) * 100));
  }, [budget, totalSpent]);

  const onSaveLimit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const lim = Number(limitInput);
    if (!isFinite(lim) || lim <= 0) return;
    await setBudgetLimit(user.uid, lim, currencyInput || "USD");
  };

  const onAddExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amt = Number(expAmount);
    if (!isFinite(amt) || amt <= 0) return;
    await addExpense(user.uid, expName, amt);
    setExpName("");
    setExpAmount("");
  };

  return (
    <Card>
      <CardHeader title="Budget Tracker" subtitle="Track your expenses vs. your limit" />

      {/* Limit section */}
      <form onSubmit={onSaveLimit} className="flex items-end gap-2 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Budget limit</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. 25000"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Currency</label>
          <input
            className="w-24 border rounded px-3 py-2"
            placeholder="USD"
            value={currencyInput}
            onChange={(e) => setCurrencyInput(e.target.value.toUpperCase())}
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
        >
          Save
        </button>
      </form>

      {/* Summary */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Spent</span>
          <span className="font-medium">
            {formatMoney(totalSpent, budget?.currency)} / {formatMoney(budget?.limit ?? 0, budget?.currency)}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded">
          <div
            className={`h-2 rounded ${progress >= 100 ? "bg-red-500" : "bg-green-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add expense */}
      <form onSubmit={onAddExpense} className="flex gap-2 mb-3">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Expense name..."
          value={expName}
          onChange={(e) => setExpName(e.target.value)}
        />
        <input
          className="w-32 border rounded px-3 py-2"
          placeholder="Amount"
          value={expAmount}
          onChange={(e) => setExpAmount(e.target.value)}
          inputMode="decimal"
        />
        <button
          className="px-3 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
          type="submit"
        >
          Add
        </button>
      </form>

      {/* Recent expenses (last 5) */}
      {expenses.length === 0 ? (
        <div className="text-sm text-neutral-500">No expenses yet.</div>
      ) : (
        <ul className="space-y-2">
          {expenses.slice(0, 5).map((e) => (
            <li key={e.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">{e.name}</span>
                <span className="text-sm text-neutral-600">
                  {formatMoney(e.amount, budget?.currency)}
                </span>
              </div>
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={() => user && deleteExpense(user.uid, e.id)}
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

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount || 0);
  } catch {
    return `${amount?.toFixed?.(2) ?? "0.00"} ${currency}`;
  }
}
