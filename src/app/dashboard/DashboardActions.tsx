'use client';

import { signOut } from 'next-auth/react';

export function UpgradeButton() {
  return (
    <a
      href="https://keynition-reviewai.lemonsqueezy.com/checkout/buy/021355de-0e98-4a5a-9e0c-46c581efa116"
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#00BFFF] text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0099CC] transition"
    >
      Upgrade to Pro
    </a>
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
