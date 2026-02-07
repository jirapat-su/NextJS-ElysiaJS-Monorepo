import { z } from 'zod';

export const emailSignInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  rememberMe: z.boolean().optional(),
});

export type EmailSignInSchema = z.infer<typeof emailSignInSchema>;

export const usernameSignInSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters.')
    .max(30, 'Username must be 30 characters or less.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  rememberMe: z.boolean().optional(),
});

export type UsernameSignInSchema = z.infer<typeof usernameSignInSchema>;
