'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiPlus, FiLoader, FiAlertCircle, FiCheckCircle, FiX, FiLink, FiSmartphone, FiArrowRight, FiUser } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import Button from '@/components/Button';

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  department?: string;
  joinedAt: string;
  status: string;
  password?: string;
}

export default function HotelAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteDepartment, setInviteDepartment] = useState('front-desk');
  const [inviteLanguage, setInviteLanguage] = useState('en');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [generatedAccount, setGeneratedAccount] = useState<{email: string; password: string; role: string} | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const departments = ['front-desk', 'housekeeping', 'room-service', 'maintenance'];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    const checkOnboarding = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/onboarding', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });
        const result = await response.json();
        
        console.log('Onboarding check result:', result);

        if (result.success && result.exists && result.data?.industryType === 'hotel') {
          setOnboardingData(result.data);
          
          const urlParams = new URLSearchParams(window.location.search);
          const bid = urlParams.get('businessId') || localStorage.getItem('currentBusinessId');
          
          if (bid) {
            setBusinessId(bid);
            fetchTeamMembers(bid);
          } else {
            const bizRes = await fetch('/api/auth-check', {
              headers: { 'Authorization': `Bearer ${idToken}` },
            });
            const bizData = await bizRes.json();
            if (bizData.businessId) {
              setBusinessId(bizData.businessId);
              fetchTeamMembers(bizData.businessId);
            } else {
              setError('No business found. Please complete onboarding.');
              setLoading(false);
            }
          }
        } else {
          console.log('No hotel onboarding found');
          setOnboardingData(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking onboarding:', err);
        setError('Failed to verify onboarding status');
        setLoading(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
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
    if (!businessId || (!inviteEmail && !invitePhone)) return;

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
          email: inviteEmail || null,
          fullName: inviteName,
          phone: invitePhone || null,
          role: inviteRole,
          department: inviteRole !== 'admin' ? inviteDepartment : null,
          preferredLanguage: inviteLanguage,
        }),
      });

      const data = await response.json();
      if (data.success && data.account) {
        setInviteEmail('');
        setInviteName('');
        setInvitePhone('');
        setInviteLanguage('en');
        setShowInviteForm(false);
        setGeneratedAccount({ ...data.account, role: inviteRole });
        setError(null);
        fetchTeamMembers(businessId);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('Failed to create account');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading || checkingOnboarding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 bg-amber-50 dark:bg-amber-900/30 rounded-full mb-6">
          <FiAlertCircle className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Register Your Hotel</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          To manage your team, you first need to complete the onboarding process for your hotel.
        </p>
        <Button 
          onClick={() => router.push('/dashboard/onboarding')}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-200"
        >
          Go to Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
              {showInviteForm ? 'Cancel' : 'Add Member'}
            </Button>
          </div>
        </div>

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
                className="px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all cursor-pointer group border-b border-slate-100 dark:border-slate-700/50"
                onClick={() => setSelectedMember(member)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg border border-blue-100 dark:border-blue-800/50">
                      {member.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {member.fullName || 'Unnamed User'}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{member.role} • {member.department?.replace('-', ' ')}</p>
                    </div>
                  </div>
                  <FiArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-4xl bg-[#1e2532] h-full shadow-2xl flex flex-col overflow-hidden text-white"
            >
              <div className="p-8 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                    <FiUser className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{selectedMember.fullName}</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                      {selectedMember.role} • {selectedMember.department || 'Management'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMember(null)}
                  className="p-3 hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hover:text-white"
                >
                  <FiX className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <div>
                      <h3 className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-8">Access Credentials</h3>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Staff ID / Email</label>
                          <div className="flex gap-3">
                            <input readOnly value={selectedMember.email} className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-200 outline-none" />
                            <button onClick={() => { navigator.clipboard.writeText(selectedMember.email); alert('Email copied!'); }} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold transition-all">Copy</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                          <div className="flex gap-3">
                            <input readOnly type="password" value={selectedMember.password || '••••••••'} className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-200 outline-none" />
                            <button onClick={() => { if (selectedMember.password) { navigator.clipboard.writeText(selectedMember.password); alert('Password copied!'); } }} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold transition-all">Copy</button>
                          </div>
                        </div>
                        <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl space-y-4">
                          <div className="flex items-center gap-3 text-blue-400">
                            <FiLink className="w-5 h-5" />
                            <h4 className="font-black text-sm uppercase tracking-wider">Direct Access Link</h4>
                          </div>
                          <div className="flex gap-3">
                            <input readOnly value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`} className="flex-1 bg-slate-900/50 border border-blue-500/10 rounded-xl px-4 py-3 text-xs text-blue-300 font-medium" />
                            <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`); alert('Link copied!'); }} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-xs transition-all">Copy</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8 border-t border-slate-700/50">
                      <h3 className="text-slate-500 font-black text-xs uppercase tracking-[0.2em] mb-6">Management Actions</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <Button className="bg-slate-800 hover:bg-slate-700 border-none py-4 rounded-2xl">Reset Password</Button>
                         <Button 
                           onClick={async () => {
                             if (confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
                               try {
                                 const idToken = await user?.getIdToken();
                                 const response = await fetch(`/api/hotel/team/${selectedMember.id}?businessId=${businessId}`, {
                                   method: 'DELETE',
                                   headers: { Authorization: `Bearer ${idToken}` }
                                 });
                                 if (response.ok) {
                                   setSelectedMember(null);
                                   fetchTeamMembers(businessId!);
                                 } else { alert('Failed to remove member'); }
                               } catch (err) { alert('An error occurred'); }
                             }
                           }}
                           className="bg-red-600/10 hover:bg-red-600/20 text-red-500 border-none py-4 rounded-2xl"
                         >
                           Remove Staff
                         </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center p-10 bg-slate-800/30 rounded-[3rem] border border-slate-700/50">
                    <div className="mb-10 text-center">
                      <div className="flex items-center justify-center gap-3 text-blue-400 mb-2">
                        <FiSmartphone className="w-6 h-6" />
                        <h4 className="text-xl font-black tracking-tight">Scan to Login</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Quick Access QR</p>
                    </div>
                    <div className="p-8 bg-white rounded-[3rem] shadow-2xl shadow-blue-500/10">
                      <QRCodeSVG value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`} size={240} level="H" includeMargin={true} />
                    </div>
                    <p className="mt-10 text-xs text-slate-500 text-center max-w-[240px] leading-relaxed font-medium">Staff members can scan this code with their mobile device to instantly log in to their dashboard.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}