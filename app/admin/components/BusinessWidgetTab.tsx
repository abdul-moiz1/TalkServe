'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiToggle2, FiCopy, FiCheck, FiLoader, FiAlertCircle, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface Owner {
  id: string;
  uuid: string;
  ownerName: string;
  businessName: string;
  ownerEmail: string;
}

interface WidgetData {
  id: string;
  widgetActive: boolean;
  businessName: string;
  businessSettings: {
    description?: string;
    hours?: string;
    services?: string;
    rules?: string[];
  };
}

interface EditingData {
  description: string;
  hours: string;
  services: string;
  rules: string[];
}

export default function BusinessWidgetTab({ owners, user }: { owners: Owner[]; user: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [widgetData, setWidgetData] = useState<WidgetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [widgetScript, setWidgetScript] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<EditingData>({
    description: '',
    hours: '',
    services: '',
    rules: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/admin/widget-status?uuid=${owner.uuid}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setWidgetData(result.data);
        setEditingData({
          description: result.data.businessSettings?.description || '',
          hours: result.data.businessSettings?.hours || '',
          services: result.data.businessSettings?.services || '',
          rules: result.data.businessSettings?.rules || [],
        });

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
      setError('Failed to load widget data');
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

  const toggleWidget = async () => {
    if (!widgetData || !selectedOwner) return;

    setSaving(true);
    setError(null);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/widget-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: selectedOwner.uuid,
          widgetActive: !widgetData.widgetActive,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setWidgetData({
          ...widgetData,
          widgetActive: !widgetData.widgetActive,
        });
        setSuccess(`Widget ${!widgetData.widgetActive ? 'activated' : 'deactivated'} successfully`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to update widget status');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBusinessSettings = async () => {
    if (!selectedOwner) return;

    setSaving(true);
    setError(null);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/admin/widget-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: selectedOwner.uuid,
          businessSettings: {
            description: editingData.description,
            hours: editingData.hours,
            services: editingData.services,
            rules: editingData.rules.filter(r => r.trim()),
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setWidgetData({
          ...widgetData!,
          businessSettings: editingData,
        });
        setIsEditing(false);
        setSuccess('Business settings updated successfully');
        setTimeout(() => setSuccess(null), 3000);
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

      {/* Widget Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
      >
        {!selectedOwner ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">Select a business to manage its widget</p>
          </div>
        ) : loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-3">
            <FiLoader className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-slate-600 dark:text-slate-400">Loading widget data...</span>
          </div>
        ) : !widgetData ? (
          <div className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">No widget data found for this business</p>
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

            {/* Widget Status */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{widgetData.businessName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Widget Status: <span className={widgetData.widgetActive ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500 font-medium'}>
                      {widgetData.widgetActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <button
                  onClick={toggleWidget}
                  disabled={saving}
                  className={`p-3 rounded-lg transition-all ${
                    widgetData.widgetActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  } disabled:opacity-50`}
                >
                  <FiToggle2 className="w-6 h-6" />
                </button>
              </div>
            </div>

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

            {/* Business Settings */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Business Settings</h4>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea
                      value={editingData.description}
                      onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Hours</label>
                    <textarea
                      value={editingData.hours}
                      onChange={(e) => setEditingData({ ...editingData, hours: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">Services</label>
                    <textarea
                      value={editingData.services}
                      onChange={(e) => setEditingData({ ...editingData, services: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBusinessSettings}
                      disabled={saving}
                      className="flex items-center gap-2 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
                    >
                      <FiSave className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                    >
                      <FiX className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {widgetData.businessSettings?.description && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Description</p>
                      <p className="text-slate-800 dark:text-slate-200 mt-1">{widgetData.businessSettings.description}</p>
                    </div>
                  )}
                  {widgetData.businessSettings?.hours && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Hours</p>
                      <p className="text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">{widgetData.businessSettings.hours}</p>
                    </div>
                  )}
                  {widgetData.businessSettings?.services && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Services</p>
                      <p className="text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">{widgetData.businessSettings.services}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
