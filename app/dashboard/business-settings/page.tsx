'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiSave, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';

interface BusinessContext {
  description?: string;
  hours?: string;
  rules?: string[];
}

interface Business {
  id: string;
  uid: string;
  businessName: string;
  context: BusinessContext;
}

export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [rules, setRules] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (!user?.uid) return;
    fetchBusinessContext();
  }, [user?.uid]);

  const fetchBusinessContext = async () => {
    try {
      const response = await fetch(`/api/save-business-context?uid=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setBusiness(data.data);
          setBusinessName(data.data.businessName);
          setDescription(data.data.context?.description || '');
          setHours(data.data.context?.hours || '');
          setRules(data.data.context?.rules || ['']);
        }
      }
    } catch (err) {
      console.error('Error fetching business context:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/save-business-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user?.uid,
          businessName: businessName.trim(),
          context: {
            description: description.trim(),
            hours: hours.trim(),
            rules: rules.filter(r => r.trim())
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Business settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
        fetchBusinessContext();
      } else {
        setError(data.error || 'Failed to save business settings');
      }
    } catch (err) {
      setError('Failed to save business settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Business Settings
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-emerald-700 dark:text-emerald-400">{success}</p>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <div className="flex">
              {[
                { id: 'info', label: 'Business Info' },
                { id: 'hours', label: 'Hours' },
                { id: 'rules', label: 'Rules' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            {/* Business Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your business..."
                  />
                </div>
              </div>
            )}

            {/* Hours Tab */}
            {activeTab === 'hours' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Hours
                  </label>
                  <textarea
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Monday - Friday: 9:00 AM - 5:00 PM&#10;Saturday: 10:00 AM - 3:00 PM&#10;Sunday: Closed"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Enter your business hours in a clear format
                  </p>
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Business Rules / Instructions
                  </label>
                  <div className="space-y-3">
                    {rules.map((rule, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => {
                            const newRules = [...rules];
                            newRules[index] = e.target.value;
                            setRules(newRules);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Rule ${index + 1}`}
                        />
                        {rules.length > 1 && (
                          <button
                            onClick={() => setRules(rules.filter((_, i) => i !== index))}
                            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setRules([...rules, ''])}
                    className="mt-4 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    + Add Rule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-lg"
          >
            <FiSave className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
