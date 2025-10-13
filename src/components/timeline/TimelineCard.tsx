import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addTimelineEvent,
  deleteTimelineEvent,
  subscribeTimeline,
  updateTimelineEvent,
  type TimelineEvent,
} from "@/lib/timeline";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

type Draft = {
  title: string;
  time: string;
  durationMinutes?: number | null;
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

function FieldRow({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

export default function TimelineCard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [draft, setDraft] = useState<Draft>({ ...emptyDraft });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ ...emptyDraft });

  useEffect(() => {
    if (!uid) return;
    return subscribeTimeline(uid, setItems);
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
      durationMinutes: event.durationMinutes ?? null,
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
    <Card dir="rtl">
      <CardHeader title="Wedding Day Timeline" subtitle="Schedule your big day" />
      <CardContent>
        <div className="border rounded-lg p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldRow label="כותרת (חובה)">
              <input
                className="border rounded px-3 py-2"
                placeholder="איפור, יציאה לצילומים, חופה…"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="שעה (HH:mm)">
              <input
                className="border rounded px-3 py-2"
                placeholder="14:30"
                value={draft.time}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="משך (דקות)">
              <input
                className="border rounded px-3 py-2"
                placeholder="לדוגמה: 45"
                inputMode="numeric"
                value={draft.durationMinutes ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, durationMinutes: e.target.value as unknown as number }))
                }
              />
            </FieldRow>
            <FieldRow label="מיקום">
              <input
                className="border rounded px-3 py-2"
                value={draft.location ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="איש קשר">
              <input
                className="border rounded px-3 py-2"
                value={draft.contact ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
              />
            </FieldRow>
            <FieldRow label="הערות">
              <input
                className="border rounded px-3 py-2"
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </FieldRow>
          </div>

          <div className="mt-3">
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              disabled={!canAdd || saving}
              onClick={onAdd}
            >
              הוסף אירוע
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="text-neutral-500">אין אירועים עדיין.</div>
          ) : (
            items.map((event) =>
              editingId === event.id ? (
                <div key={event.id} className="border rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FieldRow label="כותרת (חובה)">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.title}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, title: e.target.value }))
                        }
                      />
                    </FieldRow>
                    <FieldRow label="שעה (HH:mm)">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.time ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, time: e.target.value }))
                        }
                      />
                    </FieldRow>
                    <FieldRow label="משך (דקות)">
                      <input
                        className="border rounded px-3 py-2"
                        inputMode="numeric"
                        value={editDraft.durationMinutes ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            durationMinutes: e.target.value as unknown as number,
                          }))
                        }
                      />
                    </FieldRow>
                    <FieldRow label="מיקום">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.location ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, location: e.target.value }))
                        }
                      />
                    </FieldRow>
                    <FieldRow label="איש קשר">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.contact ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, contact: e.target.value }))
                        }
                      />
                    </FieldRow>
                    <FieldRow label="הערות">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.notes ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, notes: e.target.value }))
                        }
                      />
                    </FieldRow>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
                      onClick={saveEdit}
                      disabled={
                        saving ||
                        editDraft.title.trim() === "" ||
                        !/^\d{2}:\d{2}$/.test(editDraft.time ?? "")
                      }
                    >
                      שמור
                    </button>
                    <button className="px-3 py-2 rounded border" onClick={cancelEdit}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div key={event.id} className="border rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">
                      {event.time} • {event.title}
                    </div>
                    <div className="text-sm text-neutral-700">
                      {event.durationMinutes != null && (
                        <span>משך: {event.durationMinutes} דק' · </span>
                      )}
                      {event.location && <span>מיקום: {event.location} · </span>}
                      {event.contact && <span>איש קשר: {event.contact}</span>}
                    </div>
                    {event.notes && (
                      <div className="text-sm text-neutral-600">הערות: {event.notes}</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-2 rounded border" onClick={() => startEdit(event)}>
                      ערוך
                    </button>
                    <button
                      className="px-3 py-2 rounded border text-red-600"
                      onClick={() => onDelete(event.id)}
                    >
                      מחק
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeStr(value?: string | null) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function toNumberOrNull(value?: unknown) {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}
