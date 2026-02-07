import type { Metadata } from 'next';
import { TermsOfService } from './_components/TermsOfService';

export const metadata: Metadata = {
  title: 'Terms of Service | App Monorepo',
  description: 'Terms of Service and Usage Guidelines for App Monorepo',
};

export default function TermsOfServicePage() {
  return <TermsOfService />;
}
