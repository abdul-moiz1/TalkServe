'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiLoader } from 'react-icons/fi';
import Button from '@/components/Button';

interface InviteData {
  code: string;
  businessId: string;
  email: string;
  role: string;
  department?: string;
  preferredLanguage: string;
  businessName: string;
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, signUp } = useAuth();

  const code = searchParams.get('code');
  const businessId = searchParams.get('businessId');

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!code || !businessId) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const response = await fetch(
          `/api/hotel/invites/validate?code=${code}&businessId=${businessId}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Invalid invite');
          return;
        }

        setInvite({
          ...data.invite,
          businessName: data.business.name,
        });
      } catch (err) {
        setError('Failed to validate invite');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [code, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invite) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Sign up the new user
      const newUser = await signUp(invite.email, formData.password, formData.fullName);
      
      if (!newUser) {
        throw new Error('Failed to create user account');
      }

      // Get ID token for the newly created user
      const idToken = await newUser.getIdToken();

      // Create user in database with role and department and mark invite as used
      const acceptResponse = await fetch('/api/hotel/invites/accept', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: code,
          businessId,
          role: invite.role,
          department: invite.department,
          email: invite.email,
          fullName: formData.fullName,
        }),
      });

      if (!acceptResponse.ok) {
        const acceptError = await acceptResponse.json();
        throw new Error(acceptError.error || 'Failed to complete invite acceptance');
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect based on role
        let redirectPath = `/hotel/staff?businessId=${businessId}`;
        if (invite.role === 'admin') {
          redirectPath = `/hotel/admin?businessId=${businessId}`;
        } else if (invite.role === 'manager') {
          redirectPath = `/hotel/manager?businessId=${businessId}&department=${encodeURIComponent(invite.department || '')}`;
        }
        router.push(redirectPath);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Validating invite...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Invite</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Account Created!</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Welcome to {invite?.businessName}. Redirecting to dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Join {invite?.businessName}</h1>
          <div className="space-y-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Role:</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize">{invite?.role}</span>
            </div>
            {invite?.department && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Department:</span>
                <span className="font-semibold text-slate-900 dark:text-white capitalize">{invite.department}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Email:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{invite?.email}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account & Join'
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
