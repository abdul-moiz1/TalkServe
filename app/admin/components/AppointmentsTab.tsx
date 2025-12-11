'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCalendar, 
  FiClock, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiBriefcase,
  FiMessageSquare,
  FiSearch,
  FiLoader,
  FiX,
  FiHash,
  FiRefreshCw,
  FiCheck,
  FiCheckCircle
} from 'react-icons/fi';
import { User } from 'firebase/auth';

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  confirmationMethod: string;
  createdAt: string | null;
  userEmail: string;
  userIndustry: string;
  userName: string;
  userPhone: string;
  userService: string;
  calendarSynced?: boolean;
}

interface AppointmentsTabProps {
  user: User | null;
}

function DetailPanel({ appointment, onClose, formatFullDate }: {
  appointment: Appointment;
  onClose: () => void;
  formatFullDate: (date: string | null) => string;
}) {
  const getMethodBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'sms':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'email':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'call':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all backdrop-blur-sm"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl border-4 border-white dark:border-slate-800">
            {appointment.userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="pt-14 px-6 pb-6">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{appointment.userName}</h3>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getMethodBadgeColor(appointment.confirmationMethod)}`}>
            <FiMessageSquare className="w-3 h-3" />
            {appointment.confirmationMethod.toUpperCase()}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{appointment.userService}</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center">
            <FiCalendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">{appointment.appointmentDate}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Date</p>
          </div>
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 text-center">
            <FiClock className="w-5 h-5 text-teal-600 dark:text-teal-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-slate-900 dark:text-white">{appointment.appointmentTime}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Time</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Details</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiPhone className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-slate-900 dark:text-white">{appointment.userPhone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiMail className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Email</p>
                <p className="text-slate-900 dark:text-white truncate">{appointment.userEmail || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiBriefcase className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Industry</p>
                <p className="text-slate-900 dark:text-white">{appointment.userIndustry || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiClock className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Submitted</p>
                <p className="text-slate-900 dark:text-white">{formatFullDate(appointment.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <FiHash className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400">Appointment ID</p>
                <p className="text-slate-900 dark:text-white font-mono text-xs truncate">{appointment.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsTab({ user }: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedForSync, setSelectedForSync] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/appointments', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch appointments');
      }

      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.userPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.userService.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMethod = methodFilter === 'all' || appointment.confirmationMethod.toLowerCase() === methodFilter.toLowerCase();
    
    return matchesSearch && matchesMethod;
  });

  const toggleSelectForSync = (id: string) => {
    setSelectedForSync(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllForSync = () => {
    const unsyncedIds = filteredAppointments
      .filter(a => !a.calendarSynced)
      .map(a => a.id);
    setSelectedForSync(new Set(unsyncedIds));
  };

  const clearSelection = () => {
    setSelectedForSync(new Set());
  };

  const syncToCalendar = async () => {
    if (selectedForSync.size === 0) {
      setSyncMessage({ type: 'error', text: 'Please select appointments to sync' });
      setTimeout(() => setSyncMessage(null), 3000);
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage(null);
      
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/appointments/sync-calendar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentIds: Array.from(selectedForSync),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync');
      }

      setSyncMessage({ type: 'success', text: data.message });
      setSelectedForSync(new Set());
      fetchAppointments();
      
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err) {
      console.error('Error syncing to calendar:', err);
      setSyncMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to sync to calendar' 
      });
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncing(false);
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'sms':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'email':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'call':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatFullDate = (dateString: string | null) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const totalAppointments = appointments.length;
  const smsCount = appointments.filter(a => a.confirmationMethod.toLowerCase() === 'sms').length;
  const todayCount = appointments.filter(a => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return a.appointmentDate.toLowerCase().includes(today.toLowerCase());
  }).length;

  const stats = [
    { label: 'Total Appointments', value: totalAppointments, color: 'emerald' as const },
    { label: 'SMS Confirmations', value: smsCount, color: 'green' as const },
    { label: 'Today', value: todayCount, color: 'teal' as const },
  ];

  const statColors = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      icon: 'text-emerald-600 dark:text-emerald-400',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-900/20',
      icon: 'text-teal-600 dark:text-teal-400',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center">
            <FiLoader className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading appointments...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
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
                <FiCalendar className={`w-6 h-6 ${statColors[stat.color].icon}`} />
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
          className={`${selectedAppointment ? 'flex-1' : 'w-full'} bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden`}
        >
          <div className="p-5 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Appointments
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-normal text-slate-500 dark:text-slate-400">{filteredAppointments.length}</span>
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search appointments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Methods</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="call">Call</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={selectAllForSync}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Select All Unsynced
                </button>
                {selectedForSync.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Clear Selection ({selectedForSync.size})
                  </button>
                )}
                <button
                  onClick={syncToCalendar}
                  disabled={syncing || selectedForSync.size === 0}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                    selectedForSync.size > 0 && !syncing
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {syncing ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <FiCalendar className="w-4 h-4" />
                      Sync to Google Calendar
                    </>
                  )}
                </button>

                {syncMessage && (
                  <span className={`text-sm font-medium ${syncMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {syncMessage.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[600px] overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No appointments found</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredAppointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`group px-5 py-4 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${selectedAppointment?.id === appointment.id ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!appointment.calendarSynced) {
                            toggleSelectForSync(appointment.id);
                          }
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                          appointment.calendarSynced
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : selectedForSync.has(appointment.id)
                            ? 'bg-blue-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
                        }`}
                        title={appointment.calendarSynced ? 'Already synced to Google Calendar' : 'Select for sync'}
                      >
                        {appointment.calendarSynced ? (
                          <FiCheckCircle className="w-4 h-4" />
                        ) : selectedForSync.has(appointment.id) ? (
                          <FiCheck className="w-4 h-4" />
                        ) : null}
                      </div>
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                          {appointment.userName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">{appointment.userName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{appointment.userService}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                          <FiPhone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{appointment.userPhone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex items-center gap-6">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                          <FiCalendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{appointment.appointmentDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                          <FiClock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{appointment.appointmentTime}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getMethodBadgeColor(appointment.confirmationMethod)}`}>
                          {appointment.confirmationMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {selectedAppointment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-96 flex-shrink-0"
          >
            <DetailPanel
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              formatFullDate={formatFullDate}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
