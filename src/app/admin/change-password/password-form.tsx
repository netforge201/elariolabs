'use client';

import { useState } from 'react';

export function AdminPasswordForm() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setError('');
    const currentPassword = String(formData.get('currentPassword') || '');
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (password.length < 14 || password.length > 200 || password !== confirmPassword) {
      setError('Choose matching passwords of at least 14 characters.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Password could not be changed.');
        setBusy(false);
        return;
      }
      window.location.href = '/admin/change-password?changed=1';
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form action={submit}>
      <label className="field">Temporary/current password
        <input type="password" name="currentPassword" autoComplete="current-password" required />
      </label>
      <label className="field">New password
        <input type="password" name="password" autoComplete="new-password" minLength={14} maxLength={200} required />
      </label>
      <label className="field">Confirm new password
        <input type="password" name="confirmPassword" autoComplete="new-password" minLength={14} maxLength={200} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy} style={{ width: '100%', marginTop: '1rem' }}>
        {busy ? 'Updating…' : 'Change password'}
      </button>
    </form>
  );
}
