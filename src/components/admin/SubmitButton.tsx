'use client';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending} 
      className={className || "bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50"}
    >
      {pending ? 'Saving...' : children}
    </button>
  );
}
