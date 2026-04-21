import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, Brain, LogOut, Menu, Settings, X } from 'lucide-react';
import { authService } from '../lib/supabase';
import { BrandLockup } from './BrandLockup';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const publicRoutes = ['/signin', '/signup', '/onboarding'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  const menuItems = [
    { name: 'Dashboard', href: '/dash', icon: BarChart3, match: (path: string) => path.startsWith('/dash') },
    { name: 'Suppression', href: '/unlearning', icon: Brain, match: (path: string) => path === '/unlearning' },
    { name: 'Settings', href: '/settings', icon: Settings, match: (path: string) => path === '/settings' }
  ];

  const handleSignOut = async () => {
    await authService.signOut();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-700">Loading...</div>
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return <Navigate to="/signin" replace />;
  }

  if (user && isPublicRoute && location.pathname !== '/onboarding' && location.pathname !== '/signup') {
    return <Navigate to="/dash" replace />;
  }

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.match(location.pathname);

        return (
          <Link key={item.name} to={item.href} onClick={onClick}>
            <div
              className={[
                'group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-100 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              ].join(' ')}
            >
              <Icon
                className={[
                  'mr-3 h-5 w-5',
                  isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'
                ].join(' ')}
              />
              {item.name}
            </div>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && user && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex h-full max-w-xs flex-col border-r border-slate-200 bg-white px-4 py-5 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <BrandLockup compact />
            <nav className="mt-8 space-y-2">
              <NavItems onClick={() => setSidebarOpen(false)} />
            </nav>
            <div className="mt-auto pt-6">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {user ? (
        <div className="flex min-h-screen">
          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
            <div className="border-b border-slate-200 px-4 py-5">
              <BrandLockup compact />
            </div>
            <nav className="flex-1 space-y-2 px-4 py-6">
              <NavItems />
            </nav>
            <div className="border-t border-slate-200 px-4 py-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{user.email || 'User'}</p>
                  <p className="text-xs text-slate-500">{location.pathname === '/unlearning' ? 'Suppression flow' : 'Account settings'}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>

          <div className="flex min-h-screen flex-1 flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:hidden">
              <button
                type="button"
                className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-slate-900">Forg3t</span>
              <div className="w-9" />
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}
