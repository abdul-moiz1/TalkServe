'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClipboard, 
  FiTrendingUp, 
  FiUser, 
  FiSettings, 
  FiLogOut, 
  FiClock, 
  FiMessageCircle, 
  FiCheckCircle, 
  FiPlay,
  FiChevronRight,
  FiLoader,
  FiAlertCircle
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
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  normal: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  low: 'bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-700',
};

export default function StaffPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tasks' | 'performance' | 'profile' | 'settings'>('tasks');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<StaffMetrics>({
    completedToday: 0,
    avgCompletionTime: 0,
    rating: 0,
    totalCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const businessId = searchParams.get('businessId') || localStorage.getItem('currentBusinessId') || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    if (!businessId) {
      setError('Missing business information');
      setLoading(false);
      return;
    }
    fetchData();
  }, [user, authLoading, businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [ticketsRes, metricsRes] = await Promise.all([
        fetch(`/api/hotel/tickets?businessId=${businessId}&assignedTo=${user?.uid}`, { headers }),
        fetch(`/api/hotel/staff-metrics?businessId=${businessId}`, { headers })
      ]);

      const ticketsData = await ticketsRes.json();
      const metricsData = await metricsRes.json();

      if (ticketsData.success) setTickets(ticketsData.tickets || []);
      if (metricsData.success) setMetrics(metricsData.metrics);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/hotel/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId, status }),
      });

      if (response.ok) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: status as any } : t));
        if (status === 'completed') {
          setMetrics(prev => ({
            ...prev,
            completedToday: prev.completedToday + 1,
            totalCompleted: prev.totalCompleted + 1,
          }));
        }
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const renderTasks = () => {
    const activeTickets = tickets.filter(t => t.status !== 'completed');
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h2>
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
            {activeTickets.length} Active
          </span>
        </div>

        {['urgent', 'normal', 'low'].map((priority) => {
          const priorityTasks = activeTickets.filter(t => t.priority === priority);
          if (priorityTasks.length === 0) return null;

          return (
            <div key={priority} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${priority === 'urgent' ? 'bg-red-500' : priority === 'normal' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                {priority} Priority
              </h3>
              {priorityTasks.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  layout
                  onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border shadow-sm transition-all ${expandedTicket === ticket.id ? 'ring-2 ring-blue-500' : 'border-slate-100 dark:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 dark:bg-slate-700 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-slate-900 dark:text-white">
                        {ticket.guestRoom}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">Room Number</p>
                        <p className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${priorityColors[ticket.priority]}`}>
                      {ticket.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2 my-3">
                    {ticket.requestText}
                  </p>

                  <AnimatePresence>
                    {expandedTicket === ticket.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'in-progress'); }}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                            >
                              <FiPlay className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Start</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(ticket.id, 'completed'); }}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            >
                              <FiCheckCircle className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Done</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); }}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                            >
                              <FiMessageCircle className="w-5 h-5 mb-1" />
                              <span className="text-[10px] font-bold uppercase">Chat</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-8 pb-32 max-w-md mx-auto">
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Performance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-3xl font-bold text-blue-600 mb-1">{metrics.completedToday}</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Today</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-3xl font-bold text-emerald-600 mb-1">{metrics.avgCompletionTime}m</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Avg Time</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="space-y-8 text-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-xl">
              <FiUser className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.displayName || 'Staff Member'}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <Button onClick={() => logout()} className="w-full bg-red-50 text-red-600 hover:bg-red-100">Logout</Button>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}>
          <FiClipboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Tasks</span>
        </button>
        <button onClick={() => setActiveTab('performance')} className={`flex flex-col items-center gap-1 ${activeTab === 'performance' ? 'text-blue-600' : 'text-slate-400'}`}>
          <FiTrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Stats</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}>
          <FiUser className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Me</span>
        </button>
      </nav>
    </div>
  );
}
