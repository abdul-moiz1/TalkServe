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
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingRole, setEditingRole] = useState('');
  const [editingDepartment, setEditingDepartment] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [showGuestQR, setShowGuestQR] = useState(false);
  const [showStaffQR, setShowStaffQR] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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

  const handleSaveMemberChanges = async () => {
    if (!selectedMember || !businessId) return;
    
    setIsSavingMember(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/hotel/team/${selectedMember.id}?businessId=${businessId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: editingName,
          phone: editingPhone,
          role: editingRole,
          department: editingDepartment || null,
          status: editingStatus,
        }),
      });

      if (response.ok) {
        const updatedMember = {
          ...selectedMember,
          fullName: editingName,
          phone: editingPhone,
          role: editingRole,
          department: editingDepartment,
          status: editingStatus,
        };
        setSelectedMember(updatedMember);
        setIsEditingMember(false);
        fetchTeamMembers(businessId);
      } else {
        alert('Failed to update member');
      }
    } catch (err) {
      alert('An error occurred while updating member');
      console.error(err);
    } finally {
      setIsSavingMember(false);
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
        {onboardingData && (
          <div className="flex flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGuestQR(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
              title="Guest WhatsApp QR"
            >
              <FiSmartphone className="w-4 h-4" />
              Guest QR
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowStaffQR(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-full text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
              title="Staff/Manager QR"
            >
              <FiSmartphone className="w-4 h-4" />
              Staff QR
            </motion.button>
          </div>
        )}
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
                Account Created
              </h3>
              <button 
                onClick={() => setGeneratedAccount(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider">Staff ID</label>
                <div className="flex gap-2 mt-1">
                  <input
                    readOnly
                    value={generatedAccount.email.includes('@hotel.local') ? generatedAccount.email.split('@')[0] : generatedAccount.email}
                    className="flex-1 px-2 py-1.5 rounded text-xs border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button 
                    onClick={() => {
                      const displayValue = generatedAccount.email.includes('@hotel.local') ? generatedAccount.email.split('@')[0] : generatedAccount.email;
                      navigator.clipboard.writeText(displayValue);
                      alert('Copied!');
                    }}
                    className="px-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium hover:bg-emerald-200"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider">Password</label>
                <div className="flex gap-2 mt-1">
                  <input
                    readOnly
                    value={generatedAccount.password}
                    className="flex-1 px-2 py-1.5 rounded text-xs border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedAccount.password);
                      alert('Copied!');
                    }}
                    className="px-2 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium hover:bg-emerald-200"
                  >
                    Copy
                  </button>
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


        {/* Guest QR Modal */}
        {showGuestQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGuestQR(false)}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Guest WhatsApp QR</h4>
                <button
                  onClick={() => setShowGuestQR(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div 
                id="guest-qr-modal"
                className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-6"
              >
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{onboardingData?.businessName || 'Hotel'}</p>
                <QRCodeSVG 
                  value={(() => {
                    const phoneNum = onboardingData?.business_number?.replace('whatsapp:', '').replace(/\D/g, '') || '18575243646';
                    // If number starts with 0 (local format), replace with country code 92 (Pakistan)
                    const formattedNum = phoneNum.startsWith('0') ? '92' + phoneNum.slice(1) : phoneNum;
                    return `https://wa.me/${formattedNum}`;
                  })()}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 font-medium">Powered by TalkServe.ai</p>
              </div>

              <button
                onClick={() => {
                  const qrElement = document.getElementById('guest-qr-modal');
                  if (qrElement) {
                    const printWindow = window.open('', '', 'width=500,height=600');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><style>body { margin: 0; padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; background: #fff; }</style></head>
                          <body>
                            ${qrElement.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Print QR Code
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Staff QR Modal */}
        {showStaffQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStaffQR(false)}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Staff/Manager Portal QR</h4>
                <button
                  onClick={() => setShowStaffQR(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FiX className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div 
                id="staff-qr-modal"
                className="flex flex-col items-center p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-6"
              >
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{onboardingData?.businessName || 'Hotel'}</p>
                <QRCodeSVG 
                  value={`${baseUrl}/auth/staff-login`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 font-medium">Powered by TalkServe.ai</p>
              </div>

              <button
                onClick={() => {
                  const qrElement = document.getElementById('staff-qr-modal');
                  if (qrElement) {
                    const printWindow = window.open('', '', 'width=500,height=600');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head><style>body { margin: 0; padding: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial; background: #fff; }</style></head>
                          <body>
                            ${qrElement.innerHTML}
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                      }, 250);
                    }
                  }
                }}
                className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Print QR Code
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Search Bar */}
        {teamMembers.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search by phone number..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
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
            teamMembers
              .filter(member => 
                !searchPhone || (member.phone && member.phone.toLowerCase().includes(searchPhone.toLowerCase()))
              )
              .map((member, index) => (
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{isEditingMember ? editingName : selectedMember.fullName}</h3>
                  <p className="text-slate-500 text-sm capitalize">{isEditingMember ? editingRole : selectedMember.role} • {isEditingMember ? editingDepartment?.replace('-', ' ') || 'No Department' : selectedMember.department?.replace('-', ' ')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-2xl transition-colors text-slate-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {!isEditingMember ? (
              <>
              {/* Credentials Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Access Credentials</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">Staff ID / Email</label>
                      <div className="flex gap-2">
                        <input readOnly value={selectedMember.email.includes('@hotel.local') ? selectedMember.email.split('@')[0] : selectedMember.email} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium" />
                        <button onClick={() => { const displayValue = selectedMember.email.includes('@hotel.local') ? selectedMember.email.split('@')[0] : selectedMember.email; navigator.clipboard.writeText(displayValue); alert('Copied!'); }} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Copy</button>
                      </div>
                    </div>
                    {selectedMember.password && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500">Password</label>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={selectedMember.password || '••••••••'} 
                            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-blue-600 dark:text-blue-400" 
                          />
                          {selectedMember.password && (
                            <button onClick={() => { navigator.clipboard.writeText(selectedMember.password!); alert('Password copied!'); }} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Copy</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                    <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-3">
                      <FiLink className="w-4 h-4" /> Direct Access Link
                    </h5>
                    <div className="flex gap-2">
                      <input readOnly value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`} className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 rounded-lg border border-blue-100 dark:border-blue-900 text-[10px] text-slate-500" />
                      <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`); alert('Link copied!'); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Copy</button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="mb-4 text-center">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                      <FiSmartphone className="w-4 h-4 text-blue-500" /> Scan to Login
                    </h4>
                  </div>
                  <div className="p-4 bg-white rounded-3xl shadow-xl">
                    <QRCodeSVG 
                      value={`${baseUrl}/auth/staff-login?email=${encodeURIComponent(selectedMember.email)}&role=${selectedMember.role}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">Quick Access QR</p>
                </div>
              </div>

              {/* Management Actions */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Actions</h4>
                    <p className="text-xs text-slate-500">Reset password, edit, or remove</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto flex-wrap">
                    <button 
                      onClick={async () => {
                        if (confirm('Reset password for this member?')) {
                          setIsResettingPassword(true);
                          try {
                            const idToken = await user?.getIdToken();
                            const response = await fetch('/api/hotel/members/reset-password', {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ businessId, memberId: selectedMember.id })
                            });
                            const data = await response.json();
                            if (data.success) {
                              setGeneratedAccount({ email: data.email, password: data.password, role: selectedMember.role });
                              fetchTeamMembers(businessId!);
                              alert('Password reset successfully!');
                            } else {
                              alert('Failed to reset password');
                            }
                          } catch (err) {
                            alert('Error resetting password');
                          } finally {
                            setIsResettingPassword(false);
                          }
                        }
                      }}
                      disabled={isResettingPassword}
                      className="flex-1 sm:flex-none px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 rounded-2xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingMember(true);
                        setEditingName(selectedMember.fullName || '');
                        setEditingPhone(selectedMember.phone || '');
                        setEditingRole(selectedMember.role);
                        setEditingDepartment(selectedMember.department || '');
                        setEditingStatus(selectedMember.status);
                      }}
                      className="flex-1 sm:flex-none px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 rounded-2xl text-sm font-bold transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Remove this member?')) {
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
                      className="flex-1 sm:flex-none px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-2xl text-sm font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              </>
              ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Member Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                    <input 
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                    <input 
                      type="tel"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="+92 3107320707"
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                    <select 
                      value={editingRole}
                      onChange={(e) => setEditingRole(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  {editingRole !== 'admin' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Department</label>
                      <select 
                        value={editingDepartment}
                        onChange={(e) => setEditingDepartment(e.target.value)}
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
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                    <select 
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleSaveMemberChanges}
                    disabled={isSavingMember}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-sm font-bold transition-colors"
                  >
                    {isSavingMember ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => setIsEditingMember(false)}
                    disabled={isSavingMember}
                    className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
