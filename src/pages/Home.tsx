import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, logout } = useAuth();
  return (
    <main className="min-h-screen grid place-items-center bg-white">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Home Dashboard</h2>
        <p className="text-neutral-600">Signed in as {user?.email}</p>
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
