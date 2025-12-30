'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiLoader, FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import Button from '@/components/Button';
import DashboardLayout from '../components/DashboardLayout';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  department?: string;
  joinedAt: string;
  status: string;
}

export default function HotelAdminPage() {
  const { user, loading: authLoading } = useAuth();
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
  
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  
  const departments = ['front-desk', 'housekeeping', 'room-service', 'maintenance'];
  
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    
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
      if (data.success && data.invite) {
        setInviteEmail('');
        setShowInviteForm(false);
        const url = `${window.location.origin}/auth/accept-invite?code=${data.invite.code}&businessId=${businessId}`;
        setInviteUrl(url);
        setError(null);
      } else {
        setError(data.error || 'Failed to generate invite');
      }
    } catch (err) {
      setError('Failed to send invite');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">Loading admin panel...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Hotel Team</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your staff roles and invitations</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                  <FiUsers className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Team Members
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {teamMembers.length} active member{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-3"
              >
                <FiPlus className="w-5 h-5" />
                {showInviteForm ? 'Cancel' : 'Generate Invite'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                <FiAlertCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {inviteUrl && (
            <div className="m-6 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5" />
                  Invite Link Generated
                </h3>
                <button 
                  onClick={() => setInviteUrl(null)}
                  className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
                Share this link with your team member.
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                />
                <Button onClick={() => {
                  navigator.clipboard.writeText(inviteUrl);
                  alert('Copied to clipboard!');
                }}>
                  Copy
                </Button>
              </div>
            </div>
          )}

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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department</label>
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
                  {submitting ? 'Generating...' : 'Generate Invite'}
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

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {teamMembers.length === 0 ? (
              <div className="px-8 py-24 text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No team members yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Start building your team by generating an invite link for your staff.
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
      </div>
    </DashboardLayout>
  );
}
