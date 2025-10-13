import { Link } from "react-router-dom";
import Countdown from "@/components/Countdown";
import { Card, CardContent } from "@/components/ui/Card";

type ProfileCountdownCardProps = {
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
  dateISO?: string | null;
  location?: string | null;
  onLogout: () => void;
};

const primaryButton =
  "inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100";

export default function ProfileCountdownCard({
  displayName,
  email,
  photoURL,
  dateISO,
  location,
  onLogout,
}: ProfileCountdownCardProps) {
  return (
    <Card className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 shadow-sm">
      <CardContent className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-3">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="h-20 w-20 rounded-full border border-white object-cover shadow"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-200 text-2xl font-semibold text-neutral-600">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-neutral-900">{displayName}</h2>
            {email ? <p className="text-sm text-neutral-500">{email}</p> : null}
            {location ? <p className="text-xs text-neutral-500">מיקום: {location}</p> : null}
          </div>
        </div>

        {dateISO ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-medium text-neutral-500">הספירה לאחור ליום הגדול</span>
            <Countdown targetISO={dateISO} />
            <p className="text-xs text-neutral-500">תאריך: {dateISO}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">
              טרם הוגדר תאריך לחתונה.{" "}
              <Link to="/profile" className="text-blue-600 hover:underline">
                הגדירו פרטי חתונה
              </Link>
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          <Link to="/profile" className={secondaryButton}>
            עריכת פרופיל
          </Link>
          <button onClick={onLogout} className={primaryButton}>
            Logout
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
