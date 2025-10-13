import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addTimelineEvent,
  deleteTimelineEvent,
  subscribeTimeline,
  updateTimelineEvent,
  type TimelineEvent,
} from "@/lib/timeline";
import { Card, CardContent } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/section-header";

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
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";
const outlineButton =
  "inline-flex items-center justify-center rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100";
const primaryButton =
  "inline-flex items-center justify-center rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

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
    <Card dir="rtl">
      <CardContent className="space-y-4">
        <SectionHeader title="Wedding Day Timeline" subtitle="Schedule your big day" />

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FieldInput
              label="כותרת (חובה)"
              value={draft.title}
              onChange={(value) => setDraft((d) => ({ ...d, title: value }))}
              required
            />
            <FieldInput
              label="שעה (HH:mm)"
              value={draft.time}
              onChange={(value) => setDraft((d) => ({ ...d, time: value }))}
              placeholder="14:30"
            />
            <FieldInput
              label="משך (דקות)"
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
            <button className={primaryButton} onClick={onAdd} disabled={!canAdd || saving}>
              הוסף אירוע
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-sm text-neutral-500">אין אירועים עדיין.</div>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {items.map((event) =>
              editingId === event.id ? (
                <div
                  key={event.id}
                  className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <FieldInput
                      label="כותרת (חובה)"
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
                      label="משך (דקות)"
                      value={editDraft.durationMinutes ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, durationMinutes: value }))}
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
                  <div className="mt-3 flex gap-2">
                    <button
                      className={primaryButton}
                      onClick={saveEdit}
                      disabled={
                        saving ||
                        editDraft.title.trim() === "" ||
                        !/^\d{2}:\d{2}$/.test(editDraft.time ?? "")
                      }
                    >
                      שמור
                    </button>
                    <button className={outlineButton} onClick={cancelEdit}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={event.id}
                  className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="text-base font-semibold text-neutral-900">
                    {event.time} · {event.title}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {event.durationMinutes != null ? `משך: ${event.durationMinutes} דק'` : ""}
                    {event.durationMinutes != null && event.location ? " · " : ""}
                    {event.location ? `מיקום: ${event.location}` : ""}
                    {event.location && event.contact ? " · " : ""}
                    {event.contact ? `איש קשר: ${event.contact}` : ""}
                  </div>
                  {event.notes ? (
                    <div className="text-sm text-neutral-500">הערות: {event.notes}</div>
                  ) : null}
                  <div className="mt-2 flex gap-2 text-sm">
                    <button className={outlineButton} onClick={() => startEdit(event)}>
                      ערוך
                    </button>
                    <button
                      className={`${outlineButton} border-red-200 text-red-600 hover:bg-red-50`}
                      onClick={() => onDelete(event.id)}
                    >
                      מחק
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeStr(value?: string | null) {
  if (value == null) return null;
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
      <label className="mb-1 block text-xs text-neutral-500">{label}</label>
      <input
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
