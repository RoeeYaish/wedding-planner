import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, profile, logout } = useAuth();

  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold">Home Dashboard</h2>

        <div className="flex flex-col items-center gap-2">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName || "User"}
              className="w-16 h-16 rounded-full object-cover shadow"
            />
          ) : null}
          <div className="text-neutral-700">
            <div className="font-medium">
              {profile?.displayName || user?.email || "User"}
            </div>
            <div className="text-sm text-neutral-500">{profile?.email}</div>
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
