'use client';

import { useState, useEffect } from 'react';
import { HiCheckCircle, HiUpload, HiX, HiDownload, HiEye } from 'react-icons/hi';
import { useAuth } from '@/contexts/AuthContext';

const CHANNEL_OPTIONS = [
  { value: 'Whatsapp agent', label: 'Whatsapp agent' },
  { value: 'SMS agent', label: 'SMS agent' },
  { value: 'Voice agent', label: 'Voice agent' },
];

interface OnboardingData {
  id: string;
  ownerName?: string;
  ownerEmail?: string;
  businessName?: string;
  businessDescription?: string;
  services?: string;
  industryType?: string;
  type?: string;
  businessContextFileName?: string;
  businessContextUrl?: string;
}

interface BusinessContext {
  description?: string;
  hours?: string;
  rules?: string[];
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
}

function FilePreviewModal({ isOpen, onClose, fileName, fileUrl }: FilePreviewModalProps) {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isTextFile = fileExtension === 'txt';
  const isPdfFile = fileExtension === 'pdf';
  const isDocFile = fileExtension === 'doc' || fileExtension === 'docx';

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <HiEye className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{fileName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <HiX className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {isPdfFile ? (
            <div className="text-center py-8">
              <iframe
                src={fileUrl}
                className="w-full h-96 rounded-lg border border-slate-200 dark:border-slate-700"
                title="PDF Preview"
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mb-4">
                <HiDownload className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
                  {fileName}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {isTextFile && 'Text file'}
                  {isDocFile && 'Word document'}
                  {!isTextFile && !isDocFile && !isPdfFile && 'Document'}
                </p>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Click the button below to download and view your file.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <HiDownload className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerEmail: '',
    businessName: '',
    businessDescription: '',
    services: '',
    industryType: '',
  });
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [businessRules, setBusinessRules] = useState<string[]>(['']);
  const [businessServices, setBusinessServices] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('onboarding');
  
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
  const [businessStatus, setBusinessStatus] = useState('active');
  
  // Timestamps
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchExistingData() {
      if (!user?.uid) {
        setIsFetching(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();
        const [onboardingRes, businessContextRes] = await Promise.all([
          fetch('/api/onboarding', {
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          }),
          fetch(`/api/save-business-context?uid=${user.uid}`),
        ]);

        const onboardingResult = await onboardingRes.json();
        const businessContextResult = await businessContextRes.json();

        if (onboardingResult.success && onboardingResult.exists && onboardingResult.data) {
          const data: OnboardingData = onboardingResult.data;
          setFormData({
            ownerName: data.ownerName || '',
            ownerEmail: data.ownerEmail || '',
            businessName: data.businessName || '',
            businessDescription: data.businessDescription || '',
            services: data.services || '',
            industryType: data.industryType || '',
          });

          if (data.type) {
            const channels = data.type.split(', ').filter(c => c.trim());
            setSelectedChannels(channels);
          }

          setExistingDocId(data.id);
          setExistingFileName(data.businessContextFileName || null);
          setExistingFileUrl(data.businessContextUrl || null);
          setIsEditing(true);
        }

        if (businessContextResult.success && businessContextResult.data) {
          const businessData = businessContextResult.data;
          setBusinessName(businessData.businessName || '');
          setBusinessDescription(businessData.context?.description || '');
          setBusinessHours(businessData.context?.hours || '');
          setBusinessServices(businessData.context?.services || '');
          setBusinessRules(businessData.context?.rules && businessData.context.rules.length > 0 ? businessData.context.rules : ['']);
          
          // Load voice settings
          setVoiceLanguage(businessData.voice?.language || 'en');
          setVoiceGender(businessData.voice?.voiceGender || 'female');
          setVoicePitch(businessData.voice?.pitch || 1);
          setVoiceSpeed(businessData.voice?.speakingSpeed || 1);
          
          // Load widget settings
          setWidgetLogoUrl(businessData.widget?.logoUrl || '');
          setWidgetThemeMode(businessData.widget?.theme?.mode || 'dark');
          setWidgetPrimaryColor(businessData.widget?.theme?.primaryColor || '#0ea5e9');
          
          // Load status
          setBusinessStatus(businessData.status || 'active');
          
          // Load timestamps
          setCreatedAt(businessData.createdAt ? new Date(businessData.createdAt.seconds ? businessData.createdAt.seconds * 1000 : businessData.createdAt) : null);
          setUpdatedAt(businessData.updatedAt ? new Date(businessData.updatedAt.seconds ? businessData.updatedAt.seconds * 1000 : businessData.updatedAt) : null);
        }
      } catch (error) {
        console.error('Error fetching existing data:', error);
      } finally {
        setIsFetching(false);
      }
    }

    fetchExistingData();
  }, [user?.uid]);

  const handleChannelChange = (channel: string, checked: boolean) => {
    setSelectedChannels(prev => 
      checked 
        ? [...prev, channel]
        : prev.filter(c => c !== channel)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChannels.length === 0) {
      return;
    }
    
    setStatus('loading');

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('type', selectedChannels.join(', '));
      if (file) {
        formDataToSend.append('businessContext', file);
      }
      if (user?.uid) {
        formDataToSend.append('uuid', user.uid);
      }

      const idToken = await user?.getIdToken();
      const method = isEditing ? 'PUT' : 'POST';

      if (isEditing && existingDocId) {
        formDataToSend.append('documentId', existingDocId);
      }

      const response = await fetch('/api/onboarding', {
        method,
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        
        // If it's a hotel, redirect to the admin panel
        if (formData.industryType === 'hotel' && result.data?.businessId) {
          localStorage.setItem('currentBusinessId', result.data.businessId);
          router.push(`/admin/hotel?businessId=${result.data.businessId}`);
          return;
        }

        if (result.data) {
          if (result.data.businessContextFileName) {
            setExistingFileName(result.data.businessContextFileName);
          }
          if (result.data.businessContextUrl) {
            setExistingFileUrl(result.data.businessContextUrl);
          }
          if (result.data.id && !existingDocId) {
            setExistingDocId(result.data.id);
            setIsEditing(true);
          }
        }
        setFile(null);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveBusinessSettings = async () => {
    if (!user?.uid) return;

    setStatus('loading');
    try {
      // Convert comma-separated services to array
      const servicesArray = businessServices
        .split(',')
        .map(service => service.trim())
        .filter(service => service.length > 0);

      const response = await fetch('/api/save-business-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          businessName: businessName.trim(),
          status: businessStatus,
          context: {
            description: businessDescription.trim(),
            hours: businessHours.trim(),
            services: servicesArray,
            rules: businessRules.filter(r => r.trim())
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

      const result = await response.json();
      if (result.success) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error saving business settings:', error);
      setStatus('error');
    }
  };

  if (isFetching) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-slate-600 dark:text-slate-300">Loading your information...</span>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl p-12 text-center">
        <HiCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {isEditing ? 'Onboarding updated successfully!' : 'Onboarding submitted successfully!'}
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          {isEditing 
            ? 'Your changes have been saved. We\'ll process any updates and notify you if anything changes.'
            : 'Your WhatsApp integration will be fully activated and ready to use within the next 24 hours – we\'ll notify you the moment it goes live. Thank you for your patience!'
          }
        </p>
        <button
          onClick={() => {
            setIsPreviewOpen(false);
            setStatus('idle');
          }}
          className="text-primary font-semibold hover:underline"
        >
          {isEditing ? 'Make more changes' : 'Submit another form'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 flex">
        <button
          onClick={() => setActiveTab('onboarding')}
          className={`px-6 py-4 font-medium border-b-2 transition-colors ${
            activeTab === 'onboarding'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Onboarding
        </button>
        <button
          onClick={() => setActiveTab('business-settings')}
          className={`px-6 py-4 font-medium border-b-2 transition-colors ${
            activeTab === 'business-settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Business Settings
        </button>
      </div>

      {/* Onboarding Tab */}
      {activeTab === 'onboarding' && (
    <form onSubmit={handleSubmit} className="p-8">
      {isEditing && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg">
          <p className="text-blue-700 dark:text-blue-400">
            You have an existing onboarding submission. Update your information below.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Owner Name *
          </label>
          <input
            type="text"
            id="ownerName"
            name="ownerName"
            required
            value={formData.ownerName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="ownerEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Owner Email *
          </label>
          <input
            type="email"
            id="ownerEmail"
            name="ownerEmail"
            required
            value={formData.ownerEmail}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            required
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="industryType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Industry or Business Type *
          </label>
          <select
            id="industryType"
            name="industryType"
            required
            value={formData.industryType}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select an industry</option>
            <option value="hotel">Hotel</option>
            <option value="dental">Dental Clinic</option>
            <option value="restaurant">Restaurant</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="professional-services">Professional Services</option>
            <option value="home-services">Home Services</option>
            <option value="automotive">Automotive</option>
            <option value="hospitality">Hospitality</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="businessDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Short Description *
        </label>
        <textarea
          id="businessDescription"
          name="businessDescription"
          required
          rows={4}
          value={formData.businessDescription}
          onChange={handleChange}
          placeholder="Briefly describe your business and what you do..."
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="services" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Services *
        </label>
        <textarea
          id="services"
          name="services"
          required
          rows={4}
          value={formData.services}
          onChange={handleChange}
          placeholder="List the services you offer (e.g., consultations, repairs, appointments, etc.)..."
          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Channel *
        </label>
        <div className="flex flex-wrap gap-4">
          {CHANNEL_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedChannels.includes(option.value)}
                onChange={(e) => handleChannelChange(option.value, e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary focus:ring-2 bg-white dark:bg-slate-800"
              />
              <span className="text-slate-700 dark:text-slate-300">{option.label}</span>
            </label>
          ))}
        </div>
        {selectedChannels.length === 0 && status !== 'idle' && (
          <p className="mt-2 text-sm text-red-500">Please select at least one channel</p>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="businessContext" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Context Document
        </label>
        {existingFileName && !file && (
          <div className="mb-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Current file:{' '}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="font-medium text-primary hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                {existingFileName}
                <HiEye className="h-4 w-4" />
              </button>
            </p>
          </div>
        )}
        <div className="mt-2">
          <label
            htmlFor="businessContext"
            className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-slate-800"
          >
            <div className="text-center">
              <HiUpload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {file ? (
                  <span className="font-medium text-primary">{file.name}</span>
                ) : (
                  <>
                    <span className="font-medium text-primary">
                      {existingFileName ? 'Click to replace file' : 'Click to upload'}
                    </span>
                    <span> or drag and drop</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                PDF, Word, or Text files up to 10MB
              </p>
            </div>
            <input
              id="businessContext"
              name="businessContext"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            Something went wrong. Please try again or contact us at hello@talkserve.ai
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full px-8 py-4 text-lg font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
      >
        {status === 'loading' 
          ? (isEditing ? 'Updating...' : 'Submitting...') 
          : (isEditing ? 'Update Onboarding' : 'Submit Onboarding')
        }
      </button>

        {existingFileName && existingFileUrl && (
          <FilePreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            fileName={existingFileName}
            fileUrl={existingFileUrl}
          />
        )}
        </form>
      )}

      {/* Business Settings Tab */}
      {activeTab === 'business-settings' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveBusinessSettings(); }} className="p-8 space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Business Settings
          </h3>

          {/* Business Name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter your business name"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Business Description */}
          <div>
            <label htmlFor="businessDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Business Description
            </label>
            <textarea
              id="businessDescription"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your business..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Business Hours */}
          <div>
            <label htmlFor="businessHours" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Business Hours
            </label>
            <textarea
              id="businessHours"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="e.g., Monday - Friday: 9:00 AM - 5:00 PM&#10;Saturday: 10:00 AM - 3:00 PM&#10;Sunday: Closed"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Services */}
          <div>
            <label htmlFor="businessServices" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Services
            </label>
            <textarea
              id="businessServices"
              value={businessServices}
              onChange={(e) => setBusinessServices(e.target.value)}
              placeholder="Enter services separated by commas&#10;e.g., Dine-In, Takeaway, Home Delivery, Table Reservation"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              💡 Enter each service separated by a comma. For example: "Dine-In, Takeaway / Pickup, Home Delivery, Table Reservation"
            </p>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              Business Rules / Instructions
            </label>
            <div className="space-y-3">
              {businessRules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary dark:text-blue-400">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => {
                      const newRules = [...businessRules];
                      newRules[index] = e.target.value;
                      setBusinessRules(newRules);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={`Rule ${index + 1}`}
                  />
                  {businessRules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBusinessRules(businessRules.filter((_, i) => i !== index))}
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
              onClick={() => setBusinessRules([...businessRules, ''])}
              className="mt-4 px-4 py-2 text-primary border border-primary/20 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              + Add Rule
            </button>
          </div>

          {/* Voice Settings */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Voice Settings</h4>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="voiceLanguage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Language
                </label>
                <select
                  id="voiceLanguage"
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <label htmlFor="voiceGender" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Voice Gender
                </label>
                <select
                  id="voiceGender"
                  value={voiceGender}
                  onChange={(e) => setVoiceGender(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="voicePitch" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Pitch: <span className="font-semibold text-primary">{voicePitch.toFixed(1)}</span>
              </label>
              <input
                type="range"
                id="voicePitch"
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
              <label htmlFor="voiceSpeed" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Speaking Speed: <span className="font-semibold text-primary">{voiceSpeed.toFixed(1)}</span>
              </label>
              <input
                type="range"
                id="voiceSpeed"
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
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Widget Settings</h4>
            
            <div className="mb-4">
              <label htmlFor="widgetLogoUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                id="widgetLogoUrl"
                value={widgetLogoUrl}
                onChange={(e) => setWidgetLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="widgetThemeMode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Theme Mode
                </label>
                <select
                  id="widgetThemeMode"
                  value={widgetThemeMode}
                  onChange={(e) => setWidgetThemeMode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div>
                <label htmlFor="widgetPrimaryColor" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="widgetPrimaryColor"
                    value={widgetPrimaryColor}
                    onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={widgetPrimaryColor}
                    onChange={(e) => setWidgetPrimaryColor(e.target.value)}
                    placeholder="#0ea5e9"
                    className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Info */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Status & Information</h4>
            
            <div className="mb-4">
              <label htmlFor="businessStatus" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                id="businessStatus"
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Created At
                </label>
                <div className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                  {createdAt ? createdAt.toLocaleString() : 'Not yet created'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Updated At
                </label>
                <div className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
                  {updatedAt ? updatedAt.toLocaleString() : 'Not yet updated'}
                </div>
              </div>
            </div>
          </div>

          {status === 'error' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400">
                Something went wrong. Please try again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-8 py-4 text-lg font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
          >
            {status === 'loading' ? 'Saving...' : 'Save Business Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
