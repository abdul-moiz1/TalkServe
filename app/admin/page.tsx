'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiUsers, 
  FiPhone, 
  FiMessageCircle, 
  FiCalendar,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiCheck,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiLogOut,
  FiBriefcase,
  FiMail
} from 'react-icons/fi';

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

export default function AdminPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  const handleEdit = (owner: Owner) => {
    setEditingId(owner.id);
    setEditForm({
      assignedNumber: owner.assignedNumber || '',
      status: owner.status || 'pending',
    });
  };

  const handleSave = async (ownerId: string) => {
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
    } catch (err) {
      console.error('Error saving owner:', err);
      setUpdateError('Failed to save changes. Please try again.');
    }
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
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
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

  const totalCustomers = owners.reduce((sum, o) => sum + (o.customersCount || 0), 0);
  const totalMessages = owners.reduce((sum, o) => sum + (o.totalMessages || 0), 0);
  const activeOwners = owners.filter(o => o.status === 'active').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">TalkServe Admin</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Business Owners Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FiBriefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Owners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{owners.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeOwners}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <FiMessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMessages}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Business Owners
                <span className="ml-2 text-sm font-normal text-gray-500">({filteredOwners.length})</span>
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search owners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner / Business</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Number</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customers</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Messages</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sign-up Date</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {filteredOwners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No business owners found
                    </td>
                  </tr>
                ) : (
                  filteredOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {owner.ownerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{owner.ownerName}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{owner.businessName}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <FiMail className="w-3 h-3" />
                              {owner.ownerEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === owner.id ? (
                          <input
                            type="text"
                            value={editForm.assignedNumber}
                            onChange={(e) => setEditForm({ ...editForm, assignedNumber: e.target.value })}
                            placeholder="+1 234 567 8900"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            <span>{owner.assignedNumber || 'Not assigned'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-gray-900 dark:text-white font-medium">{owner.customersCount || 0}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-gray-900 dark:text-white font-medium">{owner.totalMessages || 0}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {editingId === owner.id ? (
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                            {owner.status.charAt(0).toUpperCase() + owner.status.slice(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                          <FiCalendar className="w-4 h-4" />
                          <span>{formatDate(owner.submittedAt)}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        {editingId === owner.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSave(owner.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(owner)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
