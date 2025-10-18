import { useEffect, useMemo, useState } from "react";

type Props = {
  targetISO: string; // yyyy-mm-dd or full ISO
};

type Diff = { days: number; hours: number; minutes: number };

function computeDiff(target: Date): Diff {
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes - days * 24 * 60 - hours * 60;
  return { days, hours, minutes };
}

export default function Countdown({ targetISO }: Props) {
  const target = useMemo(() => {
    // support date-only (yyyy-mm-dd) by anchoring to local midnight
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(targetISO);
    return isDateOnly ? new Date(`${targetISO}T00:00:00`) : new Date(targetISO);
  }, [targetISO]);

  const [diff, setDiff] = useState<Diff>(() => computeDiff(target));

  useEffect(() => {
    const id = setInterval(() => setDiff(computeDiff(target)), 1000 * 30);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="text-center">
      <div className="mb-3 text-sm font-medium text-muted uppercase tracking-wide">
        Days Until Wedding
      </div>
      <div className="flex items-center justify-center gap-4">
        <TimeBox label="Days" value={diff.days} />
        <div className="h-8 w-px bg-border"></div>
        <TimeBox label="Hours" value={diff.hours} />
        <div className="h-8 w-px bg-border"></div>
        <TimeBox label="Minutes" value={diff.minutes} />
      </div>
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-bold text-ink tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs text-muted uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
