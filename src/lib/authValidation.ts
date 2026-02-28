import { z } from 'zod';

// Sanitize function to remove potentially dangerous characters
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>'"`;]/g, '') // Remove common XSS characters
    .slice(0, 500); // Limit length
};

// Email validation schema
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email is too long')
  .transform((val) => val.toLowerCase());

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .refine((val) => /\d/.test(val), 'Password must contain at least one number')
  .refine(
    (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
    'Password must contain at least one special character (!@#$%^&*...)'
  );

// Username validation schema
export const usernameSchema = z
  .string()
  .trim()
  .min(2, 'Username must be at least 2 characters')
  .max(50, 'Username is too long')
  .regex(/^[a-zA-Z0-9_\s]+$/, 'Username can only contain letters, numbers, underscores, and spaces')
  .transform(sanitizeInput);

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Signup form schema
export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  country: z.string().min(1, 'Country is required').max(100),
  ageGroup: z.string().min(1, 'Age group is required'),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Validation helper functions
export const validateLoginForm = (data: { email: string; password: string }) => {
  return loginSchema.safeParse(data);
};

export const validateSignupForm = (data: {
  username: string;
  email: string;
  password: string;
  country: string;
  ageGroup: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}) => {
  return signupSchema.safeParse(data);
};

// Get validation errors as a simple object
export const getValidationErrors = (
  result: ReturnType<typeof loginSchema.safeParse> | ReturnType<typeof signupSchema.safeParse>
): Record<string, string> => {
  if (result.success) return {};
  
  const errors: Record<string, string> = {};
  for (const error of (result.error as any).errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  return errors;
};
