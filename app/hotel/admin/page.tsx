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
  FiLoader,
  FiLogOut,
  FiChevronRight,
  FiClipboard,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiTrendingUp,
  FiAward,
  FiActivity
} from 'react-icons/fi';
import LogoIcon from '@/components/LogoIcon';

interface Ticket {
  id: string;
  guestRoom: string;
  requestText: string;
  department: string;
  priority: 'urgent' | 'normal' | 'low';
  status: 'created' | 'assigned' | 'in-progress' | 'completed' | 'archived';
  assignedTo: string | null;
  assignedStaffName?: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  userId?: string;
  fullName?: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  department?: string;
  status: string;
  activeTaskCount?: number;
  createdAt?: string;
}

export default function AdminPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tickets' | 'managers' | 'staff' | 'stats' | 'settings'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const businessId = searchParams.get('businessId');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/admin-login');
      return;
    }

    if (!businessId) {
      setError('No business selected. Please use the direct link provided by your administrator.');
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

      // Fetch all team members (managers and staff)
      const teamRes = await fetch(`/api/hotel/team?businessId=${businessId}`, { headers });
      const teamData = await teamRes.json();
      
      if (teamData.success) {
        setTeamMembers(teamData.members || []);
      }

      // Fetch all tickets
      const ticketsRes = await fetch(`/api/hotel/tickets?businessId=${businessId}`, { headers });
      const ticketsData = await ticketsRes.json();

      if (ticketsData.success) {
        setTickets(ticketsData.tickets || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const managers = teamMembers.filter(m => m.role === 'manager');
  const staff = teamMembers.filter(m => m.role === 'staff');

  const stats = {
    totalTickets: tickets.length,
    completed: tickets.filter(t => t.status === 'completed').length,
    pending: tickets.filter(t => t.status !== 'completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    totalManagers: managers.length,
    totalStaff: staff.length,
    completionRate: tickets.length > 0 ? Math.round((tickets.filter(t => t.status === 'completed').length / tickets.length) * 100) : 0
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <header className="px-4 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none">
            <LogoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Admin Portal</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {activeTab === 'tickets' ? 'All Tickets' : activeTab === 'managers' ? 'Managers' : activeTab === 'staff' ? 'Staff' : activeTab === 'stats' ? 'Analytics' : 'Settings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setActiveTab('settings')}
            className={`p-2.5 rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <FiUser className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* All Tickets Tab */}
          {activeTab === 'tickets' && (
            <motion.div 
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">All Tickets</h3>
                  <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-purple-600 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <FiFilter /> Filters
                  </button>
                </div>

                <div className="space-y-8">
                  {Object.entries(
                    tickets.reduce((acc, ticket) => {
                      const dept = ticket.department.toLowerCase();
                      if (!acc[dept]) acc[dept] = [];
                      acc[dept].push(ticket);
                      return acc;
                    }, {} as Record<string, Ticket[]>)
                  ).map(([dept, deptTickets]) => (
                    <div key={dept} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-[2px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                          {dept} ({deptTickets.length})
                        </h4>
                        <div className="h-[2px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
                      </div>
                      
                      <div className="space-y-3">
                        {deptTickets.map(ticket => (
                          <div 
                            key={ticket.id} 
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-4"
                          >
                            <div className={`w-1 h-10 rounded-full ${
                              ticket.priority === 'urgent' ? 'bg-red-500' : 
                              ticket.priority === 'normal' ? 'bg-blue-500' : 
                              'bg-slate-300'
                            }`} />
                            
                            <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm">
                              <span className="text-lg font-black text-white dark:text-slate-900">#{ticket.guestRoom}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter ${
                                  ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-600' : 
                                  ticket.priority === 'normal' ? 'bg-blue-500/10 text-blue-600' : 
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {ticket.priority}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                  <FiClock className="w-3 h-3" /> {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-slate-900 dark:text-white font-bold text-sm truncate">
                                {ticket.requestText}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 pr-2">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full border ${
                                ticket.status === 'completed' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                                ticket.status === 'in-progress' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                                'border-slate-100 text-slate-500 bg-slate-50'
                              }`}>
                                {ticket.status.replace('-', ' ')}
                              </span>
                            </div>
                            <FiChevronRight className="text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                      <FiClipboard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No tickets found</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Managers Tab */}
          {activeTab === 'managers' && (
            <motion.div 
              key="managers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Hotel Managers</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {managers.length > 0 ? managers.map(member => {
                      const activeTaskCount = tickets.filter(t => 
                        t.assignedTo === (member.userId || member.id) && 
                        t.status !== 'completed'
                      ).length;

                      return (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
                                {member.email.charAt(0).toUpperCase()}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-slate-800 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{member.fullName || member.email}</p>
                              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{member.department || 'All Departments'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{activeTaskCount} active</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manager</span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-8 text-center text-slate-500">No managers found.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <motion.div 
              key="staff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Hotel Staff</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {staff.length > 0 ? staff.map(member => {
                      const activeTaskCount = tickets.filter(t => 
                        t.assignedTo === (member.userId || member.id) && 
                        t.status !== 'completed'
                      ).length;

                      return (
                        <div key={member.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
                                {member.email.charAt(0).toUpperCase()}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-slate-800 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{member.fullName || member.email}</p>
                              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{member.department || 'Unassigned'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{activeTaskCount} tasks</p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff</span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="p-8 text-center text-slate-500">No staff found.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">System Analytics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Tickets', value: stats.totalTickets, color: 'text-purple-600', icon: FiClipboard },
                    { label: 'Completed', value: stats.completed, color: 'text-emerald-600', icon: FiCheckCircle },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-600', icon: FiAlertCircle },
                    { label: 'Urgent', value: stats.urgent, color: 'text-red-600', icon: FiAlertCircle },
                    { label: 'Total Managers', value: stats.totalManagers, color: 'text-purple-600', icon: FiUsers },
                    { label: 'Total Staff', value: stats.totalStaff, color: 'text-blue-600', icon: FiUser },
                    { label: 'Completion Rate', value: `${stats.completionRate}%`, color: 'text-teal-600', icon: FiTrendingUp },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                          </div>
                          <Icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-8">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Overall Ticket Volume</h4>
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={ { width: `${(stats.completed / (stats.totalTickets || 1)) * 100}%` } }
                    />
                    <div 
                      className="bg-amber-500 h-full" 
                      style={ { width: `${(stats.pending / (stats.totalTickets || 1)) * 100}%` } }
                    />
                  </div>
                  <div className="flex gap-6 mt-4 text-xs font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> Completed
                    </div>
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> Pending
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
                  <div className="w-20 h-20 bg-purple-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-200 dark:shadow-none">
                    <span className="text-white text-3xl font-black">{user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{user?.displayName || 'Administrator'}</h2>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">System Admin</p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4 max-w-sm mx-auto">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Email</span>
                      <span className="text-slate-900 dark:text-white font-black">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Phone</span>
                      <span className="text-slate-900 dark:text-white font-black">{user?.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-tighter text-[11px]">Joined</span>
                      <span className="text-slate-900 dark:text-white font-black">{user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3 max-w-xs mx-auto">
                    <button 
                      onClick={async () => {
                        await logout();
                        router.push('/auth/admin-login');
                      }}
                      className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-900 px-4 py-4 flex justify-around items-center z-50">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'tickets' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'tickets' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
            <FiClipboard className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Tickets</span>
        </button>
        <button 
          onClick={() => setActiveTab('managers')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'managers' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'managers' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
            <FiUsers className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Managers</span>
        </button>
        <button 
          onClick={() => setActiveTab('staff')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'staff' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'staff' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
            <FiUser className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Staff</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'stats' ? 'text-purple-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === 'stats' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
            <FiBarChart2 className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
        </button>
      </nav>
    </div>
  );
}
