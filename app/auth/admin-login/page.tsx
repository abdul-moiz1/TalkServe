'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FiSmartphone, FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Standardize input for phone numbers if it looks like one
      let loginIdentifier = email;
      const digitsOnly = email.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && !email.includes('@')) {
        if (digitsOnly.startsWith('0')) {
          loginIdentifier = '+92' + digitsOnly.slice(1) + '@hotel.talkserve.ai';
        } else if (digitsOnly.startsWith('92')) {
          loginIdentifier = '+' + digitsOnly + '@hotel.talkserve.ai';
        } else {
          loginIdentifier = '+92' + digitsOnly + '@hotel.talkserve.ai';
        }
      }

      const userResult = await signIn(loginIdentifier, password);
      const idToken = await userResult.getIdToken();
      const response = await fetch('/api/auth-check', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      const data = await response.json();
      
      if (data.redirect) {
        if (data.businessId) localStorage.setItem('currentBusinessId', data.businessId);
        if (data.role) localStorage.setItem('userRole', data.role);
        window.location.href = data.redirect;
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError('Invalid ID or password. Please contact your administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-purple-500/20 rounded-[2.5rem] shadow-2xl p-8 md:p-10 relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
          
          <div className="text-center mb-10 relative">
            <div className="inline-flex items-center justify-center p-5 bg-purple-600/10 rounded-3xl mb-6 ring-1 ring-purple-500/20">
              <FiSmartphone className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Admin Portal
            </h1>
            <p className="text-purple-200/40 text-sm font-medium">
              Enterprise Secure Login
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest ml-1">
                Admin ID (Phone or Email)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400">
                  <FiUser className="text-slate-500" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all outline-none"
                  placeholder="e.g. 0310... or admin@hotel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-purple-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400">
                  <FiLock className="text-slate-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (
                <>
                  Enter Dashboard
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">
              Powered by TalkServe AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-400">Loading Portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
