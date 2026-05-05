import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — CodeReview by Keynition',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-white">CodeReview by Keynition</Link>
        <Link href="/login" className="bg-[#00BFFF] text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0099CC] transition">
          Get started free
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-12">Last updated: May 6, 2026</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using CodeReview by Keynition ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>CodeReview by Keynition is an automated code review tool that analyzes GitHub pull requests using artificial intelligence and posts inline comments automatically.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account Registration</h2>
            <p>You must authenticate via GitHub OAuth to use the Service. You are responsible for maintaining the security of your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscription Plans</h2>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><span className="text-[#00BFFF] font-medium">Free Plan:</span> 20 automated reviews per month at no cost.</li>
              <li><span className="text-[#00BFFF] font-medium">Pro Plan:</span> 500 automated reviews per month at $99/month, billed monthly via Lemon Squeezy.</li>
              <li>Subscriptions renew automatically. You may cancel at any time from your account dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to use the Service to review code that violates applicable laws, infringes intellectual property rights, or contains malicious content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>The Service and its original content are the property of Keynition Automate. Code submitted for review remains your property.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>The Service is provided "as is." Keynition Automate is not liable for any damages arising from the use or inability to use the Service, including errors or omissions in AI-generated code reviews.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:keynitionautomate@gmail.com" className="text-[#00BFFF] hover:underline">keynitionautomate@gmail.com</a></p>
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
