import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../lib/supabase';
import { BrandLockup } from '../components/BrandLockup';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await authService.signUp(email, password, 'individual');

      if (error) {
        if (error.message.includes('User already registered') || 
            error.message.includes('user_already_exists') ||
            error.code === 'user_already_exists') {
          setError('This email address is already registered. Please sign in or use a different email.');
        } else if (error.message.includes('Invalid email')) {
          setError('Please enter a valid email address.');
        } else if (error.message.includes('Supabase not configured')) {
          setError('The application is not properly configured to connect to Supabase. Please check the configuration.');
        } else {
          setError(`Account could not be created: ${error.message}`);
        }
      } else if (data.user || data.session) {
        if (!data.user && data.session) {
          setError('Please check your email for a confirmation link. After confirming, sign in to continue.');
        } else {
          navigate('/onboarding');
        }
      } else {
        setError('Please check your email for a confirmation link. After confirming, sign in to continue.');
      }
      
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_45%,_#ffffff_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <BrandLockup />
          <div className="mt-8 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
              Operator onboarding
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
              Start the Stellar-native unlearning workflow with a clear, productized operator experience.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Create your workspace to manage suppression campaigns, onboard users, and prepare Soroban-verifiable evidence bundles.
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-8 rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="text-center">
            <div className="mb-6 flex justify-center lg:hidden">
              <BrandLockup compact />
            </div>
            <h2 className="text-3xl font-bold text-slate-950">Create Account</h2>
            <p className="mt-2 text-sm text-slate-500">
              Join Forg3t Protocol
            </p>
          </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="flex items-center space-x-2 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-900">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-900">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Create a password"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters required</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-900">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-10 text-slate-950 placeholder-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center rounded-xl border border-transparent bg-sky-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/signin" className="font-medium text-sky-700 transition-colors hover:text-sky-800">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
