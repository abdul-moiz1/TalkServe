'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, 
  FiPhone, 
  FiCalendar,
  FiTrendingUp,
  FiSearch,
  FiEdit2,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiLogOut,
  FiBriefcase,
  FiMail,
  FiChevronRight,
  FiHash,
  FiGlobe,
  FiClock
} from 'react-icons/fi';
import AppointmentsTab from './components/AppointmentsTab';
import BusinessWidgetTab from './components/BusinessWidgetTab';

type AdminTab = 'owners' | 'appointments' | 'business-widget';

interface Owner {
  id: string;
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  industryType: string;
  type: string;
  status: string;
  submittedAt: string | null;
  assignedNumber: string | null;
  customersCount: number;
  totalMessages: number;
  uuid: string;
}

const statColors = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
  },
};

function DetailPanel({ owner, onClose, onEdit, formatFullDate, getStatusColor, getStatusDot }: {
  owner: Owner;
  onClose: () => void;
  onEdit: (e: React.MouseEvent, owner: Owner) => void;
  formatFullDate: (date: string | null) => string;
  getStatusColor: (status: string) => string;
  getStatusDot: (status: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white dark:border-slate-800">
            {owner.ownerName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="pt-14 px-6 pb-6">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{owner.ownerName}</h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(owner.status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(owner.status)}`} />
            {owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{owner.businessName}</p>

        <div className="mt-6">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{owner.customersCount || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customers</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Details</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiMail className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-slate-900 dark:text-white truncate">{owner.ownerEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Assigned Number</p>
                <p className="text-slate-900 dark:text-white">{owner.assignedNumber || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiGlobe className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Industry</p>
                <p className="text-slate-900 dark:text-white">{owner.industryType || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiBriefcase className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Business Type</p>
                <p className="text-slate-900 dark:text-white">{owner.type || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiClock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Sign-up Date</p>
                <p className="text-slate-900 dark:text-white">{formatFullDate(owner.submittedAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiHash className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">UUID</p>
                <p className="text-slate-900 dark:text-white font-mono text-xs truncate">{owner.uuid || owner.id}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('owners');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    assignedNumber: '',
    status: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    fetchOwners();
  }, [user, authLoading]);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/owners', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have admin access. Please contact support.');
          return;
        }
        throw new Error(data.error || 'Failed to fetch owners');
      }

      if (data.success) {
        setOwners(data.owners || []);
      }
    } catch (err) {
      console.error('Error fetching owners:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent, owner: Owner) => {
    e.stopPropagation();
    setEditingId(owner.id);
    setEditForm({
      assignedNumber: owner.assignedNumber || '',
      status: owner.status || 'pending',
    });
  };

  const handleSave = async (e: React.MouseEvent, ownerId: string) => {
    e.stopPropagation();
    try {
      setUpdateError(null);
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/owners', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId,
          ...editForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setUpdateError(data.error || 'Failed to update owner');
        return;
      }

      setEditingId(null);
      fetchOwners();
      if (selectedOwner?.id === ownerId) {
        setSelectedOwner({ ...selectedOwner, ...editForm });
      }
    } catch (err) {
      console.error('Error saving owner:', err);
      setUpdateError('Failed to save changes. Please try again.');
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleRowClick = (owner: Owner) => {
    if (editingId) return;
    setSelectedOwner(owner);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  const filteredOwners = owners.filter(owner => {
    const matchesSearch = 
      owner.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || owner.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      case 'inactive':
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'pending':
        return 'bg-amber-500';
      case 'inactive':
        return 'bg-slate-400';
      default:
        return 'bg-blue-500';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalCustomers = owners.reduce((sum, o) => sum + (o.customersCount || 0), 0);
  const activeOwners = owners.filter(o => o.status === 'active').length;

  const stats = [
    { label: 'Total Owners', value: owners.length, icon: FiBriefcase, color: 'blue' as const },
    { label: 'Active', value: activeOwners, icon: FiTrendingUp, color: 'emerald' as const },
    { label: 'Total Customers', value: totalCustomers, icon: FiUsers, color: 'purple' as const },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading admin panel...</p>
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
          className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-200 dark:border-slate-700"
        >
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-600/20"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-all"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('owners')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'owners'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <FiBriefcase className="w-4 h-4" />
              Business Owners
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'appointments'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <FiCalendar className="w-4 h-4" />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('business-widget')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'business-widget'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <FiBriefcase className="w-4 h-4" />
              Business Widget
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'appointments' ? (
          <AppointmentsTab user={user} />
        ) : activeTab === 'business-widget' ? (
          <BusinessWidgetTab owners={owners} user={user} />
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${statColors[stat.color].bg} rounded-xl flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 ${statColors[stat.color].icon}`} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="flex gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Business Owners
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-normal text-slate-500 dark:text-slate-400">{filteredOwners.length}</span>
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search owners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredOwners.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FiUsers className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No business owners found</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredOwners.map((owner, index) => (
                  <motion.div
                    key={owner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleRowClick(owner)}
                    className={`group px-5 py-4 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selectedOwner?.id === owner.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                            {owner.ownerName.charAt(0).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${getStatusDot(owner.status)} rounded-full border-2 border-white dark:border-slate-800`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{owner.ownerName}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{owner.businessName}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                            <FiMail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{owner.ownerEmail}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-8">
                          {editingId === owner.id ? (
                            <input
                              type="text"
                              value={editForm.assignedNumber}
                              onChange={(e) => setEditForm({ ...editForm, assignedNumber: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="+1 234 567 8900"
                              className="w-40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm min-w-[120px]">
                              <FiPhone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{owner.assignedNumber || 'Not assigned'}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-4 h-4" />
                              {owner.customersCount || 0}
                            </span>
                          </div>

                          {editingId === owner.id ? (
                            <select
                              value={editForm.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(owner.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(owner.status)}`} />
                              {owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}
                            </span>
                          )}

                          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 min-w-[100px]">
                            <FiCalendar className="w-4 h-4" />
                            {formatDate(owner.submittedAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {editingId === owner.id ? (
                            <>
                              <button
                                onClick={(e) => handleSave(e, owner.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                              >
                                <FiCheck className="w-5 h-5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleEdit(e, owner)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                          )}
                          <FiChevronRight className={`w-5 h-5 text-slate-300 dark:text-slate-600 transition-transform ${selectedOwner?.id === owner.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {selectedOwner && (
              <motion.div
                initial={{ opacity: 0, x: 50, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 380 }}
                exit={{ opacity: 0, x: 50, width: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="hidden lg:block flex-shrink-0 sticky top-24"
              >
                <DetailPanel
                  owner={selectedOwner}
                  onClose={() => setSelectedOwner(null)}
                  onEdit={handleEdit}
                  formatFullDate={formatFullDate}
                  getStatusColor={getStatusColor}
                  getStatusDot={getStatusDot}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selectedOwner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50"
            >
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelectedOwner(null)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto"
              >
                <DetailPanel
                  owner={selectedOwner}
                  onClose={() => setSelectedOwner(null)}
                  onEdit={handleEdit}
                  formatFullDate={formatFullDate}
                  getStatusColor={getStatusColor}
                  getStatusDot={getStatusDot}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {updateError && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
          >
            <FiAlertCircle className="w-5 h-5" />
            {updateError}
            <button onClick={() => setUpdateError(null)} className="ml-2 hover:bg-red-600 p-1 rounded-lg transition-colors">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
