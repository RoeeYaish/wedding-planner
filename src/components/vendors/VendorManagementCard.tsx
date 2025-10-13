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
import { Card, CardContent } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/section-header";

const inputClass =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200";
const outlineButton =
  "inline-flex items-center justify-center rounded border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100";
const primaryButton =
  "inline-flex items-center justify-center rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed";

type Draft = {
  name: string;
  serviceType?: string | null;
  phone?: string | null;
  budgetEstimate?: string | null;
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
      budgetEstimate: v.budgetEstimate != null ? String(v.budgetEstimate) : null,
      status: (v.status as VendorStatus) ?? "pending",
      notes: v.notes ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit() {
    if (!uid || !editingId || editDraft.name?.trim() === "") return;
    setSaving(true);
    try {
      await updateVendor(uid, editingId, {
        name: editDraft.name?.trim() ?? "",
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
      <CardContent className="space-y-4">
        <SectionHeader title="Vendor Management" subtitle="Track your vendors" />

        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FieldInput
              label="שם ספק (חובה)"
              value={draft.name}
              onChange={(value) => setDraft((d) => ({ ...d, name: value }))}
              required
            />
            <FieldInput
              label="סוג שירות"
              value={draft.serviceType ?? ""}
              onChange={(value) => setDraft((d) => ({ ...d, serviceType: value }))}
            />
            <FieldInput
              label="טלפון"
              value={draft.phone ?? ""}
              onChange={(value) => setDraft((d) => ({ ...d, phone: value }))}
            />
            <FieldInput
              label="תקציב משוער"
              value={draft.budgetEstimate ?? ""}
              onChange={(value) => setDraft((d) => ({ ...d, budgetEstimate: value }))}
              inputMode="numeric"
            />
            <div>
              <label className="mb-1 block text-xs text-neutral-500">סטטוס</label>
              <select
                className={`${inputClass} pr-8`}
                value={draft.status ?? "pending"}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as VendorStatus }))}
              >
                <option value="pending">ממתין</option>
                <option value="contacted">יצרנו קשר</option>
                <option value="booked">נסגר</option>
                <option value="canceled">בוטל</option>
              </select>
            </div>
            <FieldInput
              label="הערות"
              value={draft.notes ?? ""}
              onChange={(value) => setDraft((d) => ({ ...d, notes: value }))}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button className={primaryButton} onClick={onAdd} disabled={!canAdd || saving}>
              הוסף ספק
            </button>
          </div>
        </div>

        {vendors.length === 0 ? (
          <div className="text-sm text-neutral-500">אין ספקים עדיין.</div>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {vendors.map((vendor) =>
              editingId === vendor.id ? (
                <div
                  key={vendor.id}
                  className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <FieldInput
                      label="שם ספק (חובה)"
                      value={editDraft.name ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, name: value }))}
                      required
                    />
                    <FieldInput
                      label="סוג שירות"
                      value={editDraft.serviceType ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, serviceType: value }))}
                    />
                    <FieldInput
                      label="טלפון"
                      value={editDraft.phone ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, phone: value }))}
                    />
                    <FieldInput
                      label="תקציב משוער"
                      value={editDraft.budgetEstimate ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, budgetEstimate: value }))}
                      inputMode="numeric"
                    />
                    <div>
                      <label className="mb-1 block text-xs text-neutral-500">סטטוס</label>
                      <select
                        className={`${inputClass} pr-8`}
                        value={editDraft.status ?? "pending"}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, status: e.target.value as VendorStatus }))
                        }
                      >
                        <option value="pending">ממתין</option>
                        <option value="contacted">יצרנו קשר</option>
                        <option value="booked">נסגר</option>
                        <option value="canceled">בוטל</option>
                      </select>
                    </div>
                    <FieldInput
                      label="הערות"
                      value={editDraft.notes ?? ""}
                      onChange={(value) => setEditDraft((d) => ({ ...d, notes: value }))}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className={primaryButton} onClick={saveEdit} disabled={saving}>
                      שמור
                    </button>
                    <button className={outlineButton} onClick={cancelEdit}>
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={vendor.id}
                  className="space-y-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                >
                  <div className="text-base font-semibold text-neutral-900">{vendor.name}</div>
                  <div className="text-sm text-neutral-600">
                    {vendor.serviceType ? `סוג שירות: ${vendor.serviceType}` : ""}
                    {vendor.serviceType && vendor.phone ? " · " : ""}
                    {vendor.phone ? `טלפון: ${vendor.phone}` : ""}
                    {vendor.budgetEstimate != null ? ` · תקציב: ${vendor.budgetEstimate}` : ""}
                  </div>
                  <div className="text-sm text-neutral-600">סטטוס: {mapStatus(vendor.status)}</div>
                  {vendor.notes ? (
                    <div className="text-sm text-neutral-500">הערות: {vendor.notes}</div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <button className={outlineButton} onClick={() => startEdit(vendor)}>
                      ערוך
                    </button>
                    <button
                      className={`${outlineButton} border-red-200 text-red-600 hover:bg-red-50`}
                      onClick={() => onDelete(vendor.id)}
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

function mapStatus(status?: VendorStatus | null) {
  switch (status) {
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
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
      />
    </div>
  );
}
