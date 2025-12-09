'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FiArrowLeft, 
  FiPhone, 
  FiAlertCircle, 
  FiMessageCircle, 
  FiClock, 
  FiUser, 
  FiCheckCircle,
  FiRefreshCw,
  FiInfo,
  FiCalendar,
  FiZap,
  FiLoader
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

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  keyTopics: string[];
  customerMood: string;
  rating: number;
}

export default function FullConversationPage() {
  const { user } = useAuth();
  const params = useParams();
  const phone = params.phone as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentResult, setSentimentResult] = useState<SentimentResult | null>(null);
  const [showSentiment, setShowSentiment] = useState(false);

  const fetchConversations = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      let allMessages: Message[] = [];
      let hasMore = true;
      let startAfter: string | null = null;
      
      while (hasMore) {
        const url = new URL(`/api/conversations`, window.location.origin);
        url.searchParams.set('phone', phone);
        if (startAfter) {
          url.searchParams.set('startAfter', startAfter);
        }
        
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data: ConversationResponse = await response.json();
        if (data.success) {
          allMessages = [...allMessages, ...(data.messages || [])];
          hasMore = data.hasMore;
          startAfter = data.nextStartAfter;
        } else {
          throw new Error('API returned unsuccessful response');
        }
      }
      
      setMessages(allMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load messages. Please try again later.');
    } finally {
      setFetchingMessages(false);
      setIsRefreshing(false);
    }
  }, [phone]);

  const analyzeSentiment = async () => {
    if (messages.length === 0) return;
    
    setIsAnalyzing(true);
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
      
      if (!response.ok) throw new Error('Failed to analyze');
      
      const result = await response.json();
      setSentimentResult(result);
      setShowSentiment(true);
    } catch (err) {
      console.error('Error analyzing sentiment:', err);
      alert('Failed to analyze conversation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (user && phone) {
      fetchConversations();
    }
  }, [user, phone, fetchConversations]);

  useEffect(() => {
    if (messages.length > 0 && !fetchingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, fetchingMessages]);

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
    const sortedMessages = [...msgs].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    sortedMessages.forEach((message) => {
      const msgDate = new Date(message.created_at).toDateString();
      if (!groups[msgDate]) {
        groups[msgDate] = [];
      }
      groups[msgDate].push(message);
    });

    return groups;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const messageGroups = groupMessagesByDate(messages);
  const sortedDates = Object.keys(messageGroups).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

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
              <FiUser className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                Full Conversation
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5">
                  <FiPhone className="w-4 h-4" />
                  <span>{formatPhoneNumber(phone)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="w-4 h-4" />
                  <span>All Messages</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
              <div className="text-2xl font-bold">{totalMessages}</div>
              <div className="text-xs text-blue-200">Messages</div>
            </div>
            <button
              onClick={analyzeSentiment}
              disabled={isAnalyzing || messages.length === 0}
              className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
              title="Analyze conversation with AI"
            >
              {isAnalyzing ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiZap className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">Summarize</span>
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

      {showSentiment && sentimentResult && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FiZap className="w-5 h-5 text-blue-600" />
              AI Analysis
            </h3>
            <button 
              onClick={() => setShowSentiment(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Sentiment</p>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getSentimentColor(sentimentResult.sentiment)}`}>
                {sentimentResult.sentiment.charAt(0).toUpperCase() + sentimentResult.sentiment.slice(1)}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Mood</p>
              <p className="text-gray-900 dark:text-white">{sentimentResult.customerMood}</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Summary</p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{sentimentResult.summary}</p>
          </div>
          
          {sentimentResult.keyTopics.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Key Topics</p>
              <div className="flex flex-wrap gap-2">
                {sentimentResult.keyTopics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Message History
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
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading all messages...</p>
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
              <FiMessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-2">No messages found</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm">
              No messages were found for this conversation.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            <div 
              ref={messagesContainerRef}
              className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
            >
              <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                {sortedDates.map((dateKey) => {
                  const dateMessages = messageGroups[dateKey];
                  return (
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
                  );
                })}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                <FiInfo className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium">This is a read-only view of your complete conversation history</p>
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
              Showing all {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
