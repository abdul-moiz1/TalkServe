'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiPower, FiCopy, FiCheck, FiLoader, FiAlertCircle, FiSave, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Owner {
  id: string;
  uuid: string;
  ownerName: string;
  businessName: string;
  ownerEmail: string;
}

interface BusinessData {
  id: string;
  uid: string;
  businessName: string;
  status: string;
  context: {
    description?: string;
    hours?: string;
    services?: string[];
    rules?: string[];
  };
  voice?: {
    language?: string;
    pitch?: number;
    speakingSpeed?: number;
    voiceGender?: string;
  };
  widget?: {
    logoUrl?: string;
    theme?: {
      mode?: string;
      primaryColor?: string;
    };
  };
  widgetActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export default function BusinessWidgetTab({ owners, user }: { owners: Owner[]; user: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [widgetScript, setWidgetScript] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [servicesString, setServicesString] = useState('');
  const [rules, setRules] = useState<string[]>(['']);
  const [voiceLanguage, setVoiceLanguage] = useState('en');
  const [voiceGender, setVoiceGender] = useState('female');
  const [voicePitch, setVoicePitch] = useState(1);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [widgetLogoUrl, setWidgetLogoUrl] = useState('');
  const [widgetThemeMode, setWidgetThemeMode] = useState('dark');
  const [widgetPrimaryColor, setWidgetPrimaryColor] = useState('#0ea5e9');
  const [widgetStatus, setWidgetStatus] = useState('active');
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filteredOwners = owners.filter(owner =>
    owner.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    owner.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOwnerSelect = async (owner: Owner) => {
    setSelectedOwner(owner);
    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsEditing(false);

    try {
      const idToken = await user?.getIdToken();
      
      // Fetch business data from business collection using the same endpoint as onboarding
      const response = await fetch(`/api/save-business-context?uid=${owner.uuid}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setBusinessData(result.data);
        
        // Load all fields from business data (same as onboarding form)
        setBusinessName(result.data.businessName || '');
        setDescription(result.data.context?.description || '');
        setHours(result.data.context?.hours || '');
        
        // Convert services array to comma-separated string
        const servicesArray = result.data.context?.services || [];
        const servicesStr = Array.isArray(servicesArray) ? servicesArray.join(', ') : '';
        setServicesString(servicesStr);
        
        setRules(result.data.context?.rules && result.data.context.rules.length > 0 ? result.data.context.rules : ['']);
        setVoiceLanguage(result.data.voice?.language || 'en');
        setVoiceGender(result.data.voice?.voiceGender || 'female');
        setVoicePitch(result.data.voice?.pitch || 1);
        setVoiceSpeed(result.data.voice?.speakingSpeed || 1);
        setWidgetLogoUrl(result.data.widget?.logoUrl || '');
        setWidgetThemeMode(result.data.widget?.theme?.mode || 'dark');
        setWidgetPrimaryColor(result.data.widget?.theme?.primaryColor || '#0ea5e9');
        setWidgetStatus(result.data.status || 'active');
        setCreatedAt(result.data.createdAt ? new Date(result.data.createdAt.seconds ? result.data.createdAt.seconds * 1000 : result.data.createdAt) : null);
        setUpdatedAt(result.data.updatedAt ? new Date(result.data.updatedAt.seconds ? result.data.updatedAt.seconds * 1000 : result.data.updatedAt) : null);

        // Fetch widget script
        const scriptResponse = await fetch(`/api/admin/widget-script?uuid=${owner.uuid}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        const scriptResult = await scriptResponse.json();
        if (scriptResult.success) {
          setWidgetScript(scriptResult.data.script);
        }
      }
    } catch (err) {
      setError('Failed to load business data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSaveBusinessSettings = async () => {
    if (!selectedOwner || !businessData) return;

    setSaving(true);
    setError(null);
    try {
      // Convert comma-separated services to array
      const servicesArray = servicesString
        .split(',')
        .map(service => service.trim())
        .filter(service => service.length > 0);

      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/widget-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: selectedOwner.uuid,
          businessName: businessName.trim(),
          status: widgetStatus,
          context: {
            description: description.trim(),
            hours: hours.trim(),
            services: servicesArray,
            rules: rules.filter(r => r.trim()),
          },
          voice: {
            language: voiceLanguage,
            pitch: voicePitch,
            speakingSpeed: voiceSpeed,
            voiceGender: voiceGender,
          },
          widget: {
            logoUrl: widgetLogoUrl.trim(),
            theme: {
              mode: widgetThemeMode,
              primaryColor: widgetPrimaryColor,
            },
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Business settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setIsEditing(false);
        handleOwnerSelect(selectedOwner);
      } else {
        setError(result.error || 'Failed to save business settings');
      }
    } catch (err) {
      setError('Failed to save business settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Owners List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/50">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Businesses <span className="text-slate-500">({filteredOwners.length})</span>
          </h3>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredOwners.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No businesses found
            </div>
          ) : (
            filteredOwners.map(owner => (
              <motion.div
                key={owner.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => handleOwnerSelect(owner)}
                className={`p-3 cursor-pointer transition-all ${
                  selectedOwner?.id === owner.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30 border-l-4 border-l-transparent'
                }`}
              >
                <p className="font-medium text-sm text-slate-900 dark:text-white">{owner.businessName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{owner.ownerName}</p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Business Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
      >
        {!selectedOwner ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">Select a business to manage its settings</p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-3">
            <FiLoader className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-400">Loading business data...</span>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <p className="text-emerald-600 dark:text-emerald-400 text-sm">{success}</p>
              </div>
            )}

            {/* Header with Edit Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Business Settings</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                >
                  Edit Settings
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Hours</label>
                  <textarea
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Services */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Services</label>
                  <textarea
                    value={servicesString}
                    onChange={(e) => setServicesString(e.target.value)}
                    rows={3}
                    placeholder="Enter services separated by commas&#10;e.g., Dine-In, Takeaway, Home Delivery"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">💡 Separate multiple services with commas</p>
                </div>

                {/* Rules */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Business Rules</label>
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
                          className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Rule ${index + 1}`}
                        />
                        {rules.length > 1 && (
                          <button
                            type="button"
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
                    type="button"
                    onClick={() => setRules([...rules, ''])}
                    className="mt-4 px-4 py-2 text-blue-600 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm"
                  >
                    + Add Rule
                  </button>
                </div>

                {/* Voice Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Voice Settings</h4>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Language</label>
                      <select
                        value={voiceLanguage}
                        onChange={(e) => setVoiceLanguage(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Voice Gender</label>
                      <select
                        value={voiceGender}
                        onChange={(e) => setVoiceGender(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Pitch: <span className="font-semibold text-blue-600">{voicePitch.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voicePitch}
                      onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lower = deeper, Higher = higher pitch</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Speaking Speed: <span className="font-semibold text-blue-600">{voiceSpeed.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lower = slower, Higher = faster</p>
                  </div>
                </div>

                {/* Widget Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Widget Settings</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={widgetLogoUrl}
                      onChange={(e) => setWidgetLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme Mode</label>
                      <select
                        value={widgetThemeMode}
                        onChange={(e) => setWidgetThemeMode(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={widgetPrimaryColor}
                          onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                          className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={widgetPrimaryColor}
                          onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                          placeholder="#0ea5e9"
                          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Status & Information</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                    <select
                      value={widgetStatus}
                      onChange={(e) => setWidgetStatus(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Created At</label>
                      <div className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                        {createdAt ? createdAt.toLocaleString() : 'Not yet created'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Updated At</label>
                      <div className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                        {updatedAt ? updatedAt.toLocaleString() : 'Not yet updated'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleSaveBusinessSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 flex-1"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-6 py-3 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex-1"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Embed Script */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Embed Code</h4>
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-100 overflow-x-auto">
                    <pre className="break-words whitespace-pre-wrap">{widgetScript}</pre>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="mt-2 flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    {copiedScript ? (
                      <>
                        <FiCheck className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>

                {/* Display all fields */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Business Name</p>
                    <p className="text-slate-900 dark:text-white mt-1">{businessName}</p>
                  </div>
                  {description && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Description</p>
                      <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{description}</p>
                    </div>
                  )}
                  {hours && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Hours</p>
                      <p className="text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{hours}</p>
                    </div>
                  )}
                  {servicesString && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Services</p>
                      <p className="text-slate-900 dark:text-white mt-1">{servicesString}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
