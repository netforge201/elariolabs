import type { ReactNode } from 'react';

/** Wraps the guest's own name inside a greeting/sentence in <strong>. */
export function boldName(text: string, name?: string | null): ReactNode {
  const n = name?.trim();
  const i = n ? text.indexOf(n) : -1;
  if (!n || i < 0) return text;
  return <>{text.slice(0, i)}<strong className="inv-guest-name">{n}</strong>{text.slice(i + n.length)}</>;
}
