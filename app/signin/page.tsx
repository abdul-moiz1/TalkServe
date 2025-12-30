'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { FcGoogle } from 'react-icons/fc';
import { FiSmartphone, FiShield, FiBriefcase, FiUser } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const isHotelStaff = searchParams.get('role') === 'staff' || email.includes('.hotel') || prefillEmail !== '';
  const isManager = searchParams.get('role') === 'manager';

  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userResult = await signIn(email, password);
      const idToken = await userResult.getIdToken();
      const response = await fetch('/api/auth-check', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      
      if (data.redirect) {
        if (data.businessId) localStorage.setItem('currentBusinessId', data.businessId);
        if (data.role) localStorage.setItem('userRole', data.role);
        if (data.department) localStorage.setItem('userDepartment', data.department);
        router.push(data.redirect);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth-check', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      
      if (data.redirect) {
        if (data.businessId) localStorage.setItem('currentBusinessId', data.businessId);
        if (data.role) localStorage.setItem('userRole', data.role);
        if (data.department) localStorage.setItem('userDepartment', data.department);
        router.push(data.redirect);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-500 ${
      isHotelStaff 
        ? 'bg-gradient-to-br from-slate-900 to-blue-950' 
        : 'bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'
    }`}>
      <div className="w-full max-w-md">
        <div className={`rounded-3xl shadow-2xl p-8 border transition-all duration-500 ${
          isHotelStaff 
            ? 'bg-slate-900/80 backdrop-blur-xl border-blue-500/30 text-white' 
            : 'bg-white dark:bg-slate-800 border-transparent'
        }`}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-blue-600/10 rounded-2xl mb-6">
              {isHotelStaff ? (
                <FiSmartphone className="w-10 h-10 text-blue-400" />
              ) : isManager ? (
                <FiBriefcase className="w-10 h-10 text-blue-500" />
              ) : (
                <FiShield className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <h1 className={`text-3xl font-bold mb-2 tracking-tight ${isHotelStaff ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {isHotelStaff ? 'Staff Portal' : isManager ? 'Management Login' : 'Welcome Back'}
            </h1>
            <p className={isHotelStaff ? 'text-blue-200/60' : 'text-gray-600 dark:text-gray-400'}>
              {isHotelStaff 
                ? 'Access your hotel dashboard and tasks' 
                : 'Sign in to your TalkServe account'}
            </p>
          </div>

          {error && (
            <div className={`mb-6 p-4 border rounded-xl animate-shake ${
              isHotelStaff 
                ? 'bg-red-900/40 border-red-500/50 text-red-200' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${isHotelStaff ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                {isHotelStaff ? 'Staff ID / Email' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className={isHotelStaff ? 'text-blue-400' : 'text-gray-400'} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all ${
                    isHotelStaff 
                      ? 'bg-slate-800/50 border-blue-500/30 text-white placeholder-blue-300/30 focus:ring-2 focus:ring-blue-500/50' 
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder={isHotelStaff ? 'Enter your staff email' : 'you@example.com'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-semibold mb-2 ${isHotelStaff ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  isHotelStaff 
                    ? 'bg-slate-800/50 border-blue-500/30 text-white placeholder-blue-300/30 focus:ring-2 focus:ring-blue-500/50' 
                    : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                }`}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-4 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] ${
                isHotelStaff 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Authenticating...' : isHotelStaff ? 'Enter Dashboard' : 'Sign In'}
            </button>
          </form>

          {!isHotelStaff && (
            <>
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300 dark:border-slate-600"></div>
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-300 dark:border-slate-600"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors font-medium"
              >
                <FcGoogle className="text-xl" />
                <span>Continue with Google</span>
              </button>

              <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold"
                >
                  Sign up
                </Link>
              </p>
            </>
          )}

          {isHotelStaff && (
            <p className="mt-8 text-center text-xs text-blue-200/40">
              Secured by TalkServe Enterprise Auth
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
