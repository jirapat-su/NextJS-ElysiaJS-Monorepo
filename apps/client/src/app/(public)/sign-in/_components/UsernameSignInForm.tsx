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
import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { memo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  type UsernameSignInSchema,
  usernameSignInSchema,
} from './signInForm.schema';

type UsernameSignInFormProps = {
  isLoading: boolean;
  showPassword: boolean;
  returnTo: string;
  onTogglePassword: () => void;
  onSetLoading: (value: boolean) => void;
  onSetError: (message: string | null) => void;
};

export const UsernameSignInForm = memo<UsernameSignInFormProps>(
  ({
    isLoading,
    showPassword,
    returnTo,
    onTogglePassword,
    onSetLoading,
    onSetError,
  }) => {
    const router = useRouter();

    const usernameForm = useForm<UsernameSignInSchema>({
      resolver: zodResolver(usernameSignInSchema),
      defaultValues: {
        username: '',
        password: '',
      },
    });

    const onSubmitUsername = useCallback(
      async (values: UsernameSignInSchema) => {
        onSetLoading(true);
        onSetError(null);
        const { error } = await authClient.signIn.username({
          username: values.username,
          password: values.password,
        });
        if (error) {
          onSetError(error.message || 'Authentication failed');
          onSetLoading(false);
          return;
        }
        router.push(returnTo as Route);
      },
      [onSetError, onSetLoading, returnTo, router]
    );

    return (
      <Form {...usernameForm}>
        <form
          onSubmit={usernameForm.handleSubmit(onSubmitUsername)}
          className="space-y-4"
        >
          <FormField
            control={usernameForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <div className="relative">
                  <User className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="username"
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
            control={usernameForm.control}
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
            Sign in with Username
          </Button>
        </form>
      </Form>
    );
  }
);

UsernameSignInForm.displayName = 'UsernameSignInForm';
