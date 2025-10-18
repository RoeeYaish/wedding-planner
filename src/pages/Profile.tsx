import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateUserProfile } from "@/lib/user-profile";

export default function Profile() {
  const { user, profile, loading } = useAuth();
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => {
    return {
      displayName: profile?.displayName ?? user?.displayName ?? "",
      email: profile?.email ?? user?.email ?? "",
      photoURL: profile?.photoURL ?? user?.photoURL ?? "",
      weddingDate: profile?.weddingDate ?? "",
      weddingLocation: profile?.weddingLocation ?? "",
    };
  }, [profile, user]);

  const [form, setForm] = useState(initial);

  // Keep form in sync when profile finishes loading
  if (!loading && form.email !== (profile?.email ?? user?.email ?? "")) {
    // reset once when data becomes available
    setForm(initial);
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center">
        <div className="text-neutral-500">Loading profile...</div>
      </main>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will redirect
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName.trim() || null,
        weddingDate: form.weddingDate || null,
        weddingLocation: form.weddingLocation.trim() || null,
      });
      // simple UX ping
      alert("Profile saved ✓");
    } catch (err) {
      console.error("Failed updating profile", err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
  <main className="min-h-screen grid place-items-center bg-card">
      <div className="w-full max-w-md p-6 rounded-2xl shadow border border-neutral-100">
        <div className="flex flex-col items-center gap-3 mb-6">
          {form.photoURL ? (
            <img
              src={form.photoURL}
              alt={form.displayName || form.email || "User"}
              className="w-20 h-20 rounded-full object-cover shadow"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <h1 className="text-xl font-semibold">My Profile</h1>
          <p className="text-sm text-neutral-500">{form.email}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Display name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Wedding date</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={form.weddingDate || ""}
              onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Wedding location</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.weddingLocation || ""}
              onChange={(e) => setForm((f) => ({ ...f, weddingLocation: e.target.value }))}
              placeholder="Venue / city"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 rounded bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
