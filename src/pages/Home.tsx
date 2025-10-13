import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Container from "@/components/layout/Container";
import Countdown from "@/components/Countdown";
import { Card } from "@/components/ui/Card";
import BudgetCard from "@/components/budget/BudgetCard";
import GuestListCard from "@/components/guests/GuestListCard";
import NextStepsCard from "@/components/next-steps/NextStepsCard";
import TimelineCard from "@/components/timeline/TimelineCard";
import TodoCard from "@/components/todos/TodoCard";
import VendorManagementCard from "@/components/vendors/VendorManagementCard";

export default function Home() {
  const { user, profile, logout } = useAuth();

  const displayName =
    profile?.displayName || user?.displayName || user?.email || "Couple";
  const email = profile?.email || user?.email || "";
  const dateISO = profile?.weddingDate || "";
  const location = profile?.weddingLocation || "";

  const headerLine = email ? `${displayName} · ${email}` : displayName;

  return (
    <main className="min-h-screen py-10">
      <Container>
        <div className="space-y-6">
          <header className="flex flex-col items-end gap-2 text-right">
            <h1 className="text-3xl font-semibold text-neutral-900">Home Dashboard</h1>
            <p className="text-sm text-neutral-600">{headerLine}</p>
            <button
              onClick={logout}
              className="px-3 py-2 rounded border border-neutral-300 bg-white text-sm hover:bg-neutral-100 transition"
            >
              Logout
            </button>
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <Card className="min-h-[220px]">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-neutral-900">
                      {profile?.displayName || displayName}
                    </h2>
                    <p className="text-sm text-neutral-500">
                      {location ? `מיקום: ${location}` : "טרם הוגדר מיקום לחתונה"}
                    </p>
                  </div>

                  {dateISO ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-neutral-500">
                        הספירה לאחור ליום הגדול
                      </div>
                      <Countdown targetISO={dateISO} />
                      <div className="text-xs text-neutral-500">
                        תאריך: {dateISO}
                        {location ? ` · ${location}` : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-600">
                      טרם הוגדר תאריך.
                      {" "}
                      <Link to="/profile" className="text-blue-600 hover:underline">
                        הגדירו פרטי חתונה
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4">
              <NextStepsCard />
            </div>
            <div className="lg:col-span-4">
              <TodoCard />
            </div>
            <div className="lg:col-span-4">
              <BudgetCard />
            </div>

            <div className="lg:col-span-6">
              <GuestListCard />
            </div>
            <div className="lg:col-span-6">
              <VendorManagementCard />
            </div>

            <div className="lg:col-span-12">
              <TimelineCard />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
