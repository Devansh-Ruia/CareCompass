/**
 * Zod schemas for form validation and type safety
 */

import { z } from 'zod';

// Base schemas
const nonEmptyString = z.string().min(1, 'This field is required');
const optionalString = z.string().optional();

// Question/Query validation
export const questionSchema = z.object({
  question: z.string()
    .min(3, 'Question must be at least 3 characters long')
    .max(1000, 'Question must be less than 1000 characters')
    .regex(/^[^<>{}[\]]+$/, 'Question contains invalid characters'),
  context: z.string().max(500, 'Context must be less than 500 characters').optional(),
});

// Family member validation
export const familyMemberSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  relationship: z.enum(['self', 'spouse', 'child', 'parent', 'other']),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid date (YYYY-MM-DD)')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      return !isNaN(parsed.getTime()) && parsed <= now && parsed >= minDate;
    }, 'Please enter a valid date of birth'),
});

// Insurance policy validation
export const insuranceInfoSchema = z.object({
  providerName: z.string()
    .min(1, 'Provider name is required')
    .max(100, 'Provider name must be less than 100 characters'),
  memberId: z.string()
    .min(1, 'Member ID is required')
    .max(50, 'Member ID must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-]+$/, 'Member ID can only contain letters, numbers, and hyphens'),
  groupNumber: z.string()
    .max(50, 'Group number must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-]*$/, 'Group number can only contain letters, numbers, and hyphens')
    .optional(),
  planType: z.enum(['HMO', 'PPO', 'POS', 'EPO', 'Other']),
});

// Medical bill validation
export const medicalBillSchema = z.object({
  providerName: z.string()
    .min(1, 'Provider name is required')
    .max(100, 'Provider name must be less than 100 characters'),
  serviceDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid service date (YYYY-MM-DD)'),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(999999.99, 'Amount seems too high'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  serviceCodes: z.array(z.string().max(20, 'Service code must be less than 20 characters'))
    .max(10, 'Maximum 10 service codes allowed')
    .optional(),
});

// Pre-visit checklist validation
export const preVisitRequestSchema = z.object({
  visitType: z.enum([
    'primary_care', 'specialist', 'emergency', 'urgent_care', 
    'surgery', 'imaging', 'lab_work'
  ]),
  providerInfo: z.object({
    name: z.string().min(1, 'Provider name is required').max(100),
    specialty: z.string().max(100).optional(),
    location: z.string().max(200).optional(),
  }).optional(),
  concerns: z.array(z.string().max(200, 'Concern must be less than 200 characters'))
    .max(10, 'Maximum 10 concerns allowed')
    .optional(),
});

// Appeal letter validation
export const appealRequestSchema = z.object({
  denialInfo: z.object({
    denialDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter a valid denial date (YYYY-MM-DD)'),
    denialReason: z.string()
      .min(1, 'Denial reason is required')
      .max(500, 'Denial reason must be less than 500 characters'),
    claimAmount: z.number()
      .min(0.01, 'Claim amount must be greater than 0')
      .max(999999.99, 'Claim amount seems too high'),
    serviceDescription: z.string()
      .min(1, 'Service description is required')
      .max(1000, 'Service description must be less than 1000 characters'),
  }),
  tone: z.enum(['professional', 'emphatic', 'detailed', 'concise']),
  additionalContext: z.string()
    .max(1000, 'Additional context must be less than 1000 characters')
    .optional(),
});

// Contact information validation
export const contactInfoSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long'),
  phone: z.string()
    .regex(/^[+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long'),
  preferredContact: z.enum(['email', 'phone', 'both']),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a file' })
    .refine((file) => file.size > 0, 'File cannot be empty')
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      (file) => ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(file.type),
      'Only PDF, PNG, and JPG files are allowed'
    ),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

// Search/query validation
export const searchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .regex(/^[^<>{}[\]]+$/, 'Search query contains invalid characters'),
  filters: z.record(z.string(), z.string()).optional(),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be less than 100')
    .default(10),
});

// Form validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: Record<string, string>;
} => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
};

// Type inference helpers
export type QuestionInput = z.infer<typeof questionSchema>;
export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;
export type InsuranceInfoInput = z.infer<typeof insuranceInfoSchema>;
export type MedicalBillInput = z.infer<typeof medicalBillSchema>;
export type PreVisitRequestInput = z.infer<typeof preVisitRequestSchema>;
export type AppealRequestInput = z.infer<typeof appealRequestSchema>;
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type SearchInput = z.infer<typeof searchSchema>;

// Common validation error messages
export const VALIDATION_ERRORS = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please enter a valid date',
  TOO_SHORT: 'This field is too short',
  TOO_LONG: 'This field is too long',
  INVALID_CHARS: 'This field contains invalid characters',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
} as const;
