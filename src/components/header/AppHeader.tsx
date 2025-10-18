import HeaderCountdown from './HeaderCountdown';
import UserMenu from './UserMenu';
import { useAuth } from '@/lib/auth-context';

export default function AppHeader() {
  const { profile } = useAuth();

  const title = profile?.displayName ? `${profile.displayName}'s Wedding` : "Your Wedding";
  const dateStr = profile?.weddingDate ?? '';
  const location = profile?.weddingLocation ?? '';

  const hasDate = !!dateStr;
  let dateObj: Date | null = null;
  if (hasDate) {
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
    dateObj = isDateOnly ? new Date(`${dateStr}T00:00:00`) : new Date(dateStr);
  }

  return (
    <header className="w-full sticky top-0 bg-skin-header border-b border-skin-muted/30 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <div className="text-sm font-semibold">Wedding Planner</div>
        </div>

        <div className="flex-1 flex flex-col items-center text-center px-4">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-skin-muted">{hasDate ? `${dateObj?.toLocaleDateString()} • ${location}` : 'Set your wedding date'}</div>
          {dateObj ? <div className="mt-2"><HeaderCountdown date={dateObj} /></div> : null}
        </div>

        <div className="flex items-center">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
