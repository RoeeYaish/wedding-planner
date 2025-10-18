import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SectionCard } from "@/components/ui/section-card";
import { Input, Button } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/skeleton";

import {
  addTimelineEvent,
  deleteTimelineEvent,
  subscribeTimeline,
  updateTimelineEvent,
  type TimelineEvent,
} from "@/lib/timeline";

type Draft = {
  title: string;
  time: string;
  durationMinutes?: string | null;
  location?: string | null;
  contact?: string | null;
  notes?: string | null;
};

const emptyDraft: Draft = {
  title: "",
  time: "",
  durationMinutes: null,
  location: null,
  contact: null,
  notes: null,
};

const inputClass =
  "w-full rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm shadow-soft transition-all placeholder:text-skin-muted focus:outline-none focus:ring-1 focus:ring-skin-primary/30 focus:shadow-lift";
const outlineButton =
  "inline-flex items-center justify-center rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm font-medium text-skin-text shadow-soft transition-all hover:bg-skin-bg hover:shadow-lift";
const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-skin-primary px-4 py-2 text-sm font-medium text-skin-card shadow-soft transition-all hover:bg-skin-primary600 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50";

export default function TimelineCard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ ...emptyDraft });

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeTimeline(uid, (events) => {
      setItems(events);
      setLoading(false);
    });
  }, [uid]);

  const canAdd = useMemo(() => {
    return draft.title.trim() !== "" && /^\d{2}:\d{2}$/.test(draft.time.trim());
  }, [draft.title, draft.time]);

  async function onAdd() {
    if (!uid || !canAdd) return;
    setSaving(true);
    try {
      await addTimelineEvent(uid, {
        title: draft.title.trim(),
        time: draft.time.trim(),
        durationMinutes: toNumberOrNull(draft.durationMinutes),
        location: normalizeStr(draft.location),
        contact: normalizeStr(draft.contact),
        notes: normalizeStr(draft.notes),
      });
      setDraft({ ...emptyDraft });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(event: TimelineEvent) {
    setEditingId(event.id);
    setEditDraft({
      title: event.title ?? "",
      time: event.time ?? "",
      durationMinutes: event.durationMinutes != null ? String(event.durationMinutes) : null,
      location: event.location ?? null,
      contact: event.contact ?? null,
      notes: event.notes ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (
      !uid ||
      !editingId ||
      editDraft.title.trim() === "" ||
      !/^\d{2}:\d{2}$/.test(editDraft.time?.trim() ?? "")
    ) {
      return;
    }
    setSaving(true);
    try {
      await updateTimelineEvent(uid, editingId, {
        title: editDraft.title.trim(),
        time: editDraft.time!.trim(),
        durationMinutes: toNumberOrNull(editDraft.durationMinutes),
        location: normalizeStr(editDraft.location),
        contact: normalizeStr(editDraft.contact),
        notes: normalizeStr(editDraft.notes),
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!uid) return;
    if (!confirm("Delete this event?")) return;
    await deleteTimelineEvent(uid, id);
  }

  return (
    <SectionCard title="Wedding Day Timeline" subtitle="Schedule your big day" className="scroll-body">
  <div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FieldInput
            label="כותרת אירוע"
            value={draft.title}
            onChange={(value) => setDraft((d) => ({ ...d, title: value }))}
            required
          />
          <FieldInput
            label="שעה (HH:mm)"
            value={draft.time}
            onChange={(value) => setDraft((d) => ({ ...d, time: value }))}
            placeholder="18:30"
          />
          <FieldInput
            label="משך (בדקות)"
            value={draft.durationMinutes ?? ""}
            onChange={(value) => setDraft((d) => ({ ...d, durationMinutes: value }))}
            inputMode="numeric"
          />
          <FieldInput
            label="מיקום"
            value={draft.location ?? ""}
            onChange={(value) => setDraft((d) => ({ ...d, location: value }))}
          />
          <FieldInput
            label="איש קשר"
            value={draft.contact ?? ""}
            onChange={(value) => setDraft((d) => ({ ...d, contact: value }))}
          />
          <FieldInput
            label="הערות"
            value={draft.notes ?? ""}
            onChange={(value) => setDraft((d) => ({ ...d, notes: value }))}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button className={primaryButton} onClick={onAdd} disabled={!canAdd || saving}>
            הוסיפו אירוע
          </Button>
        </div>
      </div>

      {loading ? (
        <>
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-skin-bg p-8 text-center text-skin-muted" dir="rtl">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm font-medium mb-1">אין אירועים עדיין</p>
          <p className="text-xs">הוסיפו אירוע ראשון ללו"ז החתונה</p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1 relative">
          <div className="absolute right-6 top-0 bottom-0 w-px bg-border"></div>
          {items.map((event) => {
            const details = timelineDetails(event);

            if (editingId === event.id) {
              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-4 pr-4"
                >
                  <div className="flex flex-col items-center">
                      <div className="rounded-full bg-skin-primary px-3 py-1 text-xs font-medium text-skin-card shadow-soft">
                      {editDraft.time}
                    </div>
                  </div>
                    <div className="flex-1 rounded-xl border border-skin-border bg-skin-card p-4 shadow-soft">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <FieldInput
                      label="כותרת אירוע"
                      value={editDraft.title}
                      onChange={(value) => setEditDraft((d) => ({ ...d, title: value }))}
                      required
                    />
                    <FieldInput
                      label="שעה (HH:mm)"
                      value={editDraft.time ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, time: value }))}
                    />
                    <FieldInput
                      label="משך (בדקות)"
                      value={editDraft.durationMinutes ?? ""}
                      onChange={(value) =>
                        setEditDraft((d) => ({ ...d, durationMinutes: value }))
                      }
                      inputMode="numeric"
                    />
                    <FieldInput
                      label="מיקום"
                      value={editDraft.location ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, location: value }))}
                    />
                    <FieldInput
                      label="איש קשר"
                      value={editDraft.contact ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, contact: value }))}
                    />
                    <FieldInput
                      label="הערות"
                      value={editDraft.notes ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, notes: value }))}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button className={primaryButton} onClick={saveEdit} disabled={saving || editDraft.title.trim() === "" || !/^\d{2}:\d{2}$/.test(editDraft.time ?? "") }>
                      עדכון
                    </Button>
                    <Button className={outlineButton} onClick={cancelEdit}>
                      ביטול
                    </Button>
                  </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={event.id}
                className="relative flex items-start gap-4 pr-4"
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-skin-primary px-3 py-1 text-xs font-medium text-skin-card shadow-soft">
                    {event.time}
                  </div>
                </div>
                  <div className="flex-1 rounded-xl border border-skin-border bg-skin-card p-4 shadow-soft transition-all hover:bg-skin-bg hover:shadow-lift">
                  <div className="text-right">
                      <div className="text-base font-bold text-skin-text">
                      {event.title}
                    </div>
                      {details.length > 0 ? (
                        <div className="mt-2 space-y-2 text-sm text-skin-muted">
                        {details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="border-t border-skin-border pt-2 first:border-none first:pt-0"
                          >
                            {detail}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2 text-sm">
                    <Button className={outlineButton} onClick={() => startEdit(event)}>
                      Edit
                    </Button>
                    <Button className={`${outlineButton} border-red-200 text-red-600 hover:bg-red-50`} onClick={() => onDelete(event.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function timelineDetails(event: TimelineEvent) {
  const details: string[] = [];
  if (event.durationMinutes != null) {
    details.push(`Duration: ${event.durationMinutes} min`);
  }
  if (event.location) {
    details.push(`Location: ${event.location}`);
  }
  if (event.contact) {
    details.push(`Contact: ${event.contact}`);
  }
  if (event.notes) {
    details.push(`Notes: ${event.notes}`);
  }
  return details;
}

function normalizeStr(value?: string | null) {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNumberOrNull(value?: string | null) {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function FieldInput({
  label,
  value,
  onChange,
  inputMode,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
  <label className="mb-1 block text-xs text-skin-muted">{label}</label>
      <Input
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}
