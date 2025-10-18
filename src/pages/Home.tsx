import Container from "@/components/layout/Container";
import AppHeader from "@/components/header/AppHeader";
import { useAuth } from "@/lib/auth-context";
import NextStepsCard from "@/components/next-steps/NextStepsCard";
import TodoCard from "@/components/todos/TodoCard";
import BudgetCard from "@/components/budget/BudgetCard";
import GuestListCard from "@/components/guests/GuestListCard";
import VendorManagementCard from "@/components/vendors/VendorManagementCard";
import TimelineCard from "@/components/timeline/TimelineCard";
import SummaryCard from "@/components/home/SummaryCard";
import { Calendar, CheckSquare, Wallet2, Users2, Briefcase, Clock3 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useState } from "react";
import { useDashboardKpis } from "@/lib/dashboard";
import { money } from "@/lib/format";

export default function Home() {
  const [openDrawer, setOpenDrawer] = useState<null | string>(null);
  const { user } = useAuth();
  const kpis = useDashboardKpis(user?.uid);

  function currency(v: number) {
    // Use the shared money formatter (defaults to ILS / he-IL)
    try {
      return money(v ?? 0, 'ILS');
    } catch {
      return `₪${Math.round(v ?? 0)}`;
    }
  }

  function pluralizeMins(m: number | null) {
    if (m == null) return "—";
    if (m <= 0) return "Now";
    return `${m} min`;
  }

  // Header moved to AppHeader

  return (
    <main className="min-h-screen py-6">
      <AppHeader />
      <Container>

    {/* Grid: summary-focused */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-6">
          {/* Row 1: Budget, To-Do, Next Steps (summaries) */}
          <SummaryCard
            title="Budget"
            subtitle="Overview"
            icon={<Wallet2 size={18} />}
            kpis={[
              { label: "Remaining", value: currency(kpis.budget.remaining ?? 0), tone: "success" },
              { label: "Limit", value: currency(kpis.budget.limit ?? 0) },
              { label: "Spent", value: currency(kpis.budget.spent ?? 0), tone: "warn" },
            ]}
            onView={() => setOpenDrawer("budget")}
          />

          <SummaryCard
            title="To-Do"
            subtitle="Tasks"
            icon={<CheckSquare size={18} />}
            kpis={[{ label: "Open", value: `${kpis.todos.open ?? 0}`, tone: "warn" }, { label: "Done", value: `${kpis.todos.done ?? 0}`, tone: "success" }]}
            onView={() => setOpenDrawer("todo")}
          />

          <SummaryCard
            title="Next Steps"
            subtitle="Plan"
            icon={<Calendar size={18} />}
            kpis={[{ label: "Upcoming", value: `${kpis.nextSteps.upcoming ?? 0}`, tone: "warn" }, { label: "Total", value: `${kpis.nextSteps.total ?? 0}` }]}
            onView={() => setOpenDrawer("next")}
          />

          {/* Row 2: Guests + Vendors */}
          <SummaryCard
            title="Guest List"
            subtitle="Guests"
            icon={<Users2 size={18} />}
            kpis={[{ label: "Accepted", value: `${kpis.guests.accepted ?? 0}`, tone: "success" }, { label: "Declined", value: `${kpis.guests.declined ?? 0}`, tone: "warn" }, { label: "Total", value: `${kpis.guests.total ?? 0}` }]}
            onView={() => setOpenDrawer("guests")}
          />

          <SummaryCard
            title="Vendors"
            subtitle="Vendors"
            icon={<Briefcase size={18} />}
            kpis={[{ label: "Booked", value: `${kpis.vendors.booked ?? 0}` }, { label: "Pending", value: `${kpis.vendors.pending ?? 0}`, tone: "warn" }, { label: "Payments", value: `${kpis.vendors.payments ?? 0}` }]}
            onView={() => setOpenDrawer("vendors")}
          />

          {/* Row 3: Timeline */}
          <div className="xl:col-span-3 md:col-span-2 col-span-1">
            <SummaryCard
              title="Timeline"
              subtitle="Wedding Day"
              icon={<Clock3 size={18} />}
              kpis={[
                { label: "Next", value: pluralizeMins(kpis.timeline.nextInMinutes) },
                { label: "Time", value: kpis.timeline.nextInMinutes == null ? "—" : `${kpis.timeline.nextInMinutes} min` },
                { label: "Count", value: `${kpis.timeline.count ?? 0}` },
              ]}
              onView={() => setOpenDrawer("timeline")}
            />
          </div>

          {/* Drawers for details */}
          <Modal open={openDrawer === "budget"} onOpenChange={(v) => setOpenDrawer(v ? "budget" : null)} title="Budget">
            <BudgetCard />
          </Modal>

          <Modal open={openDrawer === "todo"} onOpenChange={(v) => setOpenDrawer(v ? "todo" : null)} title="To-Do">
            <TodoCard />
          </Modal>

          <Modal open={openDrawer === "next"} onOpenChange={(v) => setOpenDrawer(v ? "next" : null)} title="Next Steps">
            <NextStepsCard />
          </Modal>

          <Modal open={openDrawer === "guests"} onOpenChange={(v) => setOpenDrawer(v ? "guests" : null)} title="Guests">
            <GuestListCard />
          </Modal>

          <Modal open={openDrawer === "vendors"} onOpenChange={(v) => setOpenDrawer(v ? "vendors" : null)} title="Vendors">
            <VendorManagementCard />
          </Modal>

          <Modal open={openDrawer === "timeline"} onOpenChange={(v) => setOpenDrawer(v ? "timeline" : null)} title="Timeline">
            <TimelineCard />
          </Modal>
        </div>
      </Container>
    </main>
  );
}
