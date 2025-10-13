import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader } from "@/components/ui/Card";
import { addGuest, deleteGuest, subscribeGuests, updateGuest } from "@/lib/guests";
import type { Guest } from "@/lib/guests";

function mapHebrewStatusToRsvp(s?: string): "pending" | "accepted" | "declined" {
  if (!s) return "pending";
  const v = String(s).trim();
  const yes = [
    "\u05de\u05d0\u05d5\u05e9\u05e8",
    "\u05de\u05d0\u05e9\u05e8\u05d9\u05dd",
    "\u05d0\u05d9\u05e9\u05e8\u05d5",
    "\u05db\u05df",
    "\u05de\u05d2\u05d9\u05e2",
    "\u05de\u05d0\u05e9\u05e8",
    "Confirmed",
  ];
  const no = ["\u05dc\u05d0", "\u05dc\u05d0 \u05de\u05d2\u05d9\u05e2", "\u05e1\u05d9\u05e8\u05d1", "Declined"];
  if (yes.some((k) => v.includes(k))) return "accepted";
  if (no.some((k) => v.includes(k))) return "declined";
  return "pending";
}

function normalizeSeats(x: unknown): number {
  const n = Number(String(x ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

async function readSheetFile(file: File): Promise<Record<string, any>[]> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
}

function downloadGuestsTemplate() {
  const headers = [
    "\u05e9\u05dd",
    "\u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d4",
    "\u05de\u05e1\u05e4\u05e8 \u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd",
    "\u05de\u05e1\u05e4\u05e8 \u05d8\u05dc\u05e4\u05d5\u05df",
    "\u05e1\u05d8\u05d8\u05d5\u05e1",
    "\u05d4\u05e2\u05e8\u05d5\u05ea",
  ];
  const sample = [
    ["\u05d9\u05e9\u05e8\u05d0\u05dc \u05d9\u05e9\u05e8\u05d0\u05dc\u05d9", "\u05de\u05e9\u05e4\u05d7\u05d4", "2", "050-1234567", "\u05de\u05d0\u05d5\u05e9\u05e8", "\u05d3\u05d5\u05d2\u05de\u05d4"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  (ws as any)["!rtl"] = true;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "\u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd");
  XLSX.writeFile(wb, "wedding-guests-template.xlsx");
}

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    cleaned[k] = v;
  }
  return cleaned as T;
}

type GuestImport = {
  name: string;
  category?: string;
  seats: number;
  phone?: string;
  statusRaw?: string;
  notes?: string;
  invited: boolean;
  rsvpStatus: "pending" | "accepted" | "declined";
};

function rowsToGuests(rows: Record<string, any>[]) {
  const out: GuestImport[] = [];
  for (const r of rows) {
    const name = String(r["\u05e9\u05dd"] ?? "").trim();
    if (!name) continue;

    const category = String(r["\u05e7\u05d8\u05d2\u05d5\u05e8\u05d9\u05d4"] ?? "").trim();
    const seats = normalizeSeats(r["\u05de\u05e1\u05e4\u05e8 \u05de\u05d5\u05d6\u05de\u05e0\u05d9\u05dd"]);
    const phone = String(r["\u05de\u05e1\u05e4\u05e8 \u05d8\u05dc\u05e4\u05d5\u05df"] ?? "").trim();
    const statusRaw = String(r["\u05e1\u05d8\u05d8\u05d5\u05e1"] ?? "").trim();
    const notes = String(r["\u05d4\u05e2\u05e8\u05d5\u05ea"] ?? "").trim();
    const rsvpStatus = mapHebrewStatusToRsvp(statusRaw);

    const guest: GuestImport = {
      name,
      seats,
      invited: rsvpStatus !== "pending",
      rsvpStatus,
    };

    if (category) guest.category = category;
    if (phone) guest.phone = phone;
    if (notes) guest.notes = notes;
    if (statusRaw) guest.statusRaw = statusRaw;

    out.push(guest);
  }
  return out;
}

async function importGuestsBatch(uid: string, guests: GuestImport[], mode: "append" | "replace") {
  if (mode === "replace") {
    const qSnap = await getDocs(collection(db, "users", uid, "guests"));
    let batch = writeBatch(db);
    let count = 0;
    for (const d of qSnap.docs) {
      batch.delete(d.ref);
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
  for (const g of guests) {
    const ref = doc(collection(db, "users", uid, "guests"));
    const payload = sanitizeForFirestore({
      ...g,
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
    const seats = guests.reduce((acc, g) => acc + (g.seats ?? 0), 0);
    const accepted = guests.filter((g) => g.rsvpStatus === "accepted").length;
    const declined = guests.filter((g) => g.rsvpStatus === "declined").length;
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
    const guestRows = rowsToGuests(rows);
    if (!Array.isArray(guestRows) || guestRows.length === 0) {
      alert("No valid rows found to import.");
      return;
    }
    await importGuestsBatch(user.uid, guestRows, importMode);
    alert(`Imported ${guestRows.length} guests (${importMode}).`);
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
    <Card>
      <CardHeader title="Guest List" subtitle="Manage invites & RSVPs" />

      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-neutral-600">Import mode:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={importMode}
            onChange={onSaveLimitModeChange}
          >
            <option value="append">Append</option>
            <option value="replace">Replace all</option>
          </select>

          <label className="px-3 py-1 border rounded cursor-pointer text-sm hover:bg-neutral-50">
            {isImporting ? "Importing..." : "Import CSV/XLSX"}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={onChooseFile}
              className="hidden"
              disabled={isImporting}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onDownloadTemplate}
          className="text-sm px-3 py-1 border rounded hover:bg-neutral-50"
          title="Download Excel template (Hebrew, RTL)"
        >
          Download Excel Template
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-500">Loading guests...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Total guests" value={totals.totalGuests} />
            <StatBox label="Total seats" value={totals.seats} />
            <StatBox label="Accepted" value={totals.accepted} />
            <StatBox label="Declined" value={totals.declined} />
          </div>

          <form onSubmit={onAddGuestSubmit} className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <input
              required
              className="border rounded px-3 py-2 sm:col-span-2 lg:col-span-2"
              placeholder="Guest name"
              value={form.name}
              onChange={handleChange("name")}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Category"
              value={form.category}
              onChange={handleChange("category")}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Seats"
              value={form.seats}
              onChange={handleChange("seats")}
              inputMode="numeric"
            />
            <select
              className="border rounded px-3 py-2"
              value={form.status}
              onChange={handleChange("status")}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
            <input
              className="border rounded px-3 py-2 sm:col-span-2 lg:col-span-2"
              placeholder="Notes"
              value={form.notes}
              onChange={handleChange("notes")}
            />
            <button
              type="submit"
              className="border rounded px-3 py-2 bg-neutral-900 text-white hover:bg-neutral-800 sm:col-span-2 lg:col-span-1"
            >
              Add guest
            </button>
          </form>

          {guests.length === 0 ? (
            <div className="text-sm text-neutral-500">No guests yet.</div>
          ) : (
            <div className="space-y-2">
              {guests.slice(0, 50).map((guest) => (
                <div
                  key={guest.id}
                  className="flex flex-col gap-2 rounded border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{guest.name}</span>
                      <span className="text-xs text-neutral-500">
                        {guest.seats} seat{guest.seats === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {guest.category ? `${guest.category} • ` : ""}
                      Status: {guest.rsvpStatus}
                      {guest.statusRaw ? ` (${guest.statusRaw})` : ""}
                      {guest.notes ? ` • ${guest.notes}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={guest.rsvpStatus}
                      onChange={(e) => onStatusChange(guest, e.target.value as Guest["rsvpStatus"])}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onDeleteGuest(guest)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {guests.length > 50 ? (
                <div className="text-xs text-neutral-500">
                  Showing first 50 guests. Use exports or filters for more.
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-xs text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-neutral-900">{value}</div>
    </div>
  );
}
