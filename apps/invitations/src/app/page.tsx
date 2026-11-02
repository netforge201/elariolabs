import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';

export default async function Home() {
  const account = await currentInvitationAccount();
  redirect(account ? '/dashboard' : '/login');
}
