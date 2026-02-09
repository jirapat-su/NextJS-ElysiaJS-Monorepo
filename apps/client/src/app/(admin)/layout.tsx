import { AdminLayout } from '@src/components/layout/AdminLayout';
import { getSession } from '@src/libs/auth/session';
import { redirect } from 'next/navigation';

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/sign-in');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
