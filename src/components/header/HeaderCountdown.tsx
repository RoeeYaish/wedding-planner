import { useEffect, useState } from 'react';

type Props = { date: Date };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function HeaderCountdown({ date }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // tick every minute for a calm feel
    const update = () => setNow(new Date());
    update();
    const msUntilNextMin = (60 - new Date().getSeconds()) * 1000;
    let intervalId: number | null = null;
    const timeout = setTimeout(() => {
      update();
      intervalId = window.setInterval(update, 60 * 1000);
    }, msUntilNextMin);
    return () => {
      clearTimeout(timeout as unknown as number);
      if (intervalId) clearInterval(intervalId);
    };
  }, [date]);

  const diff = Math.max(0, date.getTime() - now.getTime());
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;

  const Stat = ({ label, value }: { label: string; value: number | string }) => (
    <div className="flex flex-col items-center">
      <div className="text-lg font-semibold tabular-nums">{typeof value === 'number' ? pad(value) : value}</div>
      <div className="text-xs uppercase tracking-wide text-skin-muted">{label}</div>
    </div>
  );

  const Dot = () => <div className="w-1 h-1 rounded-full bg-skin-muted opacity-60" />;

  return (
    <div className="flex items-center gap-6 rounded-2xl bg-skin-blush/30 px-3 py-2 shadow-soft">
      <Stat label="Days" value={days} />
      <Dot />
      <Stat label="Hours" value={hours} />
      <Dot />
      <Stat label="Minutes" value={mins} />
    </div>
  );
}
