import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";

function computeDiff(target: Date) {
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes - days * 24 * 60 - hours * 60;
  return { days, hours, minutes };
}

export default function HeroHeader() {
  const { user, profile, logout } = useAuth();

  const displayName = profile?.displayName || user?.displayName || user?.email || "Couple";
  const email = profile?.email || user?.email || "";
  const dateISO = profile?.weddingDate || "";
  const location = profile?.weddingLocation || "";
  const photoURL = profile?.photoURL || user?.photoURL;

  const target = useMemo(() => {
    if (!dateISO) return null;
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateISO);
    return isDateOnly ? new Date(`${dateISO}T00:00:00`) : new Date(dateISO);
  }, [dateISO]);

  const [diff, setDiff] = useState(() => (target ? computeDiff(target) : { days: 0, hours: 0, minutes: 0 }));

  useEffect(() => {
    if (!target) return;
    setDiff(computeDiff(target));
    const id = setInterval(() => setDiff(computeDiff(target)), 1000 * 30);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="max-w-6xl mx-auto">
  <section className="card rounded-2xl p-6 shadow-soft bg-skin-card text-skin-text">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-3">
                      <div className="text-4xl md:text-5xl font-display font-bold tabular-nums">
                        {String(diff.days).padStart(2, "0")}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-skin-muted">Days</div>
                    </div>
                    <div className="h-10 w-px bg-skin-border" />
                    <div className="flex items-baseline gap-3">
                      <div className="text-4xl md:text-5xl font-display font-bold tabular-nums">
                        {String(diff.hours).padStart(2, "0")}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-skin-muted">Hours</div>
                    </div>
                    <div className="h-10 w-px bg-skin-border" />
                    <div className="flex items-baseline gap-3">
                      <div className="text-4xl md:text-5xl font-display font-bold tabular-nums">
                        {String(diff.minutes).padStart(2, "0")}
                      </div>
                      <div className="text-xs uppercase tracking-wider text-skin-muted">Minutes</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2 md:mt-0 text-right">
                <h2 className="text-xl font-semibold text-skin-text">{displayName}'s Wedding</h2>
                {(dateISO || location) && (
                  <p className="text-sm text-skin-muted mt-1">
                    {dateISO && new Date(dateISO).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    {dateISO && location && ' • '}
                    {location}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <div className="flex items-center gap-3 rounded-xl bg-skin-card p-3 shadow-soft">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="h-12 w-12 rounded-full border border-skin-border object-cover shadow-sm" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-skin-bg text-sm font-semibold text-skin-text">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-medium text-skin-text">{displayName}</div>
                {email && <div className="text-xs text-skin-muted">{email}</div>}
              </div>
              <div className="ml-2">
                <button onClick={() => void logout()} className="rounded-lg border border-skin-border bg-skin-card px-3 py-2 text-sm text-skin-muted hover:bg-skin-bg hover:text-skin-text transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
