import { z } from 'zod';

/**
 * Common validation schemas for enterprise-grade input validation
 */

// Base schemas
export const emailSchema = z
  .string()
  .trim()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

export const usernameSchema = z
  .string()
  .trim()
  .min(3, { message: 'Username must be at least 3 characters' })
  .max(50, { message: 'Username must be less than 50 characters' })
  .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(100, { message: 'Password must be less than 100 characters' });

export const positiveNumberSchema = z
  .number()
  .positive({ message: 'Must be a positive number' });

export const uuidSchema = z
  .string()
  .uuid({ message: 'Invalid ID format' });

export const telegramIdSchema = z
  .number()
  .int()
  .positive({ message: 'Invalid Telegram ID' });

// Payment schemas
export const paymentAmountSchema = z
  .number()
  .positive({ message: 'Amount must be positive' })
  .max(1000000, { message: 'Amount exceeds maximum limit' });

export const tonAddressSchema = z
  .string()
  .trim()
  .min(48, { message: 'Invalid TON address' })
  .max(67, { message: 'Invalid TON address' });

export const txHashSchema = z
  .string()
  .trim()
  .min(64, { message: 'Invalid transaction hash' })
  .max(128, { message: 'Invalid transaction hash' });

// Form schemas
export const paymentFormSchema = z.object({
  amount: paymentAmountSchema,
  description: z.string().max(500).optional(),
  productType: z.enum(['server', 'upgrade', 'tokens', 'vip', 'general']),
  productId: z.string().optional(),
});

export const referralCodeSchema = z
  .string()
  .trim()
  .min(1, { message: 'Referral code is required' })
  .max(100, { message: 'Referral code is too long' });

export const dailyCodeSchema = z
  .string()
  .trim()
  .length(4, { message: 'Code must be 4 characters' })
  .regex(/^[A-Z0-9]+$/, { message: 'Code must be uppercase letters and numbers only' });

export const dailyCodesFormSchema = z.object({
  code1: dailyCodeSchema,
  code2: dailyCodeSchema,
  code3: dailyCodeSchema,
  code4: dailyCodeSchema,
});

// Mining schemas
export const miningSessionSchema = z.object({
  userId: uuidSchema,
  tokensPerHour: positiveNumberSchema,
  miningPower: positiveNumberSchema,
  durationHours: z.number().min(1).max(24),
});

// Server purchase schema
export const serverPurchaseSchema = z.object({
  serverId: z.string().min(1),
  serverName: z.string().min(1).max(100),
  serverTier: z.enum(['standard', 'premium', 'elite', 'legendary']),
  priceTon: paymentAmountSchema,
});

// Task schemas
export const taskCompletionSchema = z.object({
  taskId: uuidSchema,
  userId: uuidSchema,
});

// Utility functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

// Sanitization utilities
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 10000); // Limit length
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
