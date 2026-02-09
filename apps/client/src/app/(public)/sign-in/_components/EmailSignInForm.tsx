'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/components/ui/input';
import { authClient } from '@src/libs/auth/client';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { type EmailSignInSchema, emailSignInSchema } from './signInForm.schema';

type EmailSignInFormProps = {
  isLoading: boolean;
  showPassword: boolean;
  returnTo: string;
  onTogglePassword: () => void;
  onSetLoading: (value: boolean) => void;
  onSetError: (message: string | null) => void;
};

export const EmailSignInForm = memo<EmailSignInFormProps>(
  ({
    isLoading,
    showPassword,
    returnTo,
    onTogglePassword,
    onSetLoading,
    onSetError,
  }) => {
    const router = useRouter();

    const emailForm = useForm<EmailSignInSchema>({
      resolver: zodResolver(emailSignInSchema),
      defaultValues: {
        email: '',
        password: '',
        rememberMe: true,
      },
    });

    const onSubmitEmail = useCallback(
      async (values: EmailSignInSchema) => {
        onSetLoading(true);
        onSetError(null);
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe ?? true,
          callbackURL: returnTo,
        });
        if (error) {
          onSetError(error.message || 'Authentication failed');
          onSetLoading(false);
          return;
        }
        router.push(returnTo);
      },
      [onSetError, onSetLoading, returnTo, router]
    );

    return (
      <Form {...emailForm}>
        <form
          onSubmit={emailForm.handleSubmit(onSubmitEmail)}
          className="space-y-4"
        >
          <FormField
            control={emailForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <div className="relative">
                  <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="name@company.com"
                      className="pl-10"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={emailForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                </div>
                <div className="relative">
                  <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pr-10 pl-10"
                      {...field}
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Sign in with Email
          </Button>
        </form>
      </Form>
    );
  }
);

EmailSignInForm.displayName = 'EmailSignInForm';
