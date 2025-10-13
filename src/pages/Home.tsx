import { useAuth } from "@/lib/auth-context";
import Container from "@/components/layout/Container";
import BudgetCard from "@/components/budget/BudgetCard";
import GuestListCard from "@/components/guests/GuestListCard";
import NextStepsCard from "@/components/next-steps/NextStepsCard";
import ProfileCountdownCard from "@/components/home/ProfileCountdownCard";
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
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <ProfileCountdownCard
                displayName={profile?.displayName || displayName}
                email={email}
                photoURL={profile?.photoURL || user?.photoURL || null}
                dateISO={dateISO || null}
                location={location || null}
                onLogout={() => {
                  void logout();
                }}
              />
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
