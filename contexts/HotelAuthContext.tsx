'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { getAdminDb } from '@/lib/firebase-admin';

export type UserRole = 'admin' | 'manager' | 'staff';
export type BusinessType = 'restaurant' | 'dental' | 'services' | 'hotel';

export interface BusinessMembership {
  businessId: string;
  businessName: string;
  businessType: BusinessType;
  role: UserRole;
  department?: string;
  joinedAt: string;
}

export interface HotelAuthContextType {
  user: User | null;
  businesses: BusinessMembership[];
  currentBusiness: BusinessMembership | null;
  selectBusiness: (businessId: string) => void;
  role: UserRole | null;
  department: string | null;
  businessType: BusinessType | null;
  loading: boolean;
}

const HotelAuthContext = createContext<HotelAuthContextType | undefined>(undefined);

export const useHotelAuth = () => {
  const context = useContext(HotelAuthContext);
  if (!context) {
    throw new Error('useHotelAuth must be used within HotelAuthProvider');
  }
  return context;
};

export const HotelAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessMembership[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessMembership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserBusinesses = async () => {
      try {
        const response = await fetch('/api/hotel/user-businesses', {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        });
        const data = await response.json();
        
        if (data.success && data.businesses) {
          setBusinesses(data.businesses);
          // Set first business as default
          if (data.businesses.length > 0) {
            setCurrentBusiness(data.businesses[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBusinesses();
  }, [user]);

  const selectBusiness = (businessId: string) => {
    const selected = businesses.find(b => b.businessId === businessId);
    if (selected) {
      setCurrentBusiness(selected);
    }
  };

  const value = {
    user,
    businesses,
    currentBusiness,
    selectBusiness,
    role: currentBusiness?.role || null,
    department: currentBusiness?.department || null,
    businessType: currentBusiness?.businessType || null,
    loading,
  };

  return (
    <HotelAuthContext.Provider value={value}>
      {children}
    </HotelAuthContext.Provider>
  );
};
