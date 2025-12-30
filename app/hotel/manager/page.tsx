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
  FiMessageSquare,
  FiUser
} from 'react-icons/fi';
import Button from '@/components/Button';
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
  fullName?: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  activeTaskCount?: number;
}

export default function ManagerPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tickets' | 'team' | 'stats' | 'settings'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const businessId = searchParams.get('businessId') || localStorage.getItem('currentBusinessId') || '';
  const department = searchParams.get('department') || localStorage.getItem('userDepartment') || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    fetchData();
  }, [user, authLoading, businessId, department]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();
      const headers = { Authorization: `Bearer ${idToken}` };

      const [ticketsRes, teamRes] = await Promise.all([
        fetch(`/api/hotel/tickets?businessId=${businessId}&department=${department}`, { headers }),
        fetch(`/api/hotel/team?businessId=${businessId}`, { headers })
      ]);

      const ticketsData = await ticketsRes.json();
      const teamData = await teamRes.json();

      if (ticketsData.success) {
        // Filter tickets by manager's department
        const filteredTickets = (ticketsData.tickets || []).filter((t: Ticket) => t.department === department);
        setTickets(filteredTickets);
      }
      
      if (teamData.success) {
        // Filter team by manager's department
        const filteredTeam = (teamData.members || []).filter((m: TeamMember) => m.department === department);
        setTeamMembers(filteredTeam);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    // API implementation would go here
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t));
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = {
    total: tickets.length,
    completed: tickets.filter(t => t.status === 'completed').length,
    pending: tickets.filter(t => t.status !== 'completed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <LogoIcon className="w-8 h-8 text-blue-600" />
            <span className="font-bold text-slate-900 dark:text-white">TalkServe</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{department} Manager</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'tickets' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FiClipboard className="w-5 h-5" /> Tickets
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FiUsers className="w-5 h-5" /> Team
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'stats' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FiBarChart2 className="w-5 h-5" /> Stats
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <FiSettings className="w-5 h-5" /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors">
            <FiLogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoIcon className="w-7 h-7 text-blue-600" />
            <span className="font-bold text-slate-900 dark:text-white">TalkServe</span>
          </div>
          <h2 className="hidden lg:block text-lg font-bold text-slate-900 dark:text-white">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              {department} Dept
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <FiUser className="w-5 h-5" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Live Queue</h3>
                  <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <FiFilter /> Filters
                  </button>
                </div>

                <div className="grid gap-5">
                  {tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                      <FiClipboard className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active tickets</p>
                    </div>
                  ) : (
                    tickets.map(ticket => (
                      <div 
                        key={ticket.id} 
                        onClick={() => setSelectedTicket(ticket)}
                        className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className={`absolute top-0 left-0 w-2 h-full ${
                          ticket.priority === 'urgent' ? 'bg-red-500' : 
                          ticket.priority === 'normal' ? 'bg-blue-500' : 
                          'bg-slate-400'
                        }`} />
                        
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-2xl font-black text-white dark:text-slate-900">#{ticket.guestRoom}</span>
                            </div>
                            <div>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-tighter ${
                                ticket.priority === 'urgent' ? 'bg-red-500 text-white' : 
                                ticket.priority === 'normal' ? 'bg-blue-500 text-white' : 
                                'bg-slate-400 text-white'
                              }`}>
                                {ticket.priority}
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider mt-1">
                                <FiClock /> {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 ${
                            ticket.status === 'completed' ? 'border-emerald-100 text-emerald-600 bg-emerald-50' : 
                            ticket.status === 'in-progress' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                            'border-slate-100 text-slate-500 bg-slate-50'
                          }`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-slate-900 dark:text-white font-black text-lg leading-tight mb-4 group-hover:text-blue-600 transition-colors">
                          {ticket.requestText}
                        </p>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700/50">
                          {ticket.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                                {ticket.assignedStaffName?.charAt(0) || 'S'}
                              </div>
                              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest italic">
                                {ticket.assignedStaffName || 'Assigned Staff'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                              Pending Assignment
                            </span>
                          )}
                          <FiChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Department Staff</h3>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {teamMembers.map(member => (
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
                            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{member.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{member.activeTaskCount || 0} tasks</p>
                          <button className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mt-1">Assign</button>
                        </div>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="p-8 text-center text-slate-500">No staff found in this department.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Today's Performance</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Tickets', value: stats.total, color: 'text-blue-600' },
                    { label: 'Completed', value: stats.completed, color: 'text-emerald-600' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
                    { label: 'Urgent', value: stats.urgent, color: 'text-red-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mt-8">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Volume Overview</h4>
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={ { width: `${(stats.completed / (stats.total || 1)) * 100}%` } }
                    />
                    <div 
                      className="bg-amber-500 h-full" 
                      style={ { width: `${(stats.pending / (stats.total || 1)) * 100}%` } }
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
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Push Notifications</span>
                        <div className="w-11 h-6 bg-blue-600 rounded-full relative p-1 cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">New Ticket Alerts</span>
                        <div className="w-11 h-6 bg-blue-600 rounded-full relative p-1 cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Language</h4>
                    <select className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium">
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center z-50 lg:hidden">
          {[
            { id: 'tickets', icon: FiClipboard, label: 'Tickets' },
            { id: 'team', icon: FiUsers, label: 'Team' },
            { id: 'stats', icon: FiBarChart2, label: 'Stats' },
            { id: 'settings', icon: FiSettings, label: 'Settings' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)} 
              className={`flex flex-col items-center gap-1 px-4 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Ticket Details Panel/Sheet */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div 
              initial={ { opacity: 0 } }
              animate={ { opacity: 1 } }
              exit={ { opacity: 0 } }
              onClick={() => setSelectedTicket(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div 
              initial={ { y: '100%' } }
              animate={ { y: 0 } }
              exit={ { y: '100%' } }
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl p-6 z-50 lg:hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
              <TicketDetails 
                ticket={selectedTicket} 
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={updateTicketStatus}
                team={teamMembers}
              />
            </motion.div>

            {/* Desktop Side Panel */}
            <motion.div 
              initial={ { x: '100%' } }
              animate={ { x: 0 } }
              exit={ { x: '100%' } }
              className="hidden lg:block fixed top-0 right-0 bottom-0 w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-50 shadow-2xl p-8 overflow-y-auto"
            >
              <TicketDetails 
                ticket={selectedTicket} 
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={updateTicketStatus}
                team={teamMembers}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketDetails({ ticket, onClose, onUpdateStatus, team }: { 
  ticket: Ticket, 
  onClose: () => void, 
  onUpdateStatus: (id: string, status: string) => void,
  team: TeamMember[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Room {ticket.guestRoom}</h4>
          <p className="text-slate-500 text-sm">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full lg:hidden">
          <FiLogOut className="w-5 h-5 rotate-180" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            {ticket.requestText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Priority</label>
            <span className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase ${
              ticket.priority === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {ticket.priority}
            </span>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Status</label>
            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-xs uppercase">
              {ticket.status}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Actions</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onUpdateStatus(ticket.id, 'in-progress')}
              className="py-3 px-4 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Start Task
            </button>
            <button 
              onClick={() => onUpdateStatus(ticket.id, 'completed')}
              className="py-3 px-4 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 dark:shadow-none"
            >
              Complete
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assign Staff</label>
          <select 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium"
            defaultValue={ticket.assignedTo || ""}
          >
            <option value="">Unassigned</option>
            {team.map(m => (
              <option key={m.id} value={m.id}>{m.fullName || m.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Communication</label>
          <button className="w-full flex items-center justify-center gap-2 py-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <FiMessageSquare /> Message Staff
          </button>
        </div>
      </div>
      
      <button 
        onClick={onClose}
        className="hidden lg:block w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold mt-8"
      >
        Close Panel
      </button>
    </div>
  );
}
