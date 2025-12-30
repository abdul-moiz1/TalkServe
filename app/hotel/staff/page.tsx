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
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LogoIcon className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-slate-900 dark:text-white">TalkServe</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by TalkServe</span>
      </header>
      
      <main className="flex-1 overflow-y-auto px-6 pt-8 pb-32 max-w-md mx-auto w-full">
        {/* Existing Content */}

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
