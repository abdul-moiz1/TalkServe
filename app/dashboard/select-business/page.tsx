'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiPlus, FiBriefcase, FiLoader, FiArrowRight } from 'react-icons/fi';
import Button from '@/components/Button';

interface Business {
  businessId: string;
  businessName: string;
  businessType: string;
  role: string;
}

export default function BusinessSelectorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/signin');
      return;
    }

    fetchBusinesses();
  }, [user, authLoading]);

  const fetchBusinesses = async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/hotel/user-businesses', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();
      if (data.success) {
        setBusinesses(data.businesses);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (business: Business) => {
    localStorage.setItem('currentBusinessId', business.businessId);
    if (business.role === 'admin') {
      router.push(`/admin/hotel?businessId=${business.businessId}`);
    } else if (business.role === 'manager') {
      router.push(`/dashboard/hotel/manager?businessId=${business.businessId}`);
    } else {
      router.push(`/dashboard/hotel/staff?businessId=${business.businessId}`);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Businesses</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Select a business to manage or create a new one</p>
        </div>

        <div className="grid gap-6">
          {businesses.map((biz) => (
            <motion.div
              key={biz.businessId}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelect(biz)}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <FiBriefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{biz.businessName}</h3>
                  <p className="text-sm text-slate-500 capitalize">{biz.businessType} • {biz.role}</p>
                </div>
              </div>
              <FiArrowRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          ))}

          <Button
            onClick={() => router.push('/dashboard/onboarding')}
            className="w-full py-6 text-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all"
          >
            <FiPlus className="w-5 h-5" />
            Create New Business
          </Button>
        </div>
      </div>
    </div>
  );
}
