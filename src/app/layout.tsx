import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'ReviewAI — Automated Code Reviews',
  description: 'AI-powered code reviews for GitHub pull requests',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
