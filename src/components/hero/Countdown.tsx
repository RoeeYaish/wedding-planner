import { useEffect, useMemo, useState } from "react";

type Props = { date: Date };

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

export default function Countdown({ date }: Props) {
  const target = useMemo(() => new Date(date), [date]);
  const [diff, setDiff] = useState<Diff>(() => computeDiff(target));

  useEffect(() => {
    const id = setInterval(() => setDiff(computeDiff(target)), 1000 * 30);
    setDiff(computeDiff(target));
    return () => clearInterval(id);
  }, [target]);

  function TimeBox({ label, value }: { label: string; value: number }) {
    return (
      <div className="flex flex-col items-center">
  <div className="text-4xl md:text-5xl font-display font-semibold tabular-nums text-skin-text">
          {String(value).padStart(2, "0")}
        </div>
  <div className="text-xs text-skin-muted uppercase tracking-wide mt-1">{label}</div>
      </div>
    );
  }

  // Force LTR order so the countdown always reads Days -> Hours -> Minutes
  return (
    <div dir="ltr" className="flex items-center justify-center gap-6">
      <TimeBox label="Days" value={diff.days} />
      <div className="h-8 w-px bg-border" />
      <TimeBox label="Hours" value={diff.hours} />
      <div className="h-8 w-px bg-border" />
      <TimeBox label="Minutes" value={diff.minutes} />
    </div>
  );
}
