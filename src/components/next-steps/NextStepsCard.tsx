import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader } from "@/components/ui/Card";

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
    <Card>
      <CardHeader
        title="Next Steps"
        subtitle="Helpful tasks to get you started"
      />
      <ul className="space-y-3">
        {steps.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 border rounded px-3 py-2"
          >
            <div>
              <div className="flex items-center gap-2">
                <StatusBadge status={s.status} />
                <span className="font-medium">{s.title}</span>
              </div>
              {s.note ? (
                <div className="text-xs text-neutral-500 mt-1">{s.note}</div>
              ) : null}
            </div>
            {s.action ? (
              <Link
                to={s.action.to}
                className="text-sm px-3 py-1.5 rounded border bg-neutral-50 hover:bg-neutral-100"
              >
                {s.action.label}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StatusBadge({ status }: { status: "done" | "pending" | "soon" }) {
  const map = {
    done: { label: "Done", cls: "bg-green-100 text-green-700 border-green-200" },
    pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    soon: { label: "Soon", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  }[status];

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${map.cls}`}>
      {map.label}
    </span>
  );
}
