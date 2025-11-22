'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { pilotApplicationSchema, type PilotApplicationData } from '@/lib/validations/pilot-form';

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
 * Functionality:
 * - Client-side validation with Zod
 * - No Supabase/Stripe integration (Phase 2)
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
      // Validate form data with Zod
      const validatedData = pilotApplicationSchema.parse(formData);
      
      // Log to console for Phase 2 (no backend integration yet)
      console.log('[Pilot Application] Validated data:', validatedData);
      
      // Simulate brief processing delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to success page
      router.push('/pilot/apply/success');
      
    } catch (error: any) {
      if (error.errors) {
        // Parse Zod validation errors
        const fieldErrors: Partial<Record<keyof PilotApplicationData, string>> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0] as keyof PilotApplicationData;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto p-8 rounded-xl"
      style={{
        backgroundColor: 'rgba(245, 243, 240, 0.02)',
        border: '1px solid rgba(245, 243, 240, 0.08)',
      }}
    >
      <div className="space-y-6">
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Full Name <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            disabled={isSubmitting}
            placeholder="Sarah Chen"
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.fullName
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.fullName) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.fullName) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          {errors.fullName && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Email Address <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={isSubmitting}
            placeholder="sarah@company.com"
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.email
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.email) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.email) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          {errors.email && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.email}
            </p>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label
            htmlFor="companyName"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Company Name <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            disabled={isSubmitting}
            placeholder="Acme Inc."
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.companyName
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.companyName) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.companyName) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          {errors.companyName && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.companyName}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label
            htmlFor="role"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Your Role <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <input
            id="role"
            type="text"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={isSubmitting}
            placeholder="CEO & Co-Founder"
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.role
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.role) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.role) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          {errors.role && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.role}
            </p>
          )}
        </div>

        {/* Company Size */}
        <div>
          <label
            htmlFor="companySize"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Company Size <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <select
            id="companySize"
            value={formData.companySize || ''}
            onChange={(e) => handleInputChange('companySize', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.companySize
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: formData.companySize ? '#F5F3F0' : 'rgba(245, 243, 240, 0.5)',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.companySize) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.companySize) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          >
            <option value="">Select company size...</option>
            {COMPANY_SIZE_OPTIONS.map(option => (
              <option
                key={option.value}
                value={option.value}
                style={{ backgroundColor: '#0A0A0A', color: '#F5F3F0' }}
              >
                {option.label}
              </option>
            ))}
          </select>
          {errors.companySize && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.companySize}
            </p>
          )}
        </div>

        {/* LinkedIn Profile (Optional) */}
        <div>
          <label
            htmlFor="linkedinProfile"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            LinkedIn Profile{' '}
            <span style={{ color: 'rgba(245, 243, 240, 0.5)', fontWeight: 400 }}>
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
            className="w-full px-4 rounded-lg transition-all duration-200 focus:outline-none"
            style={{
              height: '56px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.linkedinProfile
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '150%',
            }}
            onFocus={(e) => {
              if (!errors.linkedinProfile) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.linkedinProfile) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          {errors.linkedinProfile && (
            <p className="mt-2" style={{ fontSize: '0.875rem', color: '#EF4444' }}>
              {errors.linkedinProfile}
            </p>
          )}
        </div>

        {/* Why Pilot */}
        <div>
          <label
            htmlFor="whyPilot"
            className="block mb-2"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#F5F3F0',
              letterSpacing: '0.01em',
            }}
          >
            Why do you want to join the Synqra Pilot?{' '}
            <span style={{ color: '#2DD4BF' }}>*</span>
          </label>
          <textarea
            id="whyPilot"
            value={formData.whyPilot}
            onChange={(e) => handleInputChange('whyPilot', e.target.value)}
            disabled={isSubmitting}
            placeholder="Tell us about your content challenges and what you hope to achieve with Synqra..."
            rows={5}
            className="w-full px-4 py-4 rounded-lg transition-all duration-200 focus:outline-none resize-none"
            style={{
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 243, 240, 0.04)',
              border: errors.whyPilot
                ? '2px solid rgba(239, 68, 68, 0.5)'
                : '1px solid rgba(245, 243, 240, 0.12)',
              color: '#F5F3F0',
              fontSize: '1rem',
              lineHeight: '160%',
            }}
            onFocus={(e) => {
              if (!errors.whyPilot) {
                e.target.style.border = '2px solid #2DD4BF';
              }
            }}
            onBlur={(e) => {
              if (!errors.whyPilot) {
                e.target.style.border = '1px solid rgba(245, 243, 240, 0.12)';
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <div>
              {errors.whyPilot && (
                <p style={{ fontSize: '0.875rem', color: '#EF4444' }}>
                  {errors.whyPilot}
                </p>
              )}
            </div>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'rgba(245, 243, 240, 0.4)',
              }}
            >
              {formData.whyPilot?.length || 0} / 1000 characters
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-98"
          style={{
            height: '56px',
            padding: '16px',
            backgroundColor: '#C5A572',
            color: '#0A0A0A',
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            borderRadius: '8px',
          }}
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
