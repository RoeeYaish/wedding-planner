import { useEffect, useMemo, useState, type InputHTMLAttributes } from "react";
import { useAuth } from "@/lib/auth-context";
import { SectionCard } from "@/components/ui/section-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Button } from "@/components/ui/primitives";

import {
  addVendor,
  deleteVendor,
  subscribeVendors,
  updateVendor,
  type Vendor,
  type VendorStatus,
} from "@/lib/vendors";

const inputClass =
  "w-full rounded-xl border border-border bg-paper px-4 py-2 text-sm shadow-soft transition-all placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-gold/30 focus:shadow-lift";
const outlineButton =
  "inline-flex items-center justify-center rounded-xl border border-border bg-paper px-4 py-2 text-sm font-medium text-ink shadow-soft transition-all hover:bg-ivory hover:shadow-lift";
const primaryButton =
  "inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2 text-sm font-medium text-paper shadow-soft transition-all hover:bg-gold/90 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50";

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

type FieldInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
  placeholder?: string;
};

export default function VendorManagementCard() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>({ ...initialDraft });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>({ ...initialDraft });

  useEffect(() => {
    if (!uid) {
      setVendors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeVendors(uid, (items) => {
      setVendors(items);
      setLoading(false);
    });
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
    <SectionCard title="Vendor Management" subtitle="Track your vendors" className="scroll-body">
      <div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <FieldInput label="שם ספק (חובה)" value={draft.name} onChange={(value) => setDraft((d) => ({ ...d, name: value }))} required />

          <FieldInput label="סוג שירות" value={draft.serviceType ?? ""} onChange={(value) => setDraft((d) => ({ ...d, serviceType: value }))} />

          <FieldInput label="טלפון" value={draft.phone ?? ""} onChange={(value) => setDraft((d) => ({ ...d, phone: value }))} />

          <FieldInput label="תקציב משוער" value={draft.budgetEstimate ?? ""} onChange={(value) => setDraft((d) => ({ ...d, budgetEstimate: value }))} inputMode="numeric" />

          <div>
            <label className="mb-1 block text-xs text-gray-500">סטטוס</label>
            <Select className={`${inputClass} pr-8`} value={draft.status ?? "pending"} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as VendorStatus }))}>
              <option value="pending">בהמתנה</option>
              <option value="contacted">יצרנו קשר</option>
              <option value="booked">נסגר</option>
              <option value="canceled">בוטל</option>
            </Select>
          </div>

          <FieldInput label="הערות" value={draft.notes ?? ""} onChange={(value) => setDraft((d) => ({ ...d, notes: value }))} />
        </div>

        <div className="mt-3 flex justify-end">
          <Button className={primaryButton} onClick={onAdd} disabled={!canAdd || saving}>
            הוסיפו ספק חדש
          </Button>
        </div>
      </div>

      {loading ? (
        <div>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="mb-2 h-4 w-full last:mb-0" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-xl bg-ivory p-8 text-center text-muted" dir="rtl">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-sm font-medium mb-1">אין ספקים עדיין</p>
          <p className="text-xs">הוסיפו ספק ראשון כדי להתחיל</p>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {vendors.map((vendor) => {
            if (editingId === vendor.id) {
              return (
                <div
                  key={vendor.id}
                  className="rounded-xl border border-border bg-paper p-4 shadow-soft"
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
                      <label className="mb-1 block text-xs text-gray-500">סטטוס</label>
                      <select
                        className={`${inputClass} pr-8`}
                        value={editDraft.status ?? "pending"}
                        onChange={(e) =>
                          setEditDraft((d) => ({ ...d, status: e.target.value as VendorStatus }))
                        }
                      >
                        <option value="pending">בהמתנה</option>
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

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className={primaryButton} onClick={saveEdit} disabled={saving}>
                      עדכון
                    </button>

                    <button className={outlineButton} onClick={cancelEdit}>
                      ביטול
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={vendor.id}
                className="rounded-xl border border-border bg-paper p-4 shadow-soft transition-all hover:bg-ivory hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-ink text-base mb-2">{vendor.name}</div>
                    <div className="space-y-1 text-sm text-muted">
                      {vendor.phone && <div>{vendor.phone}</div>}
                      {vendor.serviceType && <Badge variant="secondary" className="text-xs">{vendor.serviceType}</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button className="rounded border border-border bg-paper px-2 py-1 text-ink shadow-soft transition-all hover:bg-ivory hover:shadow-lift" onClick={() => startEdit(vendor)}>
                      עריכה
                    </button>
                    <button
                      className="rounded border border-red-200 bg-paper px-2 py-1 text-red-600 shadow-soft transition-all hover:bg-red-50 hover:shadow-lift"
                      onClick={() => onDelete(vendor.id)}
                    >
                      מחיקה
                    </button>
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

function normalizeStr(value?: string | null) {
  if (!value) {
    return null;
  }
  return value.trim().replace(/\s+/g, " ");
}

function toNumberOrNull(value?: string | null) {
  if (!value) return null;
  const num = Number(value.replace(/[^0-9.-]+/g, ""));
  return isNaN(num) ? null : num;
}

function FieldInput({
  label,
  value,
  onChange,
  inputMode,
  required,
  placeholder,
}: FieldInputProps) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
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

