import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, profile, logout } = useAuth();

  const displayName =
    profile?.displayName || user?.displayName || user?.email || "User";
  const email = profile?.email || user?.email || "";
  const photo = profile?.photoURL || user?.photoURL || undefined;

  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Home Dashboard</h2>

        <div className="flex flex-col items-center gap-2">
          {photo ? (
            <img
              src={photo}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover shadow"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="text-neutral-700">
            <div className="font-medium">{displayName}</div>
            {email ? (
              <div className="text-sm text-neutral-500">{email}</div>
            ) : null}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-3 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
