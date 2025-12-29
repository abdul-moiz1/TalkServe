'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiLoader, FiAlertCircle, FiLogOut } from 'react-icons/fi';
import Button from '@/components/Button';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  department?: string;
  joinedAt: string;
  status: string;
}

export default function HotelAdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteDepartment, setInviteDepartment] = useState('front-desk');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const departments = ['front-desk', 'housekeeping', 'room-service', 'maintenance'];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    
    // Get businessId from URL or localStorage
    const bid = new URLSearchParams(window.location.search).get('businessId') || 
                localStorage.getItem('currentBusinessId');
    
    if (!bid && !authLoading) {
      router.push('/dashboard');
      return;
    }

    if (bid) setBusinessId(bid);
    
    fetchTeamMembers(bid || '');
  }, [user, authLoading, router]);

  const fetchTeamMembers = async (bid: string) => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/hotel/team?businessId=${bid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await response.json();
      if (data.success) {
        setTeamMembers(data.members || []);
      } else {
        setError(data.error || 'Failed to load team');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !inviteEmail) return;

    setSubmitting(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/hotel/invites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          email: inviteEmail,
          role: inviteRole,
          department: inviteRole !== 'admin' ? inviteDepartment : null,
          preferredLanguage: 'en',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setInviteEmail('');
        setShowInviteForm(false);
        alert(`Invite sent to ${inviteEmail}`);
      } else {
        setError(data.error || 'Failed to send invite');
      }
    } catch (err) {
      setError('Failed to send invite');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !businessId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">TalkServe Hotel Admin</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiUsers className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Team Members
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-normal text-slate-500 dark:text-slate-400">
                    {teamMembers.length}
                  </span>
                </h2>
              </div>
              <Button onClick={() => setShowInviteForm(!showInviteForm)}>
                <FiPlus className="w-4 h-4" />
                Invite Member
              </Button>
            </div>
          </div>

          {showInviteForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSendInvite}
              className="border-b border-slate-100 dark:border-slate-700/50 p-6 bg-slate-50 dark:bg-slate-700/30 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                {inviteRole !== 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Department
                    </label>
                    <select
                      value={inviteDepartment}
                      onChange={(e) => setInviteDepartment(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {dept.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Invite'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </motion.form>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {teamMembers.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <FiUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">No team members yet</p>
                <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
                  Invite your first team member to get started
                </p>
              </div>
            ) : (
              teamMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{member.email}</p>
                      <div className="flex gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                        <span className="capitalize">{member.role}</span>
                        {member.department && <span>•</span>}
                        {member.department && <span className="capitalize">{member.department}</span>}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
