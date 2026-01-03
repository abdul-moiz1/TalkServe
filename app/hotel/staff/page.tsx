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
  FiBell,
  FiAlertCircle
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
  assignedByName?: string;
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

const statusLabels: Record<string, string> = {
  created: 'New',
  'in-progress': 'In Progress',
  completed: 'Completed',
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
  const [staffInfo, setStaffInfo] = useState<{ fullName: string; phone?: string; createdAt: string; department?: string; status?: string } | null>(null);
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

    fetchData();
  }, [user, authLoading, businessId]);

  const fetchData = async () => {
    try {
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      // First check staff info and status
      const teamResponse = await fetch(`/api/hotel/team?businessId=${businessId}`, { headers });
      const teamData = await teamResponse.json();
      
      let userDept = '';
      if (teamData.success && teamData.members) {
        const info = teamData.members.find((m: any) => m.userId === user?.uid);
        if (info) {
          setStaffInfo(info);
          userDept = info.department || '';
          console.log('Staff status:', info.status);
          // Check if account is inactive
          if (info.status === 'inactive') {
            console.log('Account suspended detected');
            setIsAccountSuspended(true);
            setLoading(false);
            return;
          }
        }
      }

      // If not suspended, fetch tickets
      const response = await fetch(`/api/hotel/tickets?businessId=${businessId}&department=${userDept}`, { headers });
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
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
      }
      
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
      fetchData();
    } finally {
      setSyncing(false);
    }
  };

  if (isAccountSuspended && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl mb-6 inline-block">
            <FiAlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Account Suspended</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-2">Your account has been suspended</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Please contact your manager or administrator for more information.</p>
          <button onClick={() => logout()} className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const activeTasks = tickets
    .filter(t => t.status !== 'completed' && t.assignedTo === user?.uid)
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { urgent: 0, high: 0, normal: 1, low: 2 };
      const aPrio = (a.priority || 'normal').toLowerCase();
      const bPrio = (b.priority || 'normal').toLowerCase();
      return (priorityOrder[aPrio] ?? 1) - (priorityOrder[bPrio] ?? 1);
    });

  const completedToday = tickets.filter(t => t.status === 'completed' && t.assignedTo === user?.uid);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="px-4 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
            <LogoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Staff Portal</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {activeTab === 'tasks' ? `${activeTasks.length} Tasks` : activeTab === 'completed' ? 'Archive' : 'Settings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setActiveTab('profile')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <FiUser className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div 
              key="tasks"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
              className="space-y-3"
            >
              {activeTasks.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up</h3>
                  <p className="text-sm text-slate-500 mt-1">New tasks will appear here.</p>
                </div>
              ) : (
                activeTasks.map(task => (
                  <motion.div 
                    key={task.id}
                    initial={ { opacity: 0, y: 10 } }
                    animate={ { opacity: 1, y: 0 } }
                    transition={ { type: 'spring', stiffness: 300, damping: 30 } }
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group"
                  >
                            <div className={`w-1 h-10 rounded-full ${
                              (task.priority || '').toLowerCase() === 'urgent' || (task.priority || '').toLowerCase() === 'high' ? 'bg-red-500' : 
                              (task.priority || '').toLowerCase() === 'normal' ? 'bg-blue-500' : 
                              'bg-slate-300'
                            }`} />
                            
                            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
                              <span className="text-sm font-black text-white dark:text-slate-900">#{task.guestRoom || '??'}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter ${
                                  (task.priority || '').toLowerCase() === 'urgent' || (task.priority || '').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-600' : 
                                  (task.priority || '').toLowerCase() === 'normal' ? 'bg-blue-500/10 text-blue-600' : 
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {task.priority || 'normal'}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter text-white ${statusColors[(task.status || 'created')]}`}>
                                  {statusLabels[(task.status || 'created')]}
                                </span>
                              </div>
                              <p className="text-slate-900 dark:text-white font-bold text-sm truncate">
                                {(task as any).issue_summary || task.requestText || 'No description'}
                              </p>
                      {task.assignedByName && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Assigned by <span className="font-bold text-blue-600 dark:text-blue-400">{task.assignedByName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {((task.status || '').toLowerCase() === 'created' || (task.status || '').toLowerCase() === 'assigned') && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'in-progress')}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 px-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                          title="Start task"
                        >
                          Start
                        </button>
                      )}
                      {(task.status || '').toLowerCase() === 'in-progress' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-2.5 rounded-lg transition-all active:scale-95 shadow-sm"
                          title="Mark complete"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'completed' && (
            <motion.div 
              key="completed"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
              className="space-y-3"
            >
              {completedToday.map(task => (
                <motion.div 
                  key={task.id}
                  initial={ { opacity: 0, y: 10 } }
                  animate={ { opacity: 1, y: 0 } }
                  transition={ { type: 'spring', stiffness: 300, damping: 30 } }
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center border border-emerald-200 dark:border-slate-600 shrink-0 shadow-sm">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">#{task.guestRoom || '??'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">{(task as any).issue_summary || task.requestText || 'No description'}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider text-white bg-emerald-500 shadow-md">Completed</span>
                      </div>
                      {task.assignedByName && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          Assigned by <span className="font-bold text-blue-600 dark:text-blue-400">{task.assignedByName}</span>
                        </p>
                      )}
                    </div>
                    <FiCheckCircle className="text-emerald-500 w-6 h-6 shrink-0 mt-0.5" />
                  </div>
                </motion.div>
              ))}
              {completedToday.length === 0 && (
                <div className="text-center py-24">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiCheckCircle className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No completed tasks</h3>
                  <p className="text-sm text-slate-500 mt-1">Finished tasks will appear here.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
              className="space-y-6"
            >
              <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-8 text-center border border-slate-100 dark:border-slate-800">
                <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200 dark:shadow-none">
                  <span className="text-white text-4xl font-black">{staffInfo?.fullName?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{staffInfo?.fullName || user?.displayName || 'Staff Member'}</h2>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">{staffInfo?.department || 'Team Member'}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4 max-w-xs mx-auto text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{staffInfo?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {staffInfo?.createdAt ? new Date(staffInfo.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Active</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4 max-w-xs mx-auto">
                   <button 
                    onClick={async () => {
                      await logout();
                      router.push('/auth/staff-login');
                    }}
                    className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <FiLogOut /> Logout Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-900 px-4 py-4 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'tasks' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <FiClipboard className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Tasks</span>
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'completed' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'completed' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Done</span>
        </button>
      </nav>
    </div>
  );
}
