'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDeleteButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function removeUser() {
    if (!window.confirm(`Delete administrator "${userName}"? This cannot be undone.`)) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || 'Could not delete this user.');
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn-danger"
        onClick={removeUser}
        disabled={busy}
      >
        {busy ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
