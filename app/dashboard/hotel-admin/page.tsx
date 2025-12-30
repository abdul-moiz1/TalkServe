'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
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
          
          // If we have onboarding but no businessId in URL, try to get it
          const urlParams = new URLSearchParams(window.location.search);
          const bid = urlParams.get('businessId') || localStorage.getItem('currentBusinessId');
          
          if (bid) {
            setBusinessId(bid);
            fetchTeamMembers(bid);
          } else {
            // Fetch business ID if not in URL/localStorage
            const bizRes = await fetch('/api/auth-check', {
              headers: { 'Authorization': `Bearer ${idToken}` },
            });
            const bizData = await bizRes.json();
            if (bizData.businessId) {
              setBusinessId(bizData.businessId);
              fetchTeamMembers(bizData.businessId);
            } else {
              setError('No business found. Please complete onboarding.');
              setLoading(false); // Stop main loading if error
            }
          }
        } else {
          console.log('No hotel onboarding found');
          setOnboardingData(null);
          setLoading(false); // Stop loading to show "Register" state
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

        {error && (
          <div className="mx-8 mt-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {generatedAccount && (
          <div className="m-6 p-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5" />
                Account Created Successfully
              </h3>
              <button 
                onClick={() => setGeneratedAccount(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                IMPORTANT: Save these credentials and share them with the staff member. They will not be shown again.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wider">Email/Username</label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={generatedAccount.email}
                          className="flex-1 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedAccount.email);
                            alert('Email copied!');
                          }}
                          className="p-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold uppercase tracking-wider">Generated Password</label>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={generatedAccount.password}
                          className="flex-1 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedAccount.password);
                            alert('Password copied!');
                          }}
                          className="p-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                      <FiLink className="w-4 h-4 text-blue-500" />
                      Direct Access Link
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">Share this link with the {generatedAccount.role} for direct login.</p>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(generatedAccount.email)}&role=${generatedAccount.role}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${baseUrl}/auth/staff-login?email=${encodeURIComponent(generatedAccount.email)}&role=${generatedAccount.role}`);
                          alert('Login link copied!');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <div className="mb-4 text-center">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <FiSmartphone className="w-4 h-4 text-blue-500" />
                      Scan to Login
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Fast Access for {generatedAccount.role}s</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-100">
                    <QRCodeSVG 
                      value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(generatedAccount.email)}&role=${generatedAccount.role}`}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  
                  <p className="mt-4 text-[11px] text-slate-500 text-center max-w-[180px]">
                    Instruct the staff member to scan this with their phone camera to open the login page.
                  </p>
                </div>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email (Optional)</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+92 3107320707"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  required={!inviteEmail}
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language Preference</label>
                <select
                  value={inviteLanguage}
                  onChange={(e) => setInviteLanguage(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="ur">Urdu</option>
                  <option value="hi">Hindi</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Member Account'}
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
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-2">
                        <div className="w-24 shrink-0">
                          <span className="inline-block font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 uppercase tracking-tighter text-[11px] border border-slate-200 dark:border-slate-600 w-full text-center">
                            {member.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-medium w-48 shrink-0 ml-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {member.department ? member.department.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'No Dept'}
                        </div>
                        <div className="flex items-center gap-2 font-medium ml-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          {member.phone || 'No Phone'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30'
                    }`}>
                      {member.status}
                    </span>
                    <FiArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Member Detail Dialog */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-[0_0_50px_-12px_rgba(37,99,235,0.2)] border border-slate-800 overflow-hidden relative"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-8 right-8 p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all z-10 active:scale-95"
            >
              <FiX className="w-6 h-6" />
            </button>

            {/* Header Section */}
            <div className="p-10 pb-6 bg-gradient-to-b from-blue-600/10 to-transparent">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-900/40 flex items-center justify-center rotate-[-5deg]">
                  <FiUser className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tight mb-1">
                    {selectedMember.fullName}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700">
                      {selectedMember.role}
                    </span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                      {selectedMember.department?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'General'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-10 pb-10 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-10 pt-4">
              {/* Access Credentials Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Access Credentials</h3>
                   <div className="h-px flex-1 bg-slate-800 ml-6"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Text Credentials */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff ID / Email</label>
                      <div className="flex gap-3">
                        <div className="flex-1 px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white text-sm font-bold truncate">
                          {selectedMember.email}
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedMember.email);
                            alert('Copied to clipboard!');
                          }}
                          className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-slate-700 active:scale-95 shadow-lg"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporary Password</label>
                      <div className="flex gap-3">
                        <div className="flex-1 px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-blue-400 text-sm font-mono font-black tracking-[0.2em]">
                          {selectedMember.password || '••••••••'}
                        </div>
                        <button 
                          onClick={() => {
                            if (selectedMember.password) {
                              navigator.clipboard.writeText(selectedMember.password);
                              alert('Password copied!');
                            }
                          }}
                          className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-slate-700 active:scale-95 shadow-lg"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="p-8 bg-slate-800/30 rounded-[2.5rem] border border-slate-800/50 flex flex-col items-center justify-center text-center group">
                    <div className="flex items-center gap-2 mb-6 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em]">
                      <FiSmartphone className="w-4 h-4" />
                      Scan to Login
                    </div>
                    
                    <div className="p-5 bg-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500">
                      <QRCodeSVG 
                        value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`}
                        size={140}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    
                    <p className="mt-6 text-[10px] text-slate-500 font-bold max-w-[180px] leading-relaxed uppercase tracking-widest opacity-60">
                      Instant Mobile Access
                    </p>
                  </div>
                </div>
              </div>

              {/* Management Actions */}
              <div className="pt-10 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      const loginLink = `${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`;
                      navigator.clipboard.writeText(loginLink);
                      alert('Direct login link copied!');
                    }}
                    className="flex-[2] px-8 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 active:scale-95"
                  >
                    <FiLink className="w-5 h-5" />
                    Copy Login Link
                  </button>
                  <button 
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
                          } else {
                            alert('Failed to remove member');
                          }
                        } catch (err) {
                          alert('An error occurred');
                        }
                      }
                    }}
                    className="flex-1 px-8 py-5 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all border border-red-900/30 active:scale-95"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
