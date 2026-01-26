'use client';

import { useState, FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, Loader2, Sparkles, X } from 'lucide-react';
import { pilotApplicationSchema, type PilotApplicationData } from '@/lib/validations/pilot-form';
import { cn } from '@/lib/utils';

/**
 * ============================================================
 * PILOT APPLICATION FORM
 * ============================================================
 * UX Rules Applied:
 * - Hero kerning +75
 * - Body line-height 150–160%
 * - CTA height 48+ px, 16px padding, Satoshi Bold +25 tracking
 * - Form input height 56px, soft 8px radius
 * - Colors: matte black #0A0A0A, warm ivory #F5F3F0, gold accent #C5A572, teal highlight #2DD4BF
 * 
 * Functionality (Phase 3):
 * - Client-side validation with Zod
 * - API integration with /api/pilot/apply
 * - Supabase backend storage
 * - Email notifications (applicant + admin)
 * - Duplicate detection
 * - Success redirect to /pilot/apply/success
 */

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

export default function PilotApplicationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<PilotApplicationData>>({
    fullName: '',
    email: '',
    companyName: '',
    role: '',
    companySize: undefined,
    linkedinProfile: '',
    whyPilot: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PilotApplicationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- New Features State ---
  const [isDragActive, setIsDragActive] = useState(false);
  const [deckFile, setDeckFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulation of "AI Extraction"
  const handleDeckDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }

    if (file) {
      setDeckFile(file);
      setIsScanning(true);
      setScanProgress(0);
      setExtractedFields([]); // Clear previous extractions

      // Simulate scanning progress
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      // "Finish" scanning
      setTimeout(() => {
        setIsScanning(false);
        setFormData(prev => ({
          ...prev,
          fullName: "Alex Rivera",
          email: "alex.rivera@example.com",
          companyName: "Nexus AI",
          role: "Founder & CEO",
          companySize: "11-50",
          linkedinProfile: "linkedin.com/in/arivera-demo",
          whyPilot: "We are scaling our autonomous agents and need a robust OS to manage the fleet..."
        }));
        setExtractedFields(['fullName', 'email', 'companyName', 'role', 'companySize', 'linkedinProfile', 'whyPilot']);
      }, 2200);
    }
  };

  const handleInputChange = (field: keyof PilotApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate form data with Zod (client-side)
      const validatedData = pilotApplicationSchema.parse(formData);

      // Submit to API (Phase 3: Backend Integration)
      const response = await fetch('/api/pilot/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle API errors
        if (result.error === 'duplicate_application') {
          setErrors({
            email: 'You have already applied. Check your email for updates.',
          });
          return;
        }

        if (result.error === 'validation_failed' && result.details) {
          // Map server validation errors to form fields
          const fieldErrors: Partial<Record<keyof PilotApplicationData, string>> = {};
          result.details.forEach((err: any) => {
            const field = err.path[0] as keyof PilotApplicationData;
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }

        throw new Error(result.message || 'Failed to submit application');
      }

      // Success - redirect to success page
      console.log('[Pilot Application] Submitted successfully:', result.data.id);
      router.push('/pilot/apply/success');

    } catch (error: any) {
      console.error('[Pilot Application] Submit error:', error);

      if (error.errors) {
        // Parse Zod validation errors (client-side)
        const fieldErrors: Partial<Record<keyof PilotApplicationData, string>> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof PilotApplicationData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        // Generic error - show on email field
        setErrors({
          email: error.message || 'Failed to submit application. Please try again.',
        });
      }

      setIsSubmitting(false);
    }
  };

  // Icon Wrappers for strict type compatibility
  const UploadIcon = Upload as React.ElementType;
  const FileTextIcon = FileText as React.ElementType;
  const CheckCircleIcon = CheckCircle as React.ElementType;
  const Loader2Icon = Loader2 as React.ElementType;
  const SparklesIcon = Sparkles as React.ElementType;
  const XIcon = X as React.ElementType;

  const inputClasses = (hasError: boolean, fieldName?: string) => cn(
    "w-full h-14 px-4 rounded-lg bg-white/[0.04] border text-brand-fg placeholder:text-brand-gray/50 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-brand-gold/50 focus:border-brand-gold/50 hover:bg-white/[0.06]",
    hasError ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10",
    fieldName && extractedFields.includes(fieldName) && "animate-pulse-gold border-brand-gold/30 bg-brand-gold/[0.02]"
  );

  const labelClasses = "block mb-2 text-xs font-bold uppercase tracking-widest text-brand-gray/80";

  // Confidence Cue Component
  const ConfidenceCue = ({ visible }: { visible: boolean }) => (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute right-4 top-10 pointer-events-none"
        >
          <CheckCircleIcon className="text-brand-gold w-5 h-5 drop-shadow-[0_0_8px_rgba(197,165,114,0.5)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto p-8 rounded-xl glass-panel"
    >
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="relative mb-8 p-6 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center transition-all duration-300"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }}
          onDrop={handleDeckDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleDeckDrop}
            accept=".pdf,.ppt,.pptx"
          />
          {deckFile ? (
            <div className="flex flex-col items-center justify-center">
              <FileTextIcon className="w-10 h-10 text-brand-gold mb-3" />
              <p className="text-lg font-semibold text-brand-fg">{deckFile.name}</p>
              <p className="text-sm text-brand-gray/70 mb-4">
                {(deckFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {isScanning ? (
                <div className="w-full max-w-xs bg-white/10 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-brand-gold h-2.5 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                  <p className="text-xs text-brand-gray/70 mt-2 flex items-center justify-center gap-2">
                    <Loader2Icon className="animate-spin w-4 h-4" /> Scanning for details...
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-brand-gold drop-shadow-[0_0_8px_rgba(197,165,114,0.5)]">
                  <SparklesIcon className="w-5 h-5" />
                  <span className="font-medium">Details Extracted!</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setDeckFile(null); setExtractedFields([]); setScanProgress(0); }}
                className="absolute top-3 right-3 text-brand-gray/50 hover:text-brand-fg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4">
              <UploadIcon className="w-10 h-10 text-brand-gray/50 mb-3" />
              <p className="text-lg font-semibold text-brand-fg mb-1">
                Drag & drop your pitch deck
              </p>
              <p className="text-sm text-brand-gray/70 mb-3">
                or click to upload (PDF, PPTX)
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-brand-gold text-brand-bg text-sm font-medium hover:bg-brand-gold/90 transition-colors"
              >
                Browse Files
              </button>
            </div>
          )}
        </div>

        {/* Full Name */}
        <div className="relative">
          <label htmlFor="fullName" className={labelClasses}>
            Full Name <span className="text-[#2DD4BF]">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            disabled={isSubmitting}
            placeholder="Sarah Chen"
            className={inputClasses(!!errors.fullName, 'fullName')}
          />
          <ConfidenceCue visible={extractedFields.includes('fullName')} />
          {errors.fullName && (
            <p className="mt-2 text-xs text-red-500">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="relative">
          <label htmlFor="email" className={labelClasses}>
            Email Address <span className="text-[#2DD4BF]">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={isSubmitting}
            placeholder="sarah@company.com"
            className={inputClasses(!!errors.email, 'email')}
          />
          <ConfidenceCue visible={extractedFields.includes('email')} />
          {errors.email && (
            <p className="mt-2 text-xs text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div className="relative">
          <label htmlFor="companyName" className={labelClasses}>
            Company Name <span className="text-[#2DD4BF]">*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            disabled={isSubmitting}
            placeholder="Acme Inc."
            className={inputClasses(!!errors.companyName, 'companyName')}
          />
          <ConfidenceCue visible={extractedFields.includes('companyName')} />
          {errors.companyName && (
            <p className="mt-2 text-xs text-red-500">
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="relative">
          <label htmlFor="role" className={labelClasses}>
            Your Role <span className="text-[#2DD4BF]">*</span>
          </label>
          <input
            id="role"
            type="text"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={isSubmitting}
            placeholder="CEO & Co-Founder"
            className={inputClasses(!!errors.role, 'role')}
          />
          <ConfidenceCue visible={extractedFields.includes('role')} />
          {errors.role && (
            <p className="mt-2 text-xs text-red-500">
              {errors.role}
            </p>
          )}
        </div>

        {/* Company Size */}
        <div className="relative">
          <label htmlFor="companySize" className={labelClasses}>
            Company Size <span className="text-[#2DD4BF]">*</span>
          </label>
          <select
            id="companySize"
            value={formData.companySize || ''}
            onChange={(e) => handleInputChange('companySize', e.target.value)}
            disabled={isSubmitting}
            className={cn(inputClasses(!!errors.companySize, 'companySize'), !formData.companySize && "text-brand-gray/50")}
            style={{
              // Override default select arrow color for consistency
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23F5F3F0' opacity='0.5'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            <option value="" disabled>Select company size...</option>
            {COMPANY_SIZE_OPTIONS.map(option => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[#0A0A0A] text-[#F5F3F0]"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ConfidenceCue visible={extractedFields.includes('companySize')} />
          {errors.companySize && (
            <p className="mt-2 text-xs text-red-500">
              {errors.companySize}
            </p>
          )}
        </div>

        {/* LinkedIn Profile (Optional) */}
        <div className="relative">
          <label htmlFor="linkedinProfile" className={labelClasses}>
            LinkedIn Profile{' '}
            <span className="text-brand-gray/50 font-normal">
              (optional)
            </span>
          </label>
          <input
            id="linkedinProfile"
            type="url"
            value={formData.linkedinProfile}
            onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
            disabled={isSubmitting}
            placeholder="https://linkedin.com/in/yourprofile"
            className={inputClasses(!!errors.linkedinProfile, 'linkedinProfile')}
          />
          <ConfidenceCue visible={extractedFields.includes('linkedinProfile')} />
          {errors.linkedinProfile && (
            <p className="mt-2 text-xs text-red-500">
              {errors.linkedinProfile}
            </p>
          )}
        </div>

        {/* Why Pilot */}
        <div className="relative">
          <label htmlFor="whyPilot" className={labelClasses}>
            Why do you want to join the Synqra Pilot?{' '}
            <span className="text-[#2DD4BF]">*</span>
          </label>
          <textarea
            id="whyPilot"
            value={formData.whyPilot}
            onChange={(e) => handleInputChange('whyPilot', e.target.value)}
            disabled={isSubmitting}
            placeholder="Tell us about your content challenges and what you hope to achieve with Synqra..."
            rows={5}
            className={cn(
              "w-full p-4 rounded-lg bg-white/[0.04] border text-brand-fg placeholder:text-brand-gray/50 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-brand-gold/50 focus:border-brand-gold/50 hover:bg-white/[0.06] resize-none",
              errors.whyPilot ? "border-red-500/50 focus:ring-red-500/50" : "border-white/10",
              extractedFields.includes('whyPilot') && "animate-pulse-gold border-brand-gold/30 bg-brand-gold/[0.02]"
            )}
          />
          <ConfidenceCue visible={!!formData.whyPilot && !errors.whyPilot} />
          <div className="mt-2 flex items-center justify-between">
            <div>
              {errors.whyPilot && (
                <p className="text-xs text-[#EF4444]">
                  {errors.whyPilot}
                </p>
              )}
            </div>
            <p
              className="text-xs text-[#F5F3F0]/40"
            >
              {formData.whyPilot?.length || 0} / 1000 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-98 h-14 p-4 bg-[#C5A572] text-[#0A0A0A] text-sm font-bold tracking-wide uppercase"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Apply for Founder Pilot'
          )}
        </button>
      </div>
    </motion.form>
  );
}
