'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/components/ui/input';
import { Separator } from '@repo/shadcn/components/ui/separator';
import { ThemeToggle } from '@src/components/ui/ThemeToggle';
import { authClient } from '@src/libs/authClient';
import {
  ArrowRight,
  Command,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { memo, useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type EmailSignInSchema,
  emailSignInSchema,
  type UsernameSignInSchema,
  usernameSignInSchema,
} from './signInForm.schema';

type AuthMode = 'email' | 'username';

export const SignInForm = memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = useMemo(() => {
    const value = searchParams.get('returnTo') ?? '/';
    return value.startsWith('/') ? value : '/';
  }, [searchParams]);

  const emailForm = useForm<EmailSignInSchema>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const usernameForm = useForm<UsernameSignInSchema>({
    resolver: zodResolver(usernameSignInSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmitEmail = useCallback(
    async (values: EmailSignInSchema) => {
      setIsLoading(true);
      setErrorMessage(null);
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe ?? true,
        callbackURL: returnTo,
      });
      if (error) {
        setErrorMessage(error.message || 'Authentication failed');
        setIsLoading(false);
      } else {
        router.push(returnTo);
      }
    },
    [returnTo, router]
  );

  const onSubmitUsername = useCallback(
    async (values: UsernameSignInSchema) => {
      setIsLoading(true);
      setErrorMessage(null);
      const { error } = await authClient.signIn.username({
        username: values.username,
        password: values.password,
      });
      if (error) {
        setErrorMessage(error.message || 'Authentication failed');
        setIsLoading(false);
      } else {
        router.push(returnTo);
      }
    },
    [returnTo, router]
  );

  const handleGuestAccess = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const { error } = await authClient.signIn.anonymous();
    if (error) {
      setErrorMessage(error.message || 'Guest access failed');
      setIsLoading(false);
    } else {
      router.push(returnTo);
    }
  }, [returnTo, router]);

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left Panel: Visual & Marketing */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden bg-zinc-900 p-8 text-white lg:w-1/2 lg:p-12">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-20%] h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Command className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            Monorepo Admin
          </span>
        </div>

        <div className="relative z-10 my-12 space-y-6">
          <h1 className="max-w-md font-semibold text-4xl leading-tight tracking-tight lg:text-5xl">
            Manage your workspace with confidence.
          </h1>
          <p className="max-w-sm text-lg text-zinc-400">
            Secure, scalable, and built for performance. Access your dashboard
            to monitor metrics and control user flows.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm backdrop-blur-sm">
              <LayoutDashboard className="h-4 w-4 text-blue-400" />
              <span>Real-time Analytics</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500">
          <p>© 2026 App Monorepo. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-300">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex w-full flex-col items-center justify-center bg-background p-4 lg:w-1/2 lg:p-12">
        <div className="absolute top-4 right-4 lg:top-8 lg:right-8">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-lg">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="font-bold text-2xl tracking-tight">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setAuthMode('email')}
                className={`flex items-center justify-center gap-2 rounded-md py-2.5 font-medium text-sm transition-all ${
                  authMode === 'email'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('username')}
                className={`flex items-center justify-center gap-2 rounded-md py-2.5 font-medium text-sm transition-all ${
                  authMode === 'username'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4" />
                Username
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-destructive text-sm">
                <ShieldCheck className="h-4 w-4" />
                {errorMessage}
              </div>
            )}

            {authMode === 'email' ? (
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
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="name@company.com"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
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
                          {/* <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Forgot?
                          </Link> */}
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10 pl-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
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
            ) : (
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
                        <FormControl>
                          <div className="relative">
                            <User className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="username"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
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
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pr-10 pl-10"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute top-2.5 right-3 text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
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
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue as
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full gap-2 border-dashed"
              onClick={handleGuestAccess}
              disabled={isLoading}
            >
              <span className="font-bold font-mono text-xs">GUEST</span>
              Visitor Access
              <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col justify-center gap-2 text-center text-muted-foreground text-xs">
            <p>
              By signing in, you agree to our{' '}
              <Link
                href="/terms-of-service"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
});

SignInForm.displayName = 'SignInForm';
