'use client';
import { useActionState } from 'react';
import { loginAdmin } from './actions';
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { return await loginAdmin(formData); }, null);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" name="password" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <button type="submit" disabled={isPending} className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Signing in...' : 'Sign In'}</button>
    </form>
  );
}
