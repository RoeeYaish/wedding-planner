import { useEffect, useMemo, useState, FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import type { BudgetDoc, Expense } from "@/lib/budget";
import { addExpense, deleteExpense, setBudgetLimit, subscribeBudget, subscribeExpenses } from "@/lib/budget";
import { Card, CardContent } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/section-header";

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";
const buttonClass =
  "inline-flex items-center justify-center rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

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
      <CardContent className="space-y-4">
        <SectionHeader
          title="Budget Tracker"
          subtitle="Track your expenses vs. your limit"
        />

        <form onSubmit={onSaveLimit} className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-neutral-500">Budget limit</label>
            <input
              className={inputClass}
              placeholder="e.g. 25000"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <div className="md:w-28">
            <label className="mb-1 block text-xs text-neutral-500">Currency</label>
            <input
              className={inputClass}
              placeholder="USD"
              value={currencyInput}
              onChange={(e) => setCurrencyInput(e.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" className={buttonClass}>
            Save
          </button>
        </form>

        <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Spent</span>
            <span className="font-medium">
              {formatMoney(totalSpent, budget?.currency)} /{" "}
              {formatMoney(budget?.limit ?? 0, budget?.currency)}
            </span>
          </div>
          <div className="h-2 w-full rounded bg-neutral-200">
            <div
              className={`h-full rounded ${progress >= 100 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <form onSubmit={onAddExpense} className="flex flex-col gap-2 sm:flex-row">
          <input
            className={inputClass}
            placeholder="Expense name..."
            value={expName}
            onChange={(e) => setExpName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Amount"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            inputMode="decimal"
          />
          <button className={buttonClass} type="submit">
            Add
          </button>
        </form>

        {expenses.length === 0 ? (
          <div className="text-sm text-neutral-500">No expenses yet.</div>
        ) : (
          <ul className="space-y-2">
            {expenses.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded border border-neutral-200 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-neutral-900">{e.name}</span>
                  <span className="text-sm text-neutral-600">
                    {formatMoney(e.amount, budget?.currency)}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-sm text-red-600 hover:text-red-700"
                  onClick={() => user && deleteExpense(user.uid, e.id)}
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

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount || 0);
  } catch {
    return `${amount?.toFixed?.(2) ?? "0.00"} ${currency}`;
  }
}
