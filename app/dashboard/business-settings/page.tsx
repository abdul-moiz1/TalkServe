'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FiSave, FiArrowLeft, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

interface BusinessContext {
  description?: string;
  hours?: string;
  rules?: string[];
  services?: string[];
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
  const [services, setServices] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [fetchError, setFetchError] = useState('');
  
  // Voice settings
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [voiceGender, setVoiceGender] = useState('female');
  const [voicePitch, setVoicePitch] = useState(1);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  
  // Widget settings
  const [widgetLogoUrl, setWidgetLogoUrl] = useState('');
  const [widgetThemeMode, setWidgetThemeMode] = useState('dark');
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#0ea5e9');
  
  // Status
  const [status, setStatus] = useState('active');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/signin');
      return;
    }
    fetchBusinessContext();
  }, [user]);

  const fetchBusinessContext = async () => {
    setLoading(true);
    setFetchError('');
    try {
      if (!user?.uid) {
        setFetchError('User not authenticated');
        return;
      }

      const response = await fetch(`/api/save-business-context?uid=${user.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch business context');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setBusiness(data.data);
        setBusinessName(data.data.businessName || '');
        setDescription(data.data.context?.description || '');
        setHours(data.data.context?.hours || '');
        setRules(data.data.context?.rules && data.data.context.rules.length > 0 ? data.data.context.rules : ['']);
        setServices(data.data.context?.services && data.data.context.services.length > 0 ? data.data.context.services : ['']);
        
        // Load voice settings
        setVoiceLanguage(data.data.voice?.language || 'en');
        setVoiceGender(data.data.voice?.voiceGender || 'female');
        setVoicePitch(data.data.voice?.pitch || 1);
        setVoiceSpeed(data.data.voice?.speakingSpeed || 1);
        
        // Load widget settings
        setWidgetLogoUrl(data.data.widget?.logoUrl || '');
        setWidgetThemeMode(data.data.widget?.theme?.mode || 'dark');
        setWidgetPrimaryColor(data.data.widget?.theme?.primaryColor || '#0ea5e9');
        
        // Load status
        setStatus(data.data.status || 'active');
      } else if (data.success && !data.data) {
        // New business - reset to empty
        setBusiness(null);
        setBusinessName('');
        setDescription('');
        setHours('');
        setRules(['']);
        setServices(['']);
        setVoiceLanguage('en');
        setVoiceGender('female');
        setVoicePitch(1);
        setVoiceSpeed(1);
        setWidgetLogoUrl('');
        setWidgetThemeMode('dark');
        setWidgetPrimaryColor('#0ea5e9');
        setStatus('active');
      }
    } catch (err) {
      console.error('Error fetching business context:', err);
      setFetchError('Failed to load business settings. Please try again.');
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
          status: status,
          context: {
            description: description.trim(),
            hours: hours.trim(),
            rules: rules.filter(r => r.trim()),
            services: services.filter(s => s.trim())
          },
          voice: {
            language: voiceLanguage,
            pitch: voicePitch,
            speakingSpeed: voiceSpeed,
            voiceGender: voiceGender
          },
          widget: {
            logoUrl: widgetLogoUrl.trim(),
            theme: {
              mode: widgetThemeMode,
              primaryColor: widgetPrimaryColor
            }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your business settings...</p>
        </div>
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

        {(error || fetchError) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-400">{error || fetchError}</p>
              {fetchError && (
                <button
                  onClick={fetchBusinessContext}
                  className="mt-2 flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <FiRefreshCw className="w-4 h-4" />
                  Try again
                </button>
              )}
            </div>
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
                { id: 'services', label: 'Services' },
                { id: 'rules', label: 'Rules' },
                { id: 'voice', label: 'Voice Settings' },
                { id: 'widget', label: 'Widget' }
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

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    Services / Offerings
                  </label>
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={service}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index] = e.target.value;
                            setServices(newServices);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Service ${index + 1}`}
                        />
                        {services.length > 1 && (
                          <button
                            onClick={() => setServices(services.filter((_, i) => i !== index))}
                            className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setServices([...services, ''])}
                    className="mt-4 px-4 py-2 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    + Add Service
                  </button>
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Examples: "Dine-In", "Takeaway", "Home Delivery", "Table Reservation", "Online Booking", etc.
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

            {/* Voice Settings Tab */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <select
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ur">Urdu</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Voice Gender
                  </label>
                  <select
                    value={voiceGender}
                    onChange={(e) => setVoiceGender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pitch: <span className="font-semibold text-blue-600">{voicePitch.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voicePitch}
                    onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Lower values = deeper voice, Higher values = higher pitch</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Speaking Speed: <span className="font-semibold text-blue-600">{voiceSpeed.toFixed(1)}</span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Lower values = slower, Higher values = faster speech</p>
                </div>
              </div>
            )}

            {/* Widget Tab */}
            {activeTab === 'widget' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={widgetLogoUrl}
                    onChange={(e) => setWidgetLogoUrl(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme Mode
                  </label>
                  <select
                    value={widgetThemeMode}
                    onChange={(e) => setWidgetThemeMode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={widgetPrimaryColor}
                      onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                      className="h-12 w-20 border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={widgetPrimaryColor}
                      onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
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
