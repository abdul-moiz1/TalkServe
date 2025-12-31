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
      const response = await fetch(`/api/hotel/tickets?businessId=${businessId}&assignedTo=${user?.uid}&department=${userDept}`, { headers });
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
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const completedToday = tickets.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
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
                    drag="x"
                    dragConstraints={ { left: 0, right: 150 } }
                    dragElastic={0.05}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 100) {
                        if (task.status === 'created') handleUpdateStatus(task.id, 'in-progress');
                        else if (task.status === 'in-progress') handleUpdateStatus(task.id, 'completed');
                      }
                    }}
                    style={ { x: 0 } } // Ensure it snaps back automatically via Framer Motion
                    whileDrag={ { scale: 1.01, zIndex: 50 } }
                    transition={ { type: 'spring', stiffness: 500, damping: 40, mass: 0.5 } }
                    className="group bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing relative overflow-hidden touch-pan-y"
                  >
                    {/* Status Background Indicators for Swipe */}
                    <div className="absolute inset-y-0 left-0 w-full bg-emerald-500/10 flex items-center justify-start px-8 opacity-0 group-active:opacity-100 transition-opacity">
                       <FiCheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-4 relative z-10 bg-white dark:bg-slate-900 pointer-events-none">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border-blue-100 dark:group-hover:border-blue-800 transition-colors">
                        <span className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">#{task.guestRoom}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                            task.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider text-white ${statusColors[task.status]}`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate leading-tight">
                          {task.requestText}
                        </p>
                        {task.assignedByName && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned by</span>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest italic">{task.assignedByName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <FiChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
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
              className="space-y-2"
            >
              {completedToday.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTicket(task)}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="font-black text-slate-400 text-sm">#{task.guestRoom}</span>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium flex-1 truncate">{task.requestText}</p>
                  <FiCheckCircle className="text-emerald-500 w-5 h-5" />
                </div>
              ))}
              {completedToday.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No archived tasks
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
