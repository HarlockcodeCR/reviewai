'use client';

import { signOut } from 'next-auth/react';

export function UpgradeButton() {
  async function handleUpgrade() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }
  return (
    <button
      onClick={handleUpgrade}
      className="bg-white text-gray-900 text-sm px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition"
    >
      Upgrade to Pro
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="text-sm text-gray-400 hover:text-white transition"
    >
      Sign out
    </button>
  );
}
