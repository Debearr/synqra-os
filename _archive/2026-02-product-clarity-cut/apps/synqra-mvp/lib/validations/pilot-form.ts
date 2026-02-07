import { z } from 'zod';

/**
 * ============================================================
 * SYNQRA PILOT APPLICATION - VALIDATION SCHEMA
 * ============================================================
 * 7-field Zod schema for Founder Pilot applications
 */

export const pilotApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .trim(),
  
  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .trim(),
  
  companySize: z.enum([
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '500+',
  ], {
    message: 'Please select a company size',
  }),
  
  linkedinProfile: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .regex(/linkedin\.com/, 'Please enter a valid LinkedIn profile URL')
    .optional()
    .or(z.literal('')),
  
  whyPilot: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(1000, 'Please keep your response under 1000 characters')
    .trim(),
});

export type PilotApplicationData = z.infer<typeof pilotApplicationSchema>;
