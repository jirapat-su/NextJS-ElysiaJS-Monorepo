import { Loading } from '@src/components/ui/Loading';
import { Suspense } from 'react';
import { SignInForm } from './_components/SignInForm';

export default function SignInPage() {
  return (
    <Suspense
      fallback={<Loading text="Loading sign in..." className="min-h-[400px]" />}
    >
      <SignInForm />
    </Suspense>
  );
}
