import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { SectionCard } from "@/components/ui/section-card";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { addGuest, deleteGuest, subscribeGuests, updateGuest } from "@/lib/guests";
import type { Guest } from "@/lib/guests";

function mapHebrewStatusToRsvp(s?: string): "pending" | "accepted" | "declined" {
  if (!s) return "pending";
  const value = String(s).trim();
  const acceptedTokens = ["מאושר", "מאשרים", "אישרו", "כן", "מגיע", "מאשר", "Confirmed"];
  const declinedTokens = ["לא", "לא מגיע", "סירב", "Declined"];
  if (acceptedTokens.some((token) => value.includes(token))) return "accepted";
  if (declinedTokens.some((token) => value.includes(token))) return "declined";
  return "pending";
}

function normalizeSeats(x: unknown): number {
  const n = Number(String(x ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

async function readSheetFile(file: File): Promise<Record<string, unknown>[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // XLSX typings are loose; return unknown records and validate later
  return XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, unknown>[];
}

function downloadGuestsTemplate() {
  const headers = ["שם", "קטגוריה", "מספר מוזמנים", "מספר טלפון", "סטטוס", "הערות", "הנחיות"];
  const instructionText =
    "חשוב: שדה 'שם' הוא השדה היחיד שחובה למלא. שאר העמודות אינן חובה ויכולות להישאר ריקות. " +
    "יש להעלות את הקובץ בדיוק עם כותרות העמודות כפי שמופיע כאן, ללא הוספת עמודות נוספות או שינוי שמות העמודות. " +
    "עמודה זו ('הנחיות') נועדה להסבר בלבד ואינה מיובאת למערכת.";

  const ws = XLSX.utils.aoa_to_sheet([headers, ["", "", "", "", "", "", instructionText]]);
  // XLSX has loose typings; use unknown casts for the sheet helpers
  (ws as unknown as Record<string, unknown>)["!rtl"] = true;
  (ws as unknown as Record<string, unknown>)["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "מוזמנים");
  XLSX.writeFile(wb, "wedding-guests-template.xlsx");
}

function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    cleaned[key] = value;
  }
  return cleaned as T;
}

type GuestImport = {
  name: string;
  category: string | null;
  seats: number | null;
  phone: string | null;
  statusRaw: string | null;
  notes: string | null;
  invited: boolean;
  rsvpStatus: "pending" | "accepted" | "declined";
};

function rowsToGuests(rows: Record<string, unknown>[]) {
  const out: GuestImport[] = [];
  for (const r of rows) {
    const name = String(r["שם"] ?? "").trim();
    if (!name) continue;

    const categoryRaw = String(r["קטגוריה"] ?? "").trim();
    const phoneRaw = String(r["מספר טלפון"] ?? "").trim();
    const statusRawRaw = String(r["סטטוס"] ?? "").trim();
    const notesRaw = String(r["הערות"] ?? "").trim();
    const seatsCell = r["מספר מוזמנים"];

    let seats: number | null = null;
    if (seatsCell !== undefined && seatsCell !== null && String(seatsCell).trim() !== "") {
      const parsed = Number(String(seatsCell).replace(/[^\d.]/g, ""));
      seats = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
    }

    const rsvpStatus = mapHebrewStatusToRsvp(statusRawRaw);

    out.push({
      name,
      category: categoryRaw || null,
      seats,
      phone: phoneRaw || null,
      statusRaw: statusRawRaw || null,
      notes: notesRaw || null,
      invited: rsvpStatus !== "pending",
      rsvpStatus,
    });
  }
  return out;
}

async function importGuestsBatch(uid: string, guests: GuestImport[], mode: "append" | "replace") {
  if (mode === "replace") {
    const qSnap = await getDocs(collection(db, "users", uid, "guests"));
    let batch = writeBatch(db);
    let count = 0;
    for (const docSnap of qSnap.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 450 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count > 0) {
      await batch.commit();
    }
  }

  if (guests.length === 0) return;

  let batch = writeBatch(db);
  let count = 0;
  for (const guest of guests) {
    const ref = doc(collection(db, "users", uid, "guests"));
    const payload = sanitizeForFirestore({
      ...guest,
      seats: guest.seats ?? null,
      invited: guest.invited ?? false,
      rsvpStatus: guest.rsvpStatus ?? "pending",
      createdAt: serverTimestamp(),
    });
    batch.set(ref, payload);
    count++;
    if (count % 450 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count > 0) {
    await batch.commit();
  }
}

type FormState = {
  name: string;
  seats: string;
  status: "pending" | "accepted" | "declined";
  category: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  seats: "1",
  status: "pending",
  category: "",
  notes: "",
};

export default function GuestListCard() {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isImporting, setIsImporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    category: "",
    seats: "",
    phone: "",
    status: "pending" as Guest["rsvpStatus"],
    notes: "",
  });

  const inputClass =
     "w-full rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm shadow-soft transition-all placeholder:text-skin-muted focus:outline-none focus:ring-1 focus:ring-skin-primary/30 focus:shadow-lift";
  const outlineButton =
    "inline-flex items-center justify-center rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm font-medium text-skin-text shadow-soft transition-all hover:bg-skin-bg hover:shadow-lift";
  const primaryButton =
     "inline-flex items-center justify-center rounded-xl bg-skin-primary px-4 py-2 text-sm font-medium text-skin-card shadow-soft transition-all hover:bg-skin-primary600 hover:shadow-lift disabled:pointer-events-none disabled:opacity-50";

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeGuests(
      user.uid,
      (items) => {
        setGuests(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Guests subscription error:", err);
        setError("Failed to load guests. Check Firestore rules.");
        setLoading(false);
      }
    );
    return () => unsub?.();
  }, [user]);

  const totals = useMemo(() => {
    const totalGuests = guests.length;
    const seats = guests.reduce((sum, guest) => sum + (guest.seats ?? 0), 0);
    const accepted = guests.filter((guest) => guest.rsvpStatus === "accepted").length;
    const declined = guests.filter((guest) => guest.rsvpStatus === "declined").length;
    return { totalGuests, seats, accepted, declined };
  }, [guests]);

  const onSaveLimitModeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setImportMode(e.target.value as "append" | "replace");
  };

  const onDownloadTemplate = () => {
    downloadGuestsTemplate();
  };

  const onChooseFile = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const rows = await readSheetFile(file);
      const guestsRows = rowsToGuests(rows);
      if (!Array.isArray(guestsRows) || guestsRows.length === 0) {
        alert("No valid rows found to import.");
        return;
      }
      await importGuestsBatch(user.uid, guestsRows, importMode);
      alert(`Imported ${guestsRows.length} guests (${importMode}).`);
    } catch (err) {
      console.error(err);
      alert("Import failed. See console for details.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const handleChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onAddGuestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const name = form.name.trim();
    if (!name) return;
    const seats = normalizeSeats(form.seats);
    await addGuest(user.uid, {
      name,
      seats,
      invited: form.status !== "pending",
      rsvpStatus: form.status,
      category: form.category.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
    setForm(initialForm);
  };

  const startEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditDraft({
      name: guest.name ?? "",
      category: guest.category ?? "",
      seats: guest.seats?.toString() ?? "",
      phone: guest.phone ?? "",
      status: guest.rsvpStatus ?? "pending",
      notes: guest.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!user || !editingId || editDraft.name.trim() === "") return;
    await updateGuest(user.uid, editingId, {
      name: editDraft.name.trim(),
      category: editDraft.category.trim() || null,
      seats: editDraft.seats ? Number(editDraft.seats) : null,
      phone: editDraft.phone.trim() || null,
      rsvpStatus: editDraft.status,
      notes: editDraft.notes.trim() || null,
    });
    setEditingId(null);
  };

  const onStatusChange = async (guest: Guest, status: Guest["rsvpStatus"]) => {
    if (!user || guest.rsvpStatus === status) return;
    await updateGuest(user.uid, guest.id, {
      rsvpStatus: status,
      invited: status !== "pending",
    });
  };

  const onDeleteGuest = async (guest: Guest) => {
    if (!user) return;
    if (!confirm(`Remove ${guest.name}?`)) return;
    await deleteGuest(user.uid, guest.id);
  };

  return (
    <SectionCard 
      title="Guest List" 
      subtitle="Manage your wedding guests" 
      className="scroll-body"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-skin-muted">Import mode:</span>
          <Select className="rounded-xl border border-skin-border bg-skin-card px-3 py-1 text-xs" value={importMode} onChange={onSaveLimitModeChange}>
            <option value="append">Append</option>
            <option value="replace">Replace all</option>
          </Select>
          <label className="cursor-pointer rounded-xl border border-skin-border bg-skin-card px-3 py-1 text-xs text-skin-text transition-all hover:bg-skin-bg">
            {isImporting ? "Importing..." : "Import CSV/XLSX"}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={onChooseFile} className="hidden" disabled={isImporting} />
          </label>
          <Button className="rounded-xl border border-skin-border bg-skin-card px-3 py-1 text-xs text-skin-text" type="button" onClick={onDownloadTemplate}>
            Download Template
          </Button>
        </div>
      }
    >

      {loading ? (
        <div>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="mb-2 h-4 w-full last:mb-0" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="grid gap-2 rounded-lg border border-skin-border bg-skin-bg p-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total guests" value={totals.totalGuests} />
            <StatBox label="Total seats" value={totals.seats} />
            <StatBox label="Accepted" value={totals.accepted} />
            <StatBox label="Declined" value={totals.declined} />
          </div>

          <form onSubmit={onAddGuestSubmit} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <Input required className={`${inputClass} sm:col-span-2 lg:col-span-2`} placeholder="Guest name" value={form.name} onChange={handleChange("name")} />
            <Input className={inputClass} placeholder="Category" value={form.category} onChange={handleChange("category")} />
            <Input className={inputClass} placeholder="Seats" value={form.seats} onChange={handleChange("seats")} inputMode="numeric" />
            <Select className={`${inputClass} pr-8`} value={form.status} onChange={handleChange("status")}>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </Select>
            <Input className={`${inputClass} sm:col-span-2 lg:col-span-2`} placeholder="Notes" value={form.notes} onChange={handleChange("notes")} />
            <Button className={`${primaryButton} sm:col-span-2 lg:col-span-1`} type="submit">Add guest</Button>
          </form>

          {guests.length === 0 ? (
            <div className="rounded-xl bg-skin-bg p-8 text-center text-skin-muted" dir="rtl">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-sm font-medium mb-1">אין מוזמנים עדיין</p>
              <p className="text-xs">הוסיפו מוזמן ראשון כדי להתחיל</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1 divide-y divide-skin-border">
              {guests.map((guest) =>
                editingId === guest.id ? (
                  <div key={guest.id} className="p-4 bg-skin-card">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FieldInput
                        label="Guest name"
                        value={editDraft.name}
                        onChange={(val) => setEditDraft((d) => ({ ...d, name: val }))}
                        required
                      />
                      <FieldInput
                        label="Category"
                        value={editDraft.category}
                        onChange={(val) => setEditDraft((d) => ({ ...d, category: val }))}
                      />
                      <FieldInput
                        label="Seats"
                        value={editDraft.seats}
                        onChange={(val) => setEditDraft((d) => ({ ...d, seats: val }))}
                        inputMode="numeric"
                      />
                      <FieldInput
                        label="Phone"
                        value={editDraft.phone}
                        onChange={(val) => setEditDraft((d) => ({ ...d, phone: val }))}
                      />
                      <div>
                        <select
                          className={`${inputClass} pr-8`}
                          value={editDraft.status}
                          onChange={(e) =>
                            setEditDraft((d) => ({
                              ...d,
                              status: e.target.value as Guest["rsvpStatus"],
                            }))
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>
                      <FieldInput
                        label="Notes"
                        value={editDraft.notes}
                        onChange={(val) => setEditDraft((d) => ({ ...d, notes: val }))}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button className={primaryButton} onClick={saveEdit}>
                        Save
                      </button>
                      <button className={outlineButton} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={guest.id} className="p-4 bg-skin-card">
                    <div className="text-right">
                      <div className="text-base font-semibold text-skin-text">{guest.name}</div>
                      <div className="mt-2 space-y-2 text-sm text-skin-muted">
                        <div>
                          Seats: {guest.seats != null ? guest.seats : "-"}
                          {guest.category ? ` - Category: ${guest.category}` : ""}
                        </div>
                        <div>
                          Status: {guest.rsvpStatus}
                          {guest.statusRaw ? ` (${guest.statusRaw})` : ""}
                        </div>
                        {guest.notes ? (
                          <div>
                            Notes: {guest.notes}
                          </div>
                        ) : null}
                        {guest.phone ? (
                          <div>
                            Phone: {guest.phone}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <select
                        className={`${inputClass} w-auto pr-8`}
                        value={guest.rsvpStatus}
                        onChange={(e) =>
                          onStatusChange(guest, e.target.value as Guest["rsvpStatus"])
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                      </select>
                      <button className={outlineButton} onClick={() => startEdit(guest)}>
                        Edit
                      </button>
                      <button
                        className={`${outlineButton} border-red-200 text-red-600 hover:bg-red-50`}
                        onClick={() => onDeleteGuest(guest)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-xl border border-skin-border shadow-soft" dir="rtl">
            <table className="min-w-full">
              <thead className="sticky top-0 bg-skin-card text-xs font-medium text-skin-text">
                <tr>
                  <th className="border-b border-skin-border px-3 py-2 text-right">שם</th>
                  <th className="border-b border-skin-border px-3 py-2 text-right">קטגוריה</th>
                  <th className="border-b border-skin-border px-3 py-2 text-right">מס' מוזמנים</th>
                  <th className="border-b border-skin-border px-3 py-2 text-right">מספר טלפון</th>
                  <th className="border-b border-skin-border px-3 py-2 text-right">סטטוס</th>
                  <th className="border-b border-skin-border px-3 py-2 text-right">הערות</th>
                </tr>
              </thead>
              <tbody>
                {guests.length > 0 ? (
                  guests.map((g, index) => (
                    <tr key={g.id} className={`text-sm transition-all hover:bg-skin-bg ${index % 2 === 0 ? 'bg-skin-card' : 'bg-skin-bg'}`}>
                      <td className="border-b border-skin-border px-3 py-2 text-skin-text font-medium truncate max-w-0" title={g.name}>{g.name}</td>
                      <td className="border-b border-skin-border px-3 py-2 text-skin-muted truncate max-w-0" title={g.category ?? ""}>{g.category ?? ""}</td>
                      <td className="border-b border-skin-border px-3 py-2 text-skin-text text-center">{g.seats ?? ""}</td>
                      <td className="border-b border-skin-border px-3 py-2 text-skin-muted">{g.phone ?? ""}</td>
                      <td className="border-b border-skin-border px-3 py-2">
                        <StatusBadge status={g.rsvpStatus} />
                      </td>
                      <td className="border-b border-skin-border px-3 py-2 text-skin-muted truncate max-w-0" title={g.notes ?? ""}>{g.notes ?? ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-skin-muted text-center" colSpan={6}>
                      אין מוזמנים להצגה כרגע.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </SectionCard>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
  <div className="rounded border border-skin-border bg-skin-card px-3 py-2 text-right">
      <div className="text-xs text-skin-muted uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-skin-text">{value}</div>
    </div>
  );
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
      <label className="mb-1 block text-xs text-skin-muted">{label}</label>
      <input
        className="w-full rounded border border-skin-border bg-skin-card px-3 py-2 text-sm placeholder:text-skin-muted focus:outline-none focus:ring-2 focus:ring-skin-overlay"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        required={required}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "accepted" | "declined" }) {
  const map = {
    pending: { label: "Pending", variant: "outline" as const },
    accepted: { label: "Attending", variant: "default" as const },
    declined: { label: "Declined", variant: "destructive" as const },
  }[status];

  return <Badge variant={map.variant}>{map.label}</Badge>;
}
