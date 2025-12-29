'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiTrendingUp,
  FiLoader,
  FiLogOut,
  FiAlertCircle,
  FiBarChart2,
  FiUser,
  FiSettings,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import Button from '@/components/Button';

interface Ticket {
  id: string;
  guestRoom: string;
  requestText: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'created' | 'assigned' | 'in-progress' | 'completed';
  createdAt: string;
  department: string;
}

interface StaffMetrics {
  completedToday: number;
  avgCompletionTime: number;
  rating: number;
  totalCompleted: number;
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800',
  normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
  low: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800',
};

export default function StaffDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<StaffMetrics>({
    completedToday: 0,
    avgCompletionTime: 0,
    rating: 0,
    totalCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'performance' | 'profile'>('tasks');
  const [swipeData, setSwipeData] = useState<{ ticketId: string; startX: number } | null>(null);

  const businessId = searchParams.get('businessId') || localStorage.getItem('currentBusinessId') || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    if (!businessId) {
      setError('Missing business information');
      return;
    }

    fetchData();
  }, [user, authLoading, businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      // Fetch assigned tickets
      const ticketsResponse = await fetch(
        `/api/hotel/tickets?businessId=${businessId}&assignedTo=${user?.uid}`,
        { headers }
      );
      const ticketsData = await ticketsResponse.json();
      if (ticketsData.success) {
        setTickets(ticketsData.tickets || []);
      }

      // Fetch performance metrics
      const metricsResponse = await fetch(
        `/api/hotel/staff-metrics?businessId=${businessId}`,
        { headers }
      );
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTicket = async (ticketId: string) => {
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
          status: 'completed',
        }),
      });

      if (response.ok) {
        setTickets(tickets.map(t => (t.id === ticketId ? { ...t, status: 'completed' } : t)));
        setMetrics(prev => ({
          ...prev,
          completedToday: prev.completedToday + 1,
          totalCompleted: prev.totalCompleted + 1,
        }));
      }
    } catch (err) {
      console.error('Error completing ticket:', err);
      setError('Failed to complete ticket');
    }
  };

  const handleStartTicket = async (ticketId: string) => {
    try {
      const idToken = await user?.getIdToken();
      await fetch(`/api/hotel/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          status: 'in-progress',
        }),
      });

      setTickets(tickets.map(t => (t.id === ticketId ? { ...t, status: 'in-progress' } : t)));
    } catch (err) {
      console.error('Error starting ticket:', err);
    }
  };

  const handleSwipe = (ticketId: string, currentX: number) => {
    if (!swipeData) return;

    const diff = swipeData.startX - currentX;

    // Swipe right: complete
    if (diff < -50) {
      handleCompleteTicket(ticketId);
      setSwipeData(null);
    }
    // Swipe left: start
    else if (diff > 50) {
      handleStartTicket(ticketId);
      setSwipeData(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/signin');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const assignedTickets = tickets.filter(t => ['assigned', 'in-progress'].includes(t.status));
  const completedTickets = tickets.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pb-24">
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 md:hidden">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all ${
              activeTab === 'tasks'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FiClock className="w-6 h-6" />
            <span className="text-xs mt-1">Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all ${
              activeTab === 'performance'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FiBarChart2 className="w-6 h-6" />
            <span className="text-xs mt-1">Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all ${
              activeTab === 'profile'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FiUser className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Tasks</h1>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold">Pending</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{assignedTickets.length}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Completed</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{metrics.completedToday}</p>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Your Tasks</h2>
                {assignedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <FiCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">All tasks completed!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assignedTickets.map((ticket, idx) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onMouseDown={e => setSwipeData({ ticketId: ticket.id, startX: e.clientX })}
                        onMouseUp={e => handleSwipe(ticket.id, e.clientX)}
                        onTouchStart={e => setSwipeData({ ticketId: ticket.id, startX: e.touches[0].clientX })}
                        onTouchEnd={e => handleSwipe(ticket.id, e.changedTouches[0].clientX)}
                        className={`p-4 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${priorityColors[ticket.priority]}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-bold text-lg">Room {ticket.guestRoom}</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            ticket.status === 'in-progress'
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}>
                            {ticket.status === 'in-progress' ? 'In Progress' : 'Assigned'}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-3 line-clamp-2">{ticket.requestText}</p>
                        <div className="flex gap-2">
                          {ticket.status === 'assigned' && (
                            <Button
                              size="sm"
                              onClick={() => handleStartTicket(ticket.id)}
                              className="flex-1 bg-blue-600 text-white"
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleCompleteTicket(ticket.id)}
                            className="flex-1 bg-emerald-600 text-white"
                          >
                            <FiCheck className="w-4 h-4" />
                            Done
                          </Button>
                        </div>
                        <p className="text-xs mt-2 opacity-75">(Swipe right to complete)</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'performance' ? (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Your Performance</h2>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Today</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.completedToday}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Total</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{metrics.totalCompleted}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Avg Completion Time</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {metrics.avgCompletionTime}m
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-yellow-500">{metrics.rating.toFixed(1)}</p>
                      <span className="text-yellow-500">⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Profile</h2>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Email</label>
                  <p className="text-lg font-medium text-slate-900 dark:text-white mt-1">{user?.email}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</label>
                  <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400 mt-1">Active</p>
                </div>

                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                  <FiSettings className="w-4 h-4" />
                  Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  <FiLogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
