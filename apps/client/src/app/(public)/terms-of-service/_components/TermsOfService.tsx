'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/components/ui/card';
import { Separator } from '@repo/shadcn/components/ui/separator';
import { ThemeToggle } from '@src/components/ui/ThemeToggle';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  type FileText,
  Globe,
  Lock,
  Server,
  Shield,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';

type PolicySection = {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  bullets?: string[];
  gradient?: string;
  colSpan?: string;
};

const policySections: PolicySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    description:
      'By accessing App Monorepo, you agree to the policies described here and any updates posted in the future. We are committed to transparency in how we operate.',
    icon: Globe,
    colSpan: 'lg:col-span-2',
    gradient: 'from-blue-500/10 to-purple-500/10',
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    description: 'Use the platform only for approved business workflows.',
    icon: CheckCircle2,
    bullets: [
      'No bypass of access controls',
      'No credential sharing',
      'Report suspicious activity',
    ],
    colSpan: 'lg:col-span-1',
    gradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    id: 'data-protection',
    title: 'Data Protection',
    description:
      'We protect personal data and store it securely. Any data shared across services follows least-privilege access protocols to ensure maximum security.',
    icon: Lock,
    colSpan: 'lg:col-span-1',
  },
  {
    id: 'account-responsibility',
    title: 'Account Responsibility',
    description:
      'You are responsible for maintaining the confidentiality of your credentials and the actions taken under your account.',
    icon: User,
    colSpan: 'lg:col-span-1',
  },
  {
    id: 'service-availability',
    title: 'Service Availability',
    description:
      'We strive for high availability, but services are provided "as is" without guarantees of uninterrupted access.',
    icon: Server,
    colSpan: 'lg:col-span-1',
  },
  {
    id: 'contact',
    title: 'Contact & Support',
    description:
      'For questions or requests related to these terms, reach the compliance team immediately.',
    icon: AlertCircle,
    colSpan: 'lg:col-span-3',
    gradient: 'from-orange-500/10 to-red-500/10',
  },
];

export const TermsOfService = memo(() => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Abstract Background Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        {/* Header Navigation */}
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                Legal Center
              </p>
              <h2 className="font-bold text-xl tracking-tight">App Monorepo</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="group flex items-center gap-2 rounded-full border border-border bg-background/50 px-5 py-2.5 font-medium text-sm backdrop-blur-sm transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Sign In</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Hero Section */}
        <div className="mb-20 max-w-3xl">
          <h1 className="mb-6 font-extrabold text-5xl leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
            Terms of <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Service
            </span>
            .
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            Read our terms carefully. They govern your use of the platform and
            protect both you and us.
          </p>

          <div className="mt-8 flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Effective: Feb 07, 2026
            </span>
            <span>Version 3.0</span>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {policySections.map(section => (
            <PolicyCard key={section.id} section={section} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 border-border border-t pt-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <p className="text-muted-foreground text-sm">
              &copy; 2026 App Monorepo. All rights reserved.
            </p>
            <div className="flex gap-8 font-medium text-muted-foreground text-sm">
              <a href="#" className="transition-colors hover:text-foreground">
                Privacy Policy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Cookie Policy
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                Security
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
});

TermsOfService.displayName = 'TermsOfService';

type PolicyCardProps = {
  section: PolicySection;
};

const PolicyCard = memo(({ section }: PolicyCardProps) => {
  const Icon = section.icon;

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/5 hover:shadow-xl ${section.colSpan || ''} border-border/50 bg-background/60 backdrop-blur-sm`}
    >
      {/* Decorative Gradient Background */}
      {section.gradient && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-50 transition-opacity group-hover:opacity-100`}
        />
      )}

      <CardHeader className="relative z-10 pb-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="font-bold text-xl">{section.title}</CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <CardDescription className="text-base text-muted-foreground leading-relaxed transition-colors group-hover:text-foreground/80">
          {section.description}
        </CardDescription>

        {section.bullets && (
          <div className="pt-2">
            <Separator className="mb-4 bg-border/50" />
            <ul className="space-y-2">
              {section.bullets.map(bullet => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-muted-foreground text-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.id === 'contact' && (
          <div className="pt-4">
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center font-semibold text-primary text-sm hover:underline"
            >
              support@example.com
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
PolicyCard.displayName = 'PolicyCard';
