import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { SectionCard } from "@/components/ui/section-card";
import { Badge } from "@/components/ui/badge";

type Step = {
  id: string;
  title: string;
  status: "done" | "pending" | "soon";
  action?: { label: string; to: string };
  note?: string;
};

export default function NextStepsCard() {
  const { profile } = useAuth();
  const hasDate = !!profile?.weddingDate;
  const hasLocation = !!profile?.weddingLocation;

  const steps: Step[] = [
    {
      id: "date",
      title: "Set your wedding date",
      status: hasDate ? "done" : "pending",
      action: hasDate ? undefined : { label: "Set date", to: "/profile" },
      note: hasDate ? `Date: ${profile?.weddingDate}` : undefined,
    },
    {
      id: "location",
      title: "Choose a wedding location",
      status: hasLocation ? "done" : "pending",
      action: hasLocation ? undefined : { label: "Set location", to: "/profile" },
      note: hasLocation ? `Location: ${profile?.weddingLocation}` : undefined,
    },
    {
      id: "todo",
      title: "Add your first To-Do",
      status: "pending",
      action: { label: "Add a task", to: "/home#todos" },
      note: "Create your first task to get organized",
    },
    {
      id: "guests",
      title: "Connect your Guest List (Google Sheets)",
      status: "soon",
      note: "Coming soon",
    },
  ];

  return (
    <SectionCard title="Next Steps" subtitle="Helpful tasks to get you started">
      <ul className="space-y-3">
        {steps.map((s) => (
          <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl bg-skin-card p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={s.status} />
                <span className="font-medium text-skin-text">{s.title}</span>
              </div>
              {s.note ? (
                <div className="text-right text-xs text-skin-muted">{s.note}</div>
              ) : null}
            </div>
            {s.action ? (
              <Link to={s.action.to} className="inline-flex items-center justify-center rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm font-medium text-skin-text">
                {s.action.label}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function StatusBadge({ status }: { status: "done" | "pending" | "soon" }) {
  const map = {
    done: { label: "Done", variant: "default" as const },
    pending: { label: "Pending", variant: "secondary" as const },
    soon: { label: "Soon", variant: "outline" as const },
  }[status];

  return <Badge variant={map.variant}>{map.label}</Badge>;
}
