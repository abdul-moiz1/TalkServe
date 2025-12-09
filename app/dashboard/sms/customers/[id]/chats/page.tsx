'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiMessageCircle, 
  FiAlertCircle, 
  FiExternalLink,
  FiPhone,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiFilter,
  FiX,
  FiFileText,
  FiMessageSquare
} from 'react-icons/fi';

interface ChatSession {
  date: string;
  messageCount: number;
  mood: string;
  summary: string;
}

interface Customer {
  id: string;
  waId: number;
  name: string;
  experience: string;
}

interface ChatSessionsResponse {
  success: boolean;
  customer: string;
  sessions: ChatSession[];
  pagination: {
    returned: number;
    hasMore: boolean;
    nextStartAfter: string | null;
  };
}

interface ConversationResponse {
  success: boolean;
  messages: { id: string }[];
}

export default function SMSCustomerChatsPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const customerId = params.id as string;
  const customerPhone = searchParams.get('phone');
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actualMessageCounts, setActualMessageCounts] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    async function fetchCustomerData() {
      if (!user?.uid) return;
      
      try {
        const response = await fetch(`/api/sms-customers?uid=${user.uid}`);
        if (!response.ok) throw new Error('Failed to fetch customer');
        
        const data = await response.json();
        if (data.success) {
          const foundCustomer = data.data.find((c: Customer) => c.id.trim() === customerId.trim());
          if (foundCustomer) {
            setCustomer(foundCustomer);
            await fetchChatSessions(foundCustomer.waId);
          } else {
            setError('Customer not found');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer data');
        setLoading(false);
      }
    }

    async function fetchChatSessions(phone: number) {
      try {
        const response = await fetch(`/api/sms-chat-sessions?customer=${phone}`);
        if (!response.ok) throw new Error('Failed to fetch chat sessions');
        
        const data: ChatSessionsResponse = await response.json();
        if (data.success) {
          const sessions = data.sessions || [];
          setChatSessions(sessions);
          setFilteredSessions(sessions);
          
          await fetchActualMessageCounts(phone, sessions);
        }
      } catch (err) {
        console.error('Error fetching SMS chat sessions:', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchActualMessageCounts(phone: number, sessions: ChatSession[]) {
      const counts: { [date: string]: number } = {};
      
      await Promise.all(
        sessions.map(async (session) => {
          try {
            const response = await fetch(`/api/sms-conversations?phone=${phone}&date=${session.date}`);
            if (response.ok) {
              const data: ConversationResponse = await response.json();
              if (data.success && data.messages) {
                counts[session.date] = data.messages.length;
              }
            }
          } catch (err) {
            console.error(`Error fetching messages for date ${session.date}:`, err);
          }
        })
      );
      
      setActualMessageCounts(counts);
    }

    fetchCustomerData();
  }, [user, customerId]);

  useEffect(() => {
    let filtered = chatSessions;

    if (startDate) {
      filtered = filtered.filter(session => session.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(session => session.date <= endDate);
    }

    setFilteredSessions(filtered);
  }, [startDate, endDate, chatSessions]);

  const getMoodConfig = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'positive':
        return {
          bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
          textColor: 'text-emerald-700 dark:text-emerald-400',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          icon: FiTrendingUp,
          label: 'Positive'
        };
      case 'negative':
        return {
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: FiTrendingDown,
          label: 'Negative'
        };
      default:
        return {
          bgColor: 'bg-slate-50 dark:bg-slate-800',
          textColor: 'text-slate-600 dark:text-slate-400',
          borderColor: 'border-slate-200 dark:border-slate-700',
          icon: FiMinus,
          label: 'Neutral'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = startDate || endDate;

  const getMessageCount = (session: ChatSession) => {
    return actualMessageCounts[session.date] ?? session.messageCount;
  };

  const totalMessages = chatSessions.reduce((acc, s) => acc + getMessageCount(s), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Link
            href="/dashboard/sms/customers"
            className="self-start p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl sm:text-3xl font-bold flex-shrink-0">
              {customer?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {customer?.name || 'Loading...'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5">
                  <FiPhone className="w-4 h-4" />
                  <span>+{customer?.waId || '...'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold">{chatSessions.length}</div>
              <div className="text-xs text-blue-200">Sessions</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold">{totalMessages}</div>
              <div className="text-xs text-blue-200">Messages</div>
            </div>
            <Link
              href={`/dashboard/sms-conversation/${customer?.waId}`}
              className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/30 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <FiMessageCircle className="w-4 h-4" />
              <span>View All</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          SMS Sessions
          {hasActiveFilters && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({filteredSessions.length} of {chatSessions.length})
            </span>
          )}
        </h2>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-slate-700'
          }`}
        >
          <FiFilter className="w-4 h-4" />
          <span>Filter by Date</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs">
              1
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="grid grid-cols-2 gap-4 flex-1 w-full">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  From
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  To
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors whitespace-nowrap"
              >
                <FiX className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 sm:p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading SMS sessions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 sm:p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{error}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Please try again or go back to customers</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 sm:p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <FiMessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-2">
              {hasActiveFilters ? 'No SMS in selected range' : 'No SMS sessions yet'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
              {hasActiveFilters 
                ? 'Try adjusting your date range filter to see more results.'
                : 'SMS sessions with this customer will appear here.'}
            </p>
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="mt-4 px-6 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session, index) => {
            const moodConfig = getMoodConfig(session.mood);
            const MoodIcon = moodConfig.icon;
            const messageCount = getMessageCount(session);
            
            return (
              <div
                key={`${session.date}-${index}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                      <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white font-bold text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                        {customer?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
                            <FiCalendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDate(session.date)}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${moodConfig.bgColor} ${moodConfig.textColor} ${moodConfig.borderColor}`}>
                            <MoodIcon className="w-3 h-3" />
                            <span>{moodConfig.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                            <FiMessageSquare className="w-3.5 h-3.5" />
                            <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FiFileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">
                            {messageCount > 0 && session.summary?.toLowerCase().includes('no messages') 
                              ? 'Click "Open SMS" to view conversation and generate AI summary' 
                              : (session.summary || 'No summary available')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/sms-conversation/${customer?.waId}/${session.date}`}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 group-hover:scale-[1.02] whitespace-nowrap w-full sm:w-auto"
                    >
                      <span>Open SMS</span>
                      <FiExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && filteredSessions.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
            <FiMessageSquare className="w-4 h-4" />
            <span>
              Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` of ${chatSessions.length} total`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
