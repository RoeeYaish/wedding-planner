import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Countdown from "@/components/Countdown";
import { Card, CardHeader } from "@/components/ui/Card";
import BudgetCard from "@/components/budget/BudgetCard";
import NextStepsCard from "@/components/next-steps/NextStepsCard";
import TodoCard from "@/components/todos/TodoCard";

export default function Home() {
  const { user, profile, logout } = useAuth();

  const displayName =
    profile?.displayName || user?.displayName || user?.email || "Couple";
  const email = profile?.email || user?.email || "";
  const dateISO = profile?.weddingDate || "";
  const location = profile?.weddingLocation || "";

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header / Hero Card */}
        <Card>
          <div className="flex flex-col items-center text-center gap-2">
            <h1 className="text-2xl md:text-3xl font-semibold">Home Dashboard</h1>
            <p className="text-sm text-neutral-600">Welcome, {displayName}.</p>
            {email ? <p className="text-xs text-neutral-400">{email}</p> : null}

            {dateISO ? (
              <div className="mt-4">
                <div className="text-sm text-neutral-500 mb-1">
                  Countdown to your wedding
                </div>
                <Countdown targetISO={dateISO} />
                <div className="mt-2 text-xs text-neutral-500">
                  Target date: {dateISO}
                  {location ? ` • ${location}` : ""}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm">
                <span className="text-neutral-600">No wedding date set.</span>{" "}
                <Link to="/profile" className="text-blue-600 hover:underline">
                  Set wedding details
                </Link>
              </div>
            )}

            <div className="mt-4">
              <Link
                to="/profile"
                className="px-3 py-2 border rounded hover:bg-neutral-100"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="ml-3 px-3 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800"
              >
                Logout
              </button>
            </div>
          </div>
        </Card>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Next Steps */}
          <NextStepsCard />

          {/* To-Do List */}
          <TodoCard />

          {/* Budget Tracker */}
          <BudgetCard />

          {/* Guest List */}
          <Card>
            <CardHeader title="Guest List" subtitle="Manage invites & RSVPs" />
            <div className="text-sm text-neutral-500">Placeholder content.</div>
          </Card>

          {/* Vendor Management */}
          <Card>
            <CardHeader title="Vendor Management" subtitle="Track your vendors" />
            <div className="text-sm text-neutral-500">Placeholder content.</div>
          </Card>

          {/* Timeline (optional placeholder) */}
          <Card>
            <CardHeader title="Wedding Day Timeline" subtitle="Coming soon" />
            <div className="text-sm text-neutral-500">Placeholder content.</div>
          </Card>
        </div>
      </div>
    </main>
  );
}
