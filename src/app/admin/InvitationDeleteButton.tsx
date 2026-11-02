"use client";

import { useState } from "react";

export default function InvitationDeleteButton({
  accountId,
  email,
}: {
  accountId: string;
  email: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function removeAccount() {
    const confirmed = window.confirm(
      `Удалить аккаунт ${email}?\\n\\nВНИМАНИЕ: вместе с аккаунтом будут удалены свадебный сайт, список гостей и все сессии этого пользователя. Это действие необратимо.`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: accountId }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "Не удалось удалить аккаунт.");
        setLoading(false);
        return;
      }

      window.location.reload();
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn-danger"
        onClick={removeAccount}
        disabled={loading}
      >
        {loading ? "Удаление..." : "Удалить аккаунт"}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
