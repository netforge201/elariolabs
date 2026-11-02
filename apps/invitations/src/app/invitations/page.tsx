import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';

export default async function InvitationsPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');
  redirect('/dashboard');
}
