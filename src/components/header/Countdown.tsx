import { useEffect, useState } from 'react';

type Props = { date: Date };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function Countdown({ date }: Props) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // tick every minute for a calm feel
    const update = () => setNow(new Date());
    update();
    const msUntilNextMin = (60 - now.getSeconds()) * 1000;
    const t = setTimeout(() => {
      update();
      const iv = setInterval(update, 60 * 1000);
      // cleanup interval on unmount
      return () => clearInterval(iv);
    }, msUntilNextMin);
    return () => clearTimeout(t as unknown as number);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
import { useEffect, useState } from "react";

type Props = { date: Date };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function Countdown({ date }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, date.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);

  return (
    <div dir="ltr" className="flex items-center space-x-2 z-10">
  <div className="px-2 py-1 rounded-full bg-card/60 text-sm font-medium">{pad(days)}d</div>
  <div className="px-2 py-1 rounded-full bg-card/60 text-sm font-medium">{pad(hours)}h</div>
  <div className="px-2 py-1 rounded-full bg-card/60 text-sm font-medium">{pad(mins)}m</div>
    </div>
  );
}
