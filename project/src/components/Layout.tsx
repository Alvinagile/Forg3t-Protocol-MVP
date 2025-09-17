import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const publicRoutes = ['/signin', '/signup', '/onboarding'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#091024] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user && !isPublicRoute) {
    return <Navigate to="/signin" replace />;
  }

  // Don't redirect if user is on signup page (they might be in verification flow)
  if (user && isPublicRoute && location.pathname !== '/onboarding' && location.pathname !== '/signup') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#091024]">
      {user && <Navbar />}
      <main className={user ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  );
}