'use client';

import React, { useState } from 'react';
import { FiCopy, FiCheck, FiX, FiMail } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface InviteSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  email: string;
  role: string;
  department: string;
  language: string;
}

export default function InviteSuccessModal({
  isOpen,
  onClose,
  inviteLink,
  email,
  role,
  department,
  language,
}: InviteSuccessModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyToClipboard = (text: string, type: 'link' | 'email') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FiCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Invite Sent!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Invite Details */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FiMail className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600 dark:text-slate-400">Email sent to:</span>
              <span className="font-medium text-slate-900 dark:text-white">{email}</span>
            </div>
            <div className="text-sm space-y-1">
              <p className="text-slate-600 dark:text-slate-400">
                Role: <span className="font-medium text-slate-900 dark:text-white">{role}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Department: <span className="font-medium text-slate-900 dark:text-white">{department}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Language: <span className="font-medium text-slate-900 dark:text-white">{language}</span>
              </p>
            </div>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Share Invite Link
            </label>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 flex items-center gap-2 group">
              <code className="flex-1 text-xs text-slate-300 truncate font-mono">
                {inviteLink}
              </code>
              <button
                onClick={() => copyToClipboard(inviteLink, 'link')}
                className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
                title="Copy link"
              >
                {copiedLink ? (
                  <FiCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ✅ {copiedLink ? 'Link copied to clipboard!' : 'Click to copy the invite link'}
            </p>
          </div>

          {/* Email Address Copy */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Recipient Email
            </label>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-900 dark:text-white">{email}</span>
              <button
                onClick={() => copyToClipboard(email, 'email')}
                className="flex-shrink-0 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-all"
                title="Copy email"
              >
                {copiedEmail ? (
                  <FiCheck className="w-4 h-4 text-emerald-500" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>Next Steps:</strong> Share the invite link with {email.split('@')[0]}. They can click the link to sign up and join your team.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => copyToClipboard(inviteLink, 'link')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all font-medium"
            >
              <FiCopy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
