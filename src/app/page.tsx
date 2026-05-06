import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-white">CodeReview by Keynition</span>
        <Link
          href="/login"
          className="bg-[#00BFFF] text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0099CC] transition"
        >
          Get started free
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Powered by Claude
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl">
          AI code reviews. Flat rate. No per-seat math.
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-xl">
          CodeReview connects to your GitHub repos and posts AI-generated reviews on every PR — automatically. One price for your whole team, not per developer.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="bg-[#00BFFF] text-gray-900 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[#0099CC] transition"
          >
            Connect GitHub — it&apos;s free
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-700 text-gray-300 px-8 py-3 rounded-lg font-semibold text-lg hover:border-gray-500 transition"
          >
            How it works
          </a>
        </div>

        <p className="mt-4 text-sm text-gray-500">20 free reviews/month. No credit card needed.</p>
      </section>

      {/* Demo video */}
      <section className="border-t border-gray-800 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">See it in action</h2>
          <p className="text-gray-400 mb-10">Watch how CodeReview automatically analyzes a pull request and posts inline comments.</p>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full rounded-xl"
              src="https://www.youtube.com/embed/27yuZpLgwBU"
              title="CodeReview by Keynition demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-800 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-14">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Connect your repo',
                body: 'Sign in with GitHub and select which repos to enable. CodeReview installs a webhook automatically.',
              },
              {
                step: '02',
                title: 'Open a pull request',
                body: 'Whenever a PR is opened or updated, CodeReview fetches the diff and sends it to Claude for analysis.',
              },
              {
                step: '03',
                title: 'Get inline comments',
                body: 'Findings are posted as a GitHub review with inline comments pinned to the exact lines with issues.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-4xl font-black text-gray-700">{step}</span>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-gray-800 py-20 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Simple pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-left">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="text-4xl font-black text-white mt-2">$0</p>
              <ul className="mt-6 space-y-3 text-gray-300 text-sm">
                <li>20 reviews / month</li>
                <li>All issue categories</li>
                <li>Inline GitHub comments</li>
              </ul>
              <Link href="/login" className="mt-8 block text-center border border-gray-600 py-2.5 rounded-lg hover:border-gray-400 transition text-sm font-semibold">
                Get started
              </Link>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-left">
              <h3 className="text-lg font-semibold text-white">Solo</h3>
              <p className="text-4xl font-black text-white mt-2">$19<span className="text-xl font-normal text-gray-500">/mo</span></p>
              <ul className="mt-6 space-y-3 text-gray-300 text-sm">
                <li>1 repo</li>
                <li>Unlimited reviews</li>
                <li>All issue categories</li>
                <li>Inline GitHub comments</li>
              </ul>
              <Link href="/login" className="mt-8 block text-center border border-gray-600 py-2.5 rounded-lg hover:border-gray-400 transition text-sm font-semibold">
                Get started
              </Link>
            </div>
            <div className="bg-white text-gray-900 rounded-2xl p-8 text-left relative">
              <span className="absolute top-4 right-4 bg-gray-900 text-white text-xs px-2 py-1 rounded-full">Popular</span>
              <h3 className="text-lg font-semibold">Team</h3>
              <p className="text-4xl font-black mt-2">$39<span className="text-xl font-normal text-gray-500">/mo</span></p>
              <ul className="mt-6 space-y-3 text-gray-700 text-sm">
                <li>Unlimited reviews</li>
                <li>All issue categories</li>
                <li>Configurable rules per repo</li>
                <li>Priority support</li>
              </ul>
              <Link href="/login" className="mt-8 block text-center bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 transition text-sm font-semibold">
                Start free trial
              </Link>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500">A 3-person team pays $72–90/mo on CodeRabbit. Here it&apos;s $39 flat.</p>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p className="mb-1">Don&apos;t think outside the box — <span className="text-[#00BFFF] font-semibold">unlock it.</span></p>
        <p>CodeReview by Keynition &copy; {new Date().getFullYear()} &middot; <Link href="/terms" className="hover:text-[#00BFFF] transition">Terms</Link> &middot; <Link href="/privacy" className="hover:text-[#00BFFF] transition">Privacy</Link></p>
      </footer>
    </main>
  );
}
