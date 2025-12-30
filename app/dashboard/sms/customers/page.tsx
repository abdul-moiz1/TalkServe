'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { FiSearch, FiAlertCircle, FiUsers, FiPhone, FiMessageCircle, FiChevronRight, FiUserPlus, FiPhoneCall, FiMessageSquare } from 'react-icons/fi';

interface Customer {
  id: string;
  waId: number;
  name: string;
  experience: string;
}

interface ApiResponse {
  success: boolean;
  data: Customer[];
  pagination: {
    totalReturned: number;
    hasMore: boolean;
    nextStartAfter: string;
  };
}

export default function SMSCustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [fetchingCustomers, setFetchingCustomers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchCustomers() {
      if (!user?.uid) return;
      
      try {
        const response = await fetch(`/api/sms-customers?uid=${user.uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }
        const data: ApiResponse = await response.json();
        if (data.success) {
          setCustomers(data.data || []);
          setFilteredCustomers(data.data || []);
        } else {
          throw new Error('API returned unsuccessful response');
        }
      } catch (err) {
        console.error('Error fetching SMS customers:', err);
        setError('Failed to load SMS customers. Please try again later.');
      } finally {
        setFetchingCustomers(false);
      }
    }

    fetchCustomers();
  }, [user]);

  useEffect(() => {
    let filtered = customers;

    if (searchQuery) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(customer.waId).includes(searchQuery)
      );
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  if (fetchingCustomers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            SMS Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and view your SMS customer interactions
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 sm:p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading SMS customers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            SMS Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and view your SMS customer interactions
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-12 sm:p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">{error}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Please try again or contact support</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FiMessageSquare className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">
                  SMS Customers
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  Manage and view your SMS customer interactions
                </p>
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-blue-200">Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[80px]">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-blue-200">Conversations</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 sm:p-12 md:p-16">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <FiUserPlus className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No SMS customers yet
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Your SMS customer list is empty. When customers interact with your AI voice agent through SMS, they will automatically appear here.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FiPhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Voice Calls</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Incoming calls tracked</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FiMessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">SMS Messages</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Text conversations</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <FiMessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chat interactions</p>
                </div>
              </div>

              <Link
                href="/dashboard/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/25"
              >
                Complete Onboarding
                <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            SMS Customers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and view your SMS customer interactions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone number..."
              className="pl-12 pr-4 py-3 w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <FiSearch className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold mb-2">
              No customers found
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm mb-4">
              No customers match your current search or filter criteria.
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-6 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors font-medium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <FiPhone className="w-4 h-4" />
                          <span>+{customer.waId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/sms/customers/${customer.id.trim()}/chats?phone=${customer.waId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/25 group-hover:scale-105"
                        >
                          <FiMessageSquare className="w-4 h-4" />
                          View Chat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {filteredCustomers.map((customer) => (
                <Link
                  key={customer.id}
                  href={`/dashboard/sms/customers/${customer.id.trim()}/chats?phone=${customer.waId}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors active:bg-gray-100 dark:active:bg-slate-700/50"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1">{customer.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiPhone className="w-3 h-3" />
                      +{customer.waId}
                    </p>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {filteredCustomers.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-600 dark:text-gray-400">
            <FiUsers className="w-4 h-4" />
            <span>
              Showing {filteredCustomers.length} of {customers.length} customers
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
