'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiUsers,
  FiFilter,
  FiChevronRight,
  FiLoader,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import Button from '@/components/Button';

interface Ticket {
  id: string;
  guestRoom: string;
  requestText: string;
  department: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'created' | 'assigned' | 'in-progress' | 'completed' | 'archived';
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

const statusColors: Record<string, string> = {
  created: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  assigned: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  'in-progress': 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  archived: 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400',
};

const priorityColors: Record<string, string> = {
  urgent: 'text-red-600 dark:text-red-400',
  normal: 'text-blue-600 dark:text-blue-400',
  low: 'text-slate-600 dark:text-slate-400',
};

export default function ManagerDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'team'>('tickets');

  const businessId = searchParams.get('businessId') || localStorage.getItem('currentBusinessId') || '';
  const department = searchParams.get('department') || localStorage.getItem('userDepartment') || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!businessId || !department) {
      setError('Missing business or department information');
      return;
    }

    fetchData();
  }, [user, authLoading, businessId, department, filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      // Fetch tickets
      const ticketUrl = `/api/hotel/tickets?businessId=${businessId}&department=${department}&status=${
        filterStatus === 'all' ? '' : filterStatus
      }`.replace(/&status=$/, '');

      const ticketsResponse = await fetch(ticketUrl, { headers });
      const ticketsData = await ticketsResponse.json();

      if (ticketsData.success) {
        setTickets(ticketsData.tickets || []);
      }

      // Fetch team members
      const teamResponse = await fetch(`/api/hotel/team?businessId=${businessId}`, { headers });
      const teamData = await teamResponse.json();

      if (teamData.success) {
        setTeamMembers(teamData.members || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId: string, updates: Record<string, any>) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/hotel/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          ...updates,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTickets(tickets.map(t => (t.id === ticketId ? data.ticket : t)));
        setSelectedTicket(null);
      } else {
        setError(data.error || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  const filteredTickets = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading manager dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
              >
                {showSidebar ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Department Tickets</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:inline">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'tickets'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FiClock className="w-4 h-4" />
              Tickets
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === 'team'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FiUsers className="w-4 h-4" />
              My Team
            </button>
          </div>
        </div>
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50 px-4 sm:px-6 lg:px-8 py-4 text-red-700 dark:text-red-400"
        >
          <div className="flex gap-3 items-center">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'tickets' ? (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filter Bar */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <FiFilter className="w-4 h-4" />
                  All
                </button>
                {['created', 'assigned', 'in-progress', 'completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {status.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Tickets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredTickets.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full text-center py-16"
                    >
                      <FiClock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No tickets found</p>
                    </motion.div>
                  ) : (
                    filteredTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Room {ticket.guestRoom}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColors[ticket.status]}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-900 dark:text-white font-medium mb-2 line-clamp-2">{ticket.requestText}</p>
                        <div className="flex justify-between items-end text-xs text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{ticket.department}</span>
                          <span className={`font-semibold capitalize ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team Members</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {teamMembers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <FiUsers className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">No team members</p>
                  </div>
                ) : (
                  teamMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{member.email}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{member.role}</p>
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
          )}
        </AnimatePresence>
      </main>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTicket(null)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Room {selectedTicket.guestRoom}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedTicket.requestText}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={e => handleUpdateTicket(selectedTicket.id, { status: e.target.value })}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="created">Created</option>
                      <option value="assigned">Assigned</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Priority</label>
                    <select
                      value={selectedTicket.priority}
                      onChange={e => handleUpdateTicket(selectedTicket.id, { priority: e.target.value })}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Assign to Staff</label>
                  <select
                    value={selectedTicket.assignedTo || ''}
                    onChange={e => handleUpdateTicket(selectedTicket.id, { assignedTo: e.target.value || null })}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="">Unassigned</option>
                    {teamMembers
                      .filter(m => m.role === 'staff')
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.email}
                        </option>
                      ))}
                  </select>
                </div>

                <Button className="w-full" onClick={() => handleUpdateTicket(selectedTicket.id, { status: 'completed' })}>
                  <FiCheckCircle className="w-4 h-4" />
                  Mark Completed
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
