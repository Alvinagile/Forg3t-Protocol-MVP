import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserService, UserProfile } from '../../lib/userService';
import { 
  LayoutDashboard, 
  Shield, 
  Building, 
  Coins, 
  FileSearch, 
  Gavel, 
  Code, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../lib/supabase';
import { BrandLockup } from '../BrandLockup';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userData = await UserService.getUserProfile(user.id);
          if (userData.success && userData.user) {
            setUserRole(userData.user);
          } else {
            const defaultProfile: UserProfile = {
              id: user.id,
              email: user.email || '',
              package_type: 'individual',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setUserRole(defaultProfile);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          const defaultProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            package_type: 'individual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUserRole(defaultProfile);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const getMenuItems = () => {
    const allItems = [
      { name: 'Compliance', href: '/dash/compliance', icon: LayoutDashboard },
      { name: 'Validator', href: '/dash/validator', icon: Shield },
      { name: 'Enterprise', href: '/dash/enterprise', icon: Building },
      { name: 'Regulatory', href: '/dash/regulatory', icon: Gavel },
      { name: 'Developer', href: '/dash/developer', icon: Code },
      { name: 'Token', href: '/dash/token', icon: Coins },
      { name: 'Proof Explorer', href: '/dash/explorer', icon: FileSearch },
    ];

    return allItems;
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-slate-950/40" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex max-w-xs w-full flex-col border-r border-slate-200 bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 px-4">
                <BrandLockup compact />
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? 'bg-slate-100 text-slate-950 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      } group flex items-center rounded-xl px-3 py-3 text-base font-medium transition-colors`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`mr-4 h-6 w-6 ${location.pathname === item.href ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="border-t border-slate-200 p-4">
              <button onClick={handleLogout} className="flex w-full items-center text-sm font-medium text-slate-700 hover:text-slate-950">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-slate-200">
          <div className="px-4 py-5 border-b border-slate-200 shrink-0">
            <BrandLockup compact />
          </div>
          <div className="flex-1 h-0 overflow-y-auto">
            <nav className="px-2 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-slate-100 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    } group flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-colors`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${location.pathname === item.href ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-slate-900 max-w-[120px] truncate">
                  {user?.email}
                </p>
                <p className="text-xs font-medium text-slate-500 capitalize">
                  {userRole?.package_type || 'individual'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none"
              >
                <span className="sr-only">Sign out</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pl-1 pt-1 sm:pl-3 sm:pt-3 backdrop-blur md:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6 text-slate-950" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
