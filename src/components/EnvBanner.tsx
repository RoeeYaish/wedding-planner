export default function EnvBanner() {
  const mask = (v?: string) => (v ? v.slice(0, 4) + "..." + v.slice(-4) : "MISSING");
  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        left: 8,
        background: "#000000cc",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 12,
        zIndex: 9999,
      }}
    >
      env: {import.meta.env.MODE} | apiKey: {mask(import.meta.env.VITE_FIREBASE_API_KEY)} | projectId:{" "}
      {import.meta.env.VITE_FIREBASE_PROJECT_ID || "MISSING"} | authDomain:{" "}
      {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "MISSING"}
    </div>
  );
}
