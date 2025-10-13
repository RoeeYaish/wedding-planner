import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  addVendor,
  deleteVendor,
  subscribeVendors,
  updateVendor,
  type Vendor,
  type VendorStatus,
} from "@/lib/vendors";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

type Draft = {
  name: string;
  serviceType?: string | null;
  phone?: string | null;
  budgetEstimate?: number | null;
  status?: VendorStatus | null;
  notes?: string | null;
};

const initialDraft: Draft = {
  name: "",
  serviceType: null,
  phone: null,
  budgetEstimate: null,
  status: "pending",
  notes: null,
};

function FieldRow({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

export default function VendorManagementCard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [draft, setDraft] = useState<Draft>({ ...initialDraft });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ ...initialDraft });

  useEffect(() => {
    if (!uid) return;
    return subscribeVendors(uid, setVendors);
  }, [uid]);

  const canAdd = useMemo(() => draft.name.trim().length > 0, [draft.name]);

  async function onAdd() {
    if (!uid || !canAdd) return;
    setSaving(true);
    try {
      await addVendor(uid, {
        name: draft.name.trim(),
        serviceType: normalizeStr(draft.serviceType),
        phone: normalizeStr(draft.phone),
        budgetEstimate: toNumberOrNull(draft.budgetEstimate),
        status: draft.status ?? "pending",
        notes: normalizeStr(draft.notes),
      });
      setDraft({ ...initialDraft });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(v: Vendor) {
    setEditingId(v.id);
    setEditDraft({
      name: v.name ?? "",
      serviceType: v.serviceType ?? null,
      phone: v.phone ?? null,
      budgetEstimate: v.budgetEstimate ?? null,
      status: (v.status as VendorStatus) ?? "pending",
      notes: v.notes ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!uid || !editingId || editDraft.name.trim() === "") return;
    setSaving(true);
    try {
      await updateVendor(uid, editingId, {
        name: editDraft.name.trim(),
        serviceType: normalizeStr(editDraft.serviceType),
        phone: normalizeStr(editDraft.phone),
        budgetEstimate: toNumberOrNull(editDraft.budgetEstimate),
        status: editDraft.status ?? "pending",
        notes: normalizeStr(editDraft.notes),
      });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!uid) return;
    if (!confirm("Delete this vendor?")) return;
    await deleteVendor(uid, id);
  }

  return (
    <Card dir="rtl">
      <CardHeader title="Vendor Management" subtitle="Track your vendors" />
      <CardContent>
        <div className="border rounded-lg p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FieldRow label="שם ספק (חובה)">
              <input
                className="border rounded px-3 py-2"
                placeholder="שם הספק"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </FieldRow>

            <FieldRow label="סוג שירות">
              <input
                className="border rounded px-3 py-2"
                placeholder="אולם / צלם / DJ / מעצבת / ..."
                value={draft.serviceType ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, serviceType: e.target.value }))
                }
              />
            </FieldRow>

            <FieldRow label="טלפון">
              <input
                className="border rounded px-3 py-2"
                placeholder="מספר טלפון"
                value={draft.phone ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, phone: e.target.value }))
                }
              />
            </FieldRow>

            <FieldRow label="תקציב משוער">
              <input
                className="border rounded px-3 py-2"
                placeholder="לדוגמה: 6000"
                inputMode="numeric"
                value={draft.budgetEstimate ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    budgetEstimate: e.target.value as unknown as number,
                  }))
                }
              />
            </FieldRow>

            <FieldRow label="סטטוס">
              <select
                className="border rounded px-3 py-2"
                value={draft.status ?? "pending"}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    status: e.target.value as VendorStatus,
                  }))
                }
              >
                <option value="pending">ממתין</option>
                <option value="contacted">יצרנו קשר</option>
                <option value="booked">נסגר</option>
                <option value="canceled">בוטל</option>
              </select>
            </FieldRow>

            <FieldRow label="הערות">
              <input
                className="border rounded px-3 py-2"
                placeholder="כל פרט שחשוב לזכור…"
                value={draft.notes ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value }))
                }
              />
            </FieldRow>
          </div>

          <div className="mt-3">
            <button
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              disabled={!canAdd || saving}
              onClick={onAdd}
            >
              הוסף ספק
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {vendors.length === 0 ? (
            <div className="text-neutral-500">אין ספקים עדיין.</div>
          ) : (
            vendors.map((v) =>
              editingId === v.id ? (
                <div key={v.id} className="border rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FieldRow label="שם ספק (חובה)">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.name}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, name: e.target.value }))
                        }
                      />
                    </FieldRow>

                    <FieldRow label="סוג שירות">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.serviceType ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            serviceType: e.target.value,
                          }))
                        }
                      />
                    </FieldRow>

                    <FieldRow label="טלפון">
                      <input
                        className="border rounded px-3 py-2"
                        value={editDraft.phone ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, phone: e.target.value }))
                        }
                      />
                    </FieldRow>

                    <FieldRow label="תקציב משוער">
                      <input
                        className="border rounded px-3 py-2"
                        inputMode="numeric"
                        value={editDraft.budgetEstimate ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            budgetEstimate: e.target.value as unknown as number,
                          }))
                        }
                      />
                    </FieldRow>

                    <FieldRow label="סטטוס">
                      <select
                        className="border rounded px-3 py-2"
                        value={editDraft.status ?? "pending"}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            status: e.target.value as VendorStatus,
                          }))
                        }
                      >
                        <option value="pending">ממתין</option>
                        <option value="contacted">יצרנו קשר</option>
                        <option value="booked">נסגר</option>
                        <option value="canceled">בוטל</option>
                      </select>
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
                      disabled={saving || editDraft.name.trim() === ""}
                    >
                      שמור
                    </button>
                    <button className="px-3 py-2 rounded border" onClick={cancelEdit}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div key={v.id} className="border rounded-lg p-3">
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-sm text-neutral-700">
                      {v.serviceType && <span>סוג שירות: {v.serviceType} · </span>}
                      {v.phone && <span>טלפון: {v.phone} · </span>}
                      {v.budgetEstimate != null && (
                        <span>תקציב: {v.budgetEstimate} · </span>
                      )}
                      {v.status && <span>סטטוס: {mapStatus(v.status)}</span>}
                    </div>
                    {v.notes && (
                      <div className="text-sm text-neutral-600">הערות: {v.notes}</div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button className="px-3 py-2 rounded border" onClick={() => startEdit(v)}>
                      ערוך
                    </button>
                    <button
                      className="px-3 py-2 rounded border text-red-600"
                      onClick={() => onDelete(v.id)}
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

function mapStatus(s?: VendorStatus | null) {
  switch (s) {
    case "contacted":
      return "יצרנו קשר";
    case "booked":
      return "נסגר";
    case "canceled":
      return "בוטל";
    default:
      return "ממתין";
  }
}

function normalizeStr(v?: string | null) {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
}

function toNumberOrNull(v?: unknown) {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
