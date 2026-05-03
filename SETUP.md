# CodeReview by Keynition Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL database (local or hosted — Railway, Neon, Supabase all work)
- GitHub OAuth App
- Anthropic API key
- LemonSqueezy account (for billing)

---

## 1. Install dependencies

```bash
cd reviewai
npm install
```

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`:

### GitHub OAuth App
1. Go to https://github.com/settings/developers → "New OAuth App"
2. **Homepage URL**: `http://localhost:3000`
3. **Callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and generate a Client Secret

### GitHub Webhook Secret
Pick any random string — this is used to verify incoming webhooks:
```bash
openssl rand -hex 32
```

### NextAuth Secret
```bash
openssl rand -base64 32
```

---

## 3. Set up the database

```bash
# Push schema to your database
npm run db:push

# Or use migrations (recommended for production)
npm run db:migrate
```

---

## 4. Run locally

```bash
npm run dev
```

For webhooks to reach your local machine, use:
```bash
# ngrok
ngrok http 3000
```

Update `NEXT_PUBLIC_APP_URL` in `.env.local` to your ngrok URL so GitHub can reach the webhook endpoint.

---

## 5. Deploy to Railway

1. Create a new Railway project
2. Add a PostgreSQL plugin
3. Deploy from GitHub (connect your repo)
4. Set all environment variables from `.env.example` in Railway's Variables tab
5. Set `NEXT_PUBLIC_APP_URL` to your Railway domain
6. Update your GitHub OAuth App callback URL to `https://your-domain.railway.app/api/auth/callback/github`
7. Update your GitHub OAuth App callback URL to `https://your-domain.railway.app/api/auth/callback/github`

---

## Architecture: Webhook → Review → Comment flow

```
GitHub PR opened
       ↓
POST /api/webhooks/github
  1. Verify HMAC-SHA256 signature
  2. Find connected repo in DB
  3. Check usage limits (free: 20/mo, pro: 500/mo)
  4. Create Review record (status=pending)
  5. Fire-and-forget: runReview()
  6. Return 200 immediately
       ↓
runReview() [async]
  1. Fetch PR diff via GitHub API
  2. Send diff + rules to Claude (claude-opus-4-7)
     - Tool use for structured JSON output
     - Prompt caching on system prompt
  3. Parse diff for inline comment positions
  4. Post GitHub Pull Request Review with inline comments
  5. Update Review record (status=completed)
```

### Production note on async reviews
For production, replace the fire-and-forget with a proper job queue:
- **Inngest** (easiest — serverless, no infra): wrap `runReview` in an Inngest function
- **BullMQ** + Redis: for self-hosted setups
- **Railway cron + DB polling**: simple but adds latency

The current fire-and-forget works fine on Railway (long-lived server) but will fail on Vercel (function timeout).

---

## Key files

| File | Purpose |
|------|---------|
| `src/app/api/webhooks/github/route.ts` | Receives GitHub PR events |
| `src/lib/github.ts` | `runReview()` pipeline + Octokit helpers |
| `src/lib/claude.ts` | Claude review via tool use + prompt caching |
| `src/lib/diff-parser.ts` | Maps line numbers to GitHub diff positions |
| `prisma/schema.prisma` | DB schema (User, Repo, Review, Subscription) |
