'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserPasswordResetButton({
  userId,
  mustChangePassword,
}: {
  userId: string;
  mustChangePassword: boolean;
}) {
  const [required, setRequired] = useState(mustChangePassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function update(payload: Record<string, unknown>) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update user.');
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError('Network error.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const password = window.prompt('Enter a new temporary password (at least 14 characters):');
    if (password === null) return;
    if (password.length < 14 || password.length > 200) {
      setError('Temporary password must be 14–200 characters.');
      return;
    }
    if (await update({ password })) setRequired(true);
  }

  async function toggle(checked: boolean) {
    if (await update({ mustChangePassword: checked })) setRequired(checked);
  }

  return (
    <div style={{ minWidth: 190 }}>
      <button type="button" className="btn" disabled={busy} onClick={reset}>
        Reset password
      </button>
      <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
        <input
          type="checkbox"
          checked={required}
          disabled={busy}
          onChange={e => toggle(e.target.checked)}
        />
        <span>Change password on next login</span>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
