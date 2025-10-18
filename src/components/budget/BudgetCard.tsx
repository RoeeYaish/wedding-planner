import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import type { BudgetDoc, Expense } from "@/lib/budget";
import { addExpense, deleteExpense, setBudgetLimit, subscribeBudget, subscribeExpenses } from "@/lib/budget";
import { SectionCard } from "@/components/ui/section-card";
import { Input, Button } from "@/components/ui/primitives";

const inputClass =
  "w-full rounded-xl border border-border bg-paper px-4 py-2 text-sm shadow-soft transition-all placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-lift";
const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-medium text-paper shadow-soft transition-all hover:bg-gold/90 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50";

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
    <SectionCard title="Budget Tracker" subtitle="Monitor your wedding expenses">
      <form onSubmit={onSaveLimit} className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted">Budget limit</label>
          <div className="flex gap-2 rounded-xl bg-ivory p-4">
            <Input className={`${inputClass} border-0 bg-transparent shadow-none focus:ring-0`} placeholder="e.g. 25000" value={limitInput} onChange={(e) => setLimitInput(e.target.value)} inputMode="numeric" />
            <Input className={`${inputClass} border-0 bg-transparent shadow-none focus:ring-0 md:w-20`} placeholder="USD" value={currencyInput} onChange={(e) => setCurrencyInput(e.target.value.toUpperCase())} />
          </div>
        </div>
        <Button type="submit" className={buttonClass}>Save</Button>
      </form>

      <div className="rounded-xl border border-border bg-paper p-6 shadow-soft">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted">Spent</span>
          <span className="font-medium text-ink">
            {formatMoney(totalSpent, budget?.currency)} /{" "}
            {formatMoney(budget?.limit ?? 0, budget?.currency)}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gold transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={onAddExpense} className="flex gap-2">
        <Input className={inputClass} placeholder="Expense name..." value={expName} onChange={(e) => setExpName(e.target.value)} />
        <Input className={inputClass} placeholder="Amount" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} inputMode="decimal" />
        <Button className={buttonClass} type="submit">Add</Button>
      </form>

      {expenses.length === 0 ? (
        <div className="rounded-xl bg-ivory p-8 text-center text-muted">
          <div className="text-4xl mb-3">💰</div>
          <p className="text-sm font-medium mb-1">No expenses yet</p>
          <p className="text-xs">Add your first expense to start tracking</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {expenses.slice(0, 5).map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-xl border border-border bg-paper p-4 shadow-soft transition-all hover:bg-ivory hover:shadow-lift"
            >
              <span className="font-medium text-ink">{e.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted">
                  {formatMoney(e.amount, budget?.currency)}
                </span>
                <button
                  type="button"
                  className="text-sm text-red-600 transition hover:text-red-700"
                  onClick={() => user && deleteExpense(user.uid, e.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount || 0);
  } catch {
    return `${amount?.toFixed?.(2) ?? "0.00"} ${currency}`;
  }
}
