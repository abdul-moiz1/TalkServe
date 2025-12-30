'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClipboard, 
  FiCheckCircle, 
  FiUser, 
  FiLogOut, 
  FiClock, 
  FiPlay,
  FiLoader,
  FiChevronRight,
  FiGlobe,
  FiBell
} from 'react-icons/fi';
import Button from '@/components/Button';
import LogoIcon from '@/components/LogoIcon';

interface Ticket {
  id: string;
  guestRoom: string;
  requestText: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'created' | 'assigned' | 'in-progress' | 'completed';
  createdAt: string;
  department: string;
  assignedTo: string;
}

const statusColors: Record<string, string> = {
  created: 'bg-blue-600 shadow-blue-200',
  'in-progress': 'bg-amber-500 shadow-amber-200',
  completed: 'bg-emerald-500 shadow-emerald-200',
};

const statusBorderColors: Record<string, string> = {
  created: 'bg-blue-600',
  'in-progress': 'bg-amber-500',
  completed: 'bg-emerald-500',
};

export default function StaffPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tasks' | 'completed' | 'profile'>('tasks');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const businessId = searchParams.get('businessId');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/staff-login');
      return;
    }
    
    if (!businessId) {
      setError('No business selected. Please use the direct link provided by your manager.');
      setLoading(false);
      return;
    }

    console.log('Current Business ID:', businessId);
    fetchData();
  }, [user, authLoading, businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const response = await fetch(`/api/hotel/tickets?businessId=${businessId}&assignedTo=${user?.uid}`, { headers });
      const data = await response.json();

      if (data.success) {
        setTickets(data.tickets || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    setSyncing(true);
    try {
      // Optimistic update
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: status as any } : t));
      
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/hotel/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId, status }),
      });

      if (!response.ok) throw new Error('Failed to sync');
    } catch (err) {
      console.error('Error updating ticket:', err);
      // Revert on error
      fetchData();
    } finally {
      setSyncing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeTasks = tickets
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const completedToday = tickets.filter(t => {
    const isCompleted = t.status === 'completed';
    const isToday = new Date(t.createdAt).toDateString() === new Date().toDateString();
    return isCompleted && isToday;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LogoIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {activeTab === 'tasks' ? 'My Tasks' : activeTab === 'completed' ? 'Completed' : 'Profile'}
        </h1>
        <div className="flex items-center gap-3">
          <FiGlobe className="w-5 h-5 text-slate-400 cursor-pointer" />
          <div 
            onClick={() => setActiveTab('profile')}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
            }`}
          >
            <FiUser className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Sync Indicator */}
      {syncing && (
        <div className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest py-1 text-center animate-pulse">
          Syncing changes...
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div 
              key="tasks"
              initial={ { opacity: 0, y: 10 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: -10 } }
              className="space-y-4"
            >
              {activeTasks.length === 0 ? (
                <div className="text-center py-20">
                  <FiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-20" />
                  <p className="text-slate-500 font-medium">All caught up!</p>
                  <p className="text-xs text-slate-400 mt-1">New tasks will appear here.</p>
                </div>
              ) : (
                activeTasks.map(task => (
                  <motion.div 
                    key={task.id}
                    drag="x"
                    dragConstraints={ { left: -100, right: 100 } }
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 80) {
                        if (task.status === 'created') handleUpdateStatus(task.id, 'in-progress');
                        else if (task.status === 'in-progress') handleUpdateStatus(task.id, 'completed');
                      }
                      if (info.offset.x < -80) {
                        // Optional: Reset or special action on left swipe
                      }
                    }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl relative overflow-hidden active:scale-[0.98] transition-all"
                  >
                    <div className={`absolute top-0 left-0 w-2.5 h-full ${statusBorderColors[task.status] || 'bg-slate-200'}`} />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-[-5deg]">
                          <span className="text-4xl font-black text-white dark:text-slate-900">#{task.guestRoom}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider ${
                              task.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider ${statusColors[task.status]} text-white`}>
                              {task.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
                            <FiClock className="w-3 h-3" /> {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-900 dark:text-white font-black text-2xl leading-tight mb-8">
                      {task.requestText}
                    </p>

                    <div className="flex gap-4">
                      {task.status === 'in-progress' ? (
                        <button 
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-6 rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 transition-all transform active:scale-95"
                        >
                          <FiCheckCircle className="w-7 h-7" /> Complete
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-[1.5rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3 transition-all transform active:scale-95"
                        >
                          <FiPlay className="w-7 h-7 fill-current" /> Start Task
                        </button>
                      )}
                    </div>

                    {/* Swipe Visual Feedback Overlay (Progressive) */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 opacity-0 hover:opacity-10 transition-opacity">
                       <FiChevronRight className="w-8 h-8 text-emerald-500 animate-pulse" />
                       <FiChevronRight className="w-8 h-8 text-red-500 rotate-180 animate-pulse" />
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div 
              key="completed"
              initial={ { opacity: 0, y: 10 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: -10 } }
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter">Finished Today</h2>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                  {completedToday.length} Tasks
                </span>
              </div>
              {completedToday.map(task => (
                <div key={task.id} className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-slate-400">#{task.guestRoom}</span>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium line-clamp-1">{task.requestText}</p>
                  </div>
                  <FiCheckCircle className="text-emerald-500 shrink-0" />
                </div>
              ))}
              {completedToday.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No tasks completed yet today
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={ { opacity: 0, y: 10 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: -10 } }
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200 dark:shadow-none">
                  <span className="text-white text-3xl font-black">{user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.displayName || 'Staff Member'}</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Staff • Housekeeping</p>
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Phone</span>
                    <span className="text-slate-900 dark:text-white font-black">{user?.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Joined</span>
                    <span className="text-slate-900 dark:text-white font-black">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Language</span>
                    <span className="text-blue-600 font-black uppercase tracking-widest text-[10px] bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">English</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <FiBell className="text-blue-600" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">Push Notifications</span>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    await logout();
                    router.push('/auth/staff-login');
                  }}
                  className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <FiLogOut /> Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-4 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 px-6 transition-colors ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <FiClipboard className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-tighter">My Tasks</span>
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`flex flex-col items-center gap-1 px-6 transition-colors ${activeTab === 'completed' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <FiCheckCircle className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Done</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 px-6 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <FiUser className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
}
