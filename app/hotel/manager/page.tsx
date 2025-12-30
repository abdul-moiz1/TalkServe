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
  FiMenu,
  FiX,
  FiChevronRight,
  FiUser
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
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

export default function ManagerPortal() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'tickets' | 'team'>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const businessId = searchParams.get('businessId') || localStorage.getItem('currentBusinessId') || '';
  const department = searchParams.get('department') || localStorage.getItem('userDepartment') || '';

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }
    fetchData();
  }, [user, authLoading, businessId, department, filterStatus]);

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

      if (ticketsData.success) setTickets(ticketsData.tickets || []);
      if (teamData.success) setTeamMembers(teamData.members || []);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="px-6 pt-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Manager Portal</h1>
        
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('tickets')} className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Tickets</button>
          <button onClick={() => setActiveTab('team')} className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white dark:bg-slate-800 text-slate-500'}`}>Team</button>
        </div>

        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-600">Room {ticket.guestRoom}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg">{ticket.status}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{ticket.requestText}</p>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{ticket.priority}</span>
                  <FiChevronRight />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center font-bold text-slate-500 uppercase">{member.email.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{member.email}</p>
                    <p className="text-xs text-slate-500 capitalize">{member.role} • {member.department}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('tickets')} className={`flex flex-col items-center gap-1 ${activeTab === 'tickets' ? 'text-blue-600' : 'text-slate-400'}`}>
          <FiClipboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Live</span>
        </button>
        <button onClick={() => setActiveTab('team')} className={`flex flex-col items-center gap-1 ${activeTab === 'team' ? 'text-blue-600' : 'text-slate-400'}`}>
          <FiUsers className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Team</span>
        </button>
        <button onClick={() => logout()} className="flex flex-col items-center gap-1 text-red-400">
          <FiLogOut className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </div>
  );
}
