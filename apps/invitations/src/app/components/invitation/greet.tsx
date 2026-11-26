import type { ReactNode } from 'react';

/** Wraps the guest's own name inside a greeting/sentence in <strong>. */
export function boldName(text: string, name?: string | null): ReactNode {
  const n = name?.trim();
  const i = n ? text.indexOf(n) : -1;
  if (!n || i < 0) return text;
  // Keep the honorific with the name: "Mirzə bəy", "Amina xanım".
  const suffix = text.slice(i + n.length).match(/^ (bəy|xanım)/)?.[0] ?? '';
  const end = i + n.length + suffix.length;
  return <>{text.slice(0, i)}<strong className="inv-guest-name">{n}{suffix}</strong>{text.slice(end)}</>;
}
