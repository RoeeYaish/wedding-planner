import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { setTheme, getTheme, type ThemeName } from '@/lib/theme'
import { useLocation } from 'react-router-dom';

export default function UserMenu() {
  const { user, profile, loading, signInWithGoogle, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // click-outside & Esc handling (hooks must be called unconditionally)
  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // close on route change
  useEffect(() => {
    if (!open) return;
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.pathname]);

  if (loading) return <div className="w-8 h-8 rounded-full bg-skin-bg" />;

  if (!user) {
    return (
      <button className="btn-primary" onClick={() => signInWithGoogle()}>
        Login
      </button>
    );
  }

  const name = profile?.displayName ?? user.displayName ?? user.email ?? "User";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="relative">
      <button ref={triggerRef} className="w-9 h-9 rounded-full bg-skin-bg flex items-center justify-center" onClick={() => setOpen((v) => !v)}>
        {user.photoURL ? <img src={user.photoURL} alt={name} className="w-9 h-9 rounded-full object-cover" /> : <span className="text-sm font-semibold truncate">{initials}</span>}
      </button>
      {open ? (
        <div ref={menuRef} className="absolute right-0 mt-2 w-64 bg-skin-card border border-skin-border rounded-xl shadow-xl shadow-skin-soft p-3 z-50 backdrop-blur-sm break-words">
          <button className="block w-full text-left px-2 py-2 truncate" onClick={() => window.location.assign('/profile')}>Profile</button>
          <button className="block w-full text-left px-2 py-2 truncate" onClick={() => logout()}>Logout</button>
          <div className="mt-3 pt-3 border-t border-skin-border">
            <div className="text-xs text-skin-muted px-2 pb-1">Theme</div>
            <div className="flex gap-2 px-2">
              <ThemeButton name="theme-blush" label="Blush" />
              <ThemeButton name="theme-navy" label="Navy" />
              <ThemeButton name="theme-lavender" label="Lavender" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ThemeButton({ name, label }: { name: ThemeName; label: string }) {
  const [current, setCurrent] = useState<ThemeName>('');

  useEffect(() => {
    setCurrent(getTheme());
  }, []);

  const active = current === name;

  return (
    <button
      className={`px-2 py-1 rounded-md text-sm ${active ? 'border' : 'border-transparent'}`}
      onClick={() => {
        setTheme(name);
        setCurrent(name);
      }}
    >
      {label}
    </button>
  );
}
