import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CodeReview by Keynition — Automated Code Reviews',
  description: 'Automated code reviews for GitHub pull requests, powered by Keynition Automate',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0e1a] text-gray-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
