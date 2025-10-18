import Container from "@/components/layout/Container";
import HeroHeader from "@/components/HeroHeader";
import NextStepsCard from "@/components/next-steps/NextStepsCard";
import TodoCard from "@/components/todos/TodoCard";
import BudgetCard from "@/components/budget/BudgetCard";
import GuestListCard from "@/components/guests/GuestListCard";
import VendorManagementCard from "@/components/vendors/VendorManagementCard";
import TimelineCard from "@/components/timeline/TimelineCard";

export default function Home() {
  return (
    <main className="min-h-screen py-10">
      <Container>
        {/* Hero Header */}
        <HeroHeader />

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Row 2: Budget, To-Do, Next Steps */}
          <div className="md:col-span-1">
            <BudgetCard />
          </div>
          <div className="md:col-span-1">
            <TodoCard />
          </div>
          <div className="md:col-span-1">
            <NextStepsCard />
          </div>

          {/* Row 3: Vendor Management (narrow) and Guest List (wide) */}
          <div className="md:col-span-1">
            <VendorManagementCard />
          </div>
          <div className="md:col-span-2">
            <GuestListCard />
          </div>

          {/* Row 4: full-width Wedding Day Timeline */}
          <div className="md:col-span-3">
            <TimelineCard />
          </div>
        </div>
      </Container>
    </main>
  );
}
