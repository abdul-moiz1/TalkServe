'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiPhone, 
  FiAlertCircle, 
  FiMessageSquare, 
  FiClock, 
  FiUser, 
  FiCheckCircle,
  FiRefreshCw,
  FiInfo,
  FiCalendar,
  FiZap,
  FiX,
  FiStar
} from 'react-icons/fi';

interface Message {
  id: string;
  from: string;
  to: string;
  message: string;
  created_at: string;
  direction: 'incoming' | 'outgoing';
}

interface ConversationResponse {
  success: boolean;
  phone: string;
  totalReturned: number;
  hasMore: boolean;
  nextStartAfter: string;
  messages: Message[];
}

export default function SMSConversationDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const phone = params.phone as string;
  const date = params.date as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<{
    sentiment: string;
    summary: string;
    keyTopics: string[];
    customerMood: string;
    rating: number;
  } | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    
    setIsSummarizing(true);
    setSummaryError(null);
    
    try {
      const response = await fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            direction: m.direction,
            message: m.message,
            created_at: m.created_at
          }))
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze conversation');
      }
      
      setSummary(data);
      setShowSummary(true);
    } catch (err) {
      console.error('Error summarizing:', err);
      setSummaryError(err instanceof Error ? err.message : 'Failed to summarize conversation');
    } finally {
      setIsSummarizing(false);
    }
  };

  const fetchConversations = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const response = await fetch(`/api/sms-conversations?phone=${phone}&date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch SMS conversations');
      }
      const data: ConversationResponse = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setError(null);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      console.error('Error fetching SMS conversations:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setFetchingMessages(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && phone && date) {
      fetchConversations();
    }
  }, [user, phone, date]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDisplayDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatPhoneNumber = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return `+${phoneNum}`;
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    const sortedMessages = [...msgs].reverse();
    
    sortedMessages.forEach((message) => {
      const msgDate = new Date(message.created_at).toDateString();
      if (!groups[msgDate]) {
        groups[msgDate] = [];
      }
      groups[msgDate].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const totalMessages = messages.length;
  const incomingMessages = messages.filter(m => m.direction === 'incoming').length;
  const outgoingMessages = messages.filter(m => m.direction === 'outgoing').length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <button
            onClick={() => window.history.back()}
            className="self-start p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FiMessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                SMS Conversation
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5">
                  <FiPhone className="w-4 h-4" />
                  <span>{formatPhoneNumber(phone)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-4 h-4" />
                  <span>{formatDisplayDate(date)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold">{totalMessages}</div>
              <div className="text-xs text-blue-200">Messages</div>
            </div>
            <button
              onClick={handleSummarize}
              disabled={isSummarizing || messages.length === 0}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              title="Summarize conversation"
            >
              <FiZap className={`w-5 h-5 ${isSummarizing ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline text-sm font-medium">Summarize</span>
            </button>
            <button
              onClick={() => fetchConversations(true)}
              disabled={isRefreshing}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center"
              title="Refresh messages"
            >
              <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          SMS History
          {totalMessages > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({incomingMessages} received, {outgoingMessages} sent)
            </span>
          )}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {fetchingMessages ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading SMS messages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{error}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Please try again or go back</p>
            <button 
              onClick={() => {
                setFetchingMessages(true);
                fetchConversations();
              }}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <FiMessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-2">No SMS messages found</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
              No SMS messages were found for this date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex justify-center sticky top-0 z-10 py-2">
                      <span className="px-3 py-1.5 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full shadow-sm border border-gray-200 dark:border-slate-700">
                        {formatDisplayDate(dateMessages[0].created_at)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {dateMessages.map((message, index) => {
                        const isOutgoing = message.direction === 'outgoing';
                        const isFirstInGroup = index === 0 || dateMessages[index - 1]?.direction !== message.direction;
                        const isLastInGroup = index === dateMessages.length - 1 || dateMessages[index + 1]?.direction !== message.direction;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : ''}`}
                          >
                            <div
                              className={`
                                relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] px-4 py-2.5
                                ${isOutgoing
                                  ? `bg-blue-600 text-white shadow-lg shadow-blue-600/20
                                     ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-br-lg' : ''}
                                     ${isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-br-md' : ''}
                                     ${!isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tr-md rounded-br-lg' : ''}
                                     ${!isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-r-md' : ''}`
                                  : `bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-slate-600
                                     ${isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-bl-lg' : ''}
                                     ${isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-bl-md' : ''}
                                     ${!isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tl-md rounded-bl-lg' : ''}
                                     ${!isFirstInGroup && !isLastInGroup ? 'rounded-2xl rounded-l-md' : ''}`
                                }
                              `}
                            >
                              <p className="text-sm sm:text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                                {message.message}
                              </p>
                              <div className={`flex items-center justify-end gap-1 mt-1.5 ${
                                isOutgoing ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                              }`}>
                                <span className="text-[10px] sm:text-xs font-medium">
                                  {formatTime(message.created_at)}
                                </span>
                                {isOutgoing && (
                                  <FiCheckCircle className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <FiInfo className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium">This is a read-only view of your SMS conversation history</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!fetchingMessages && !error && messages.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
            <FiClock className="w-4 h-4" />
            <span>
              Showing {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {summaryError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <FiAlertCircle className="w-5 h-5" />
            <p className="font-medium">{summaryError}</p>
          </div>
        </div>
      )}

      {showSummary && summary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FiZap className="w-5 h-5 text-blue-600" />
                SMS Analysis
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  summary.sentiment === 'positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  summary.sentiment === 'negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                }`}>
                  {summary.sentiment.charAt(0).toUpperCase() + summary.sentiment.slice(1)} Sentiment
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      className={`w-5 h-5 ${star <= summary.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-slate-600'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Summary</h4>
                <p className="text-gray-900 dark:text-white">{summary.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Customer Mood</h4>
                <p className="text-gray-900 dark:text-white">{summary.customerMood}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.keyTopics.map((topic, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowSummary(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
