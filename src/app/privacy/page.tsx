import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — CodeReview by Keynition',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-white">CodeReview by Keynition</Link>
        <Link href="/login" className="bg-[#00BFFF] text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0099CC] transition">
          Get started free
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-12">Last updated: May 6, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>GitHub account information (username, email, avatar) obtained via GitHub OAuth.</li>
              <li>Repository names and pull request diffs submitted for review.</li>
              <li>Usage data (number of reviews performed, plan type).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To provide and improve the Service.</li>
              <li>To process payments via Lemon Squeezy.</li>
              <li>To send transactional emails related to your account (onboarding, billing).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="text-[#00BFFF] font-medium">GitHub</span> — authentication</li>
              <li><span className="text-[#00BFFF] font-medium">Lemon Squeezy</span> — payment processing</li>
              <li><span className="text-[#00BFFF] font-medium">Anthropic</span> — AI analysis of code diffs</li>
              <li><span className="text-[#00BFFF] font-medium">Vercel</span> — hosting</li>
              <li><span className="text-[#00BFFF] font-medium">Neon</span> — database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Code Privacy</h2>
            <p>Pull request diffs are sent to Anthropic&apos;s Claude API for analysis. We do not store your code permanently. Anthropic&apos;s data usage policies apply: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#00BFFF] hover:underline">anthropic.com/privacy</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>Account data is retained while your account is active. You may request deletion by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
            <p>We use industry-standard security practices including encrypted connections (HTTPS) and secure credential storage.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Cookies</h2>
            <p>We use session cookies for authentication purposes only. No tracking or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>For privacy questions: <a href="mailto:keynitionautomate@gmail.com" className="text-[#00BFFF] hover:underline">keynitionautomate@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes</h2>
            <p>We may update this Privacy Policy. We will notify users of significant changes via email.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p className="mb-1">Don&apos;t think outside the box — <span className="text-[#00BFFF] font-semibold">unlock it.</span></p>
        <p>CodeReview by Keynition &copy; {new Date().getFullYear()} &middot; <Link href="/terms" className="hover:text-[#00BFFF] transition">Terms</Link> &middot; <Link href="/privacy" className="hover:text-[#00BFFF] transition">Privacy</Link></p>
      </footer>
    </main>
  );
}
