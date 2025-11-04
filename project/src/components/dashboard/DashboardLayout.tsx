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
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../lib/supabase';

interface UserWithRole {
  id: string;
  email: string;
  package_type: 'individual' | 'enterprise' | 'validator' | 'regulator' | 'admin';
  created_at: string;
}

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
    // For development/testing, show all menu items regardless of user role
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
      <div className="min-h-screen bg-[#091024] flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-[#091024] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#002d68]">
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
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="h-8 w-8 rounded-full bg-[#60a5fa] flex items-center justify-center">
                  <span className="text-white font-bold">F3</span>
                </div>
                <span className="ml-3 text-white text-xl font-bold">Forg3t Protocol</span>
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
                          ? 'bg-[#60a5fa]/20 text-white'
                          : 'text-gray-300 hover:bg-[#60a5fa]/10 hover:text-white'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-4 flex-shrink-0 h-6 w-6 text-[#60a5fa]" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-600 p-4">
              <button
                onClick={handleLogout}
                className="flex-shrink-0 w-full group block"
              >
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">Sign out</p>
                  </div>
                  <LogOut className="ml-auto h-5 w-5 text-gray-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-[#002d68] border-r border-gray-600">
          <div className="flex items-center h-16 px-4 bg-[#091024] shrink-0">
            <div className="h-8 w-8 rounded-full bg-[#60a5fa] flex items-center justify-center">
              <span className="text-white font-bold">F3</span>
            </div>
            <span className="ml-3 text-white text-xl font-bold">Forg3t Protocol</span>
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
                        ? 'bg-[#60a5fa]/20 text-white'
                        : 'text-gray-300 hover:bg-[#60a5fa]/10 hover:text-white'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                  >
                    <Icon className="mr-3 flex-shrink-0 h-5 w-5 text-[#60a5fa]" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-600 p-4">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-white max-w-[120px] truncate">
                  {user?.email}
                </p>
                <p className="text-xs font-medium text-gray-400 capitalize">
                  {userRole?.package_type || 'individual'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 bg-[#002d68] p-1 rounded-full text-gray-400 hover:text-white focus:outline-none"
              >
                <span className="sr-only">Sign out</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-[#091024]">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6 text-white" />
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