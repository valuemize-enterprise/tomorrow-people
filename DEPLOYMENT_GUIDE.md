# Tomorrow's People — Complete Beginner Deployment Guide

> **Who is this for?** Developers who are comfortable writing code but have
> not deployed a Next.js app with a database and AI before.
> Every step is explained in plain language with the exact commands to run.

---

## Before you start — what you'll need

You'll need accounts on these free services. Sign up before you begin:

| Service | What it does | Free tier |
|---------|-------------|-----------|
| [GitHub](https://github.com) | Stores your code | Free |
| [Vercel](https://vercel.com) | Runs your app on the internet | Free (Hobby plan) |
| [Supabase](https://supabase.com) | Your PostgreSQL database | 500 MB free |
| [Google Cloud](https://console.cloud.google.com) | Google sign-in | Free |
| [Anthropic Console](https://console.anthropic.com) | AI coaching (Claude) | Pay per use, ~$0.10/user/month |

---

## STEP 1 — Install tools on your computer

Open your terminal (Terminal on Mac, Command Prompt or PowerShell on Windows):

```bash
# Check if Node.js is installed (you need version 18 or higher)
node --version
# If you see "command not found", install Node.js from https://nodejs.org

# Check if Git is installed
git --version
# If you see "command not found", install Git from https://git-scm.com
```

---

## STEP 2 — Set up the project on your computer

```bash
# 1. Download the code
git clone https://github.com/YOUR_USERNAME/tomorrows-people.git
cd tomorrows-people

# 2. Install all the packages the app needs
npm install
# This takes 1-2 minutes. You'll see many packages being downloaded.

# 3. Copy the environment variables template
cp .env.example .env
```

Now open the file called `.env` in your code editor. You'll fill in the values
in the steps below.

---

## STEP 3 — Set up the database (Supabase)

Your database stores all the user data — habits, streaks, journal entries, etc.

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a name like "tomorrows-people" and set a strong password (save it!)
3. Choose a region closest to your users
4. Wait ~2 minutes for the database to start

Once it's ready:
1. In Supabase, click **Settings** (gear icon in left sidebar)
2. Click **Database**
3. Scroll down to **Connection string** → select **URI** tab
4. You'll see two connection strings:

**For `DATABASE_URL`** — find the "Transaction" mode pooler (port 6543):
```
postgresql://postgres.xxxx:Cerebre237@bre@aws-0-REGION.pooler.supabase.com:6543/postgres
```

**For `DIRECT_URL`** — the direct connection (port 5432):
```
postgresql://postgres.xxxx:Cerebre237@bre@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Paste these into your `.env` file.

### Create the database tables

```bash
# This creates all the tables in your database
npx prisma migrate dev --name init

# If asked "Do you want to reset...?" type: y

# Verify the tables were created
npx prisma studio
# Opens a browser tab where you can see your database
```

You should see these tables: users, accounts, sessions, habits, daily_logs,
streaks, daily_scores, journal_entries, coaching_messages.

---

## STEP 4 — Set up Google sign-in

Users will log in with their Google accounts. Here's how to enable that:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (click the dropdown at the top, then "New Project")
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose "External" → click Create
   - App name: "Tomorrow's People"
   - Add your email as the developer contact
   - Click Save
4. Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Under "Authorised redirect URIs", click **Add URI** and enter:
     `http://localhost:3000/api/auth/callback/google`
   - Click Create
5. Copy the **Client ID** and **Client Secret** into your `.env` file

---

## STEP 5 — Set up email (Resend)

Email is used to send "magic link" sign-in emails (no passwords needed).

1. Go to [resend.com](https://resend.com) → sign up
2. Go to **API Keys** → **Create API Key**
3. Name it "tomorrows-people" → copy the key (starts with `re_`)
4. Paste it into `.env` as `RESEND_API_KEY`
5. For `EMAIL_FROM`, use: `"Tomorrow's People <onboarding@resend.dev>"`
   (This is Resend's free test domain — no verification needed to start)

> **Later**, when you're ready to use your own domain:
> Go to Resend → Domains → Add Domain, follow the DNS setup instructions.

---

## STEP 6 — Set up the AI coach (Anthropic)

The AI coaching feature uses Claude. You pay per message (~$0.001 per response).

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up and add payment information (you only pay for what you use)
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`) into your `.env` as `ANTHROPIC_API_KEY`

> **Cost estimate**: With 100 active users, coaching costs roughly $10-15/month.

---

## STEP 7 — Generate secrets

These are random strings that keep your app secure:

```bash
# Generate AUTH_SECRET (NextAuth session encryption key)
npx auth secret
# Copy the output into your .env as AUTH_SECRET

# Generate CRON_SECRET (protects your scheduled jobs)
openssl rand -hex 32
# Copy the output into your .env as CRON_SECRET
# If openssl isn't available on Windows, use:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## STEP 8 — Test locally

```bash
# Start the app on your computer
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Check these things work:**
- [ ] The login page loads
- [ ] You can sign in with Google
- [ ] You can sign in with a magic link email
- [ ] You can create a habit
- [ ] You can log a habit as done
- [ ] The AI coach responds on the /coach page

If anything doesn't work, check the terminal — error messages appear there.

---

## STEP 9 — Push code to GitHub

```bash
# Set up git (if you haven't already)
git config --global user.email "you@example.com"
git config --global user.name "Your Name"

# Push your code to GitHub
git add .
git commit -m "Initial commit"
git push origin main
```

> **Important**: Never commit your `.env` file. It contains secrets.
> The `.gitignore` file already prevents this — don't change it.

---

## STEP 10 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → Log in with GitHub
2. Click **Add New** → **Project**
3. Find your `tomorrows-people` repository → click **Import**
4. On the configuration screen:
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `prisma generate && prisma migrate deploy && next build`
   - Output Directory: `.next` (auto-detected)
   - **Do not click Deploy yet**

5. Scroll down to **Environment Variables** and add every variable from your `.env`:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase Transaction pooler URL (port 6543) |
| `DIRECT_URL` | Your Supabase direct URL (port 5432) |
| `AUTH_SECRET` | The 32+ char string you generated |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` (you'll know this after first deploy) |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `RESEND_API_KEY` | Starts with `re_` |
| `EMAIL_FROM` | `"Tomorrow's People <onboarding@resend.dev>"` |
| `ANTHROPIC_API_KEY` | Starts with `sk-ant-` |
| `CRON_SECRET` | The 32+ char hex string you generated |

6. Click **Deploy** → wait 2-3 minutes

---

## STEP 11 — After first deploy

Your app is now live! But a few things need updating:

### Update NEXTAUTH_URL
1. Copy your Vercel URL (looks like `your-project.vercel.app`)
2. In Vercel: Settings → Environment Variables → click NEXTAUTH_URL → Edit
3. Change the value to `https://your-project.vercel.app`
4. Set Environment: **Production only** (not Preview, not Development)
5. Redeploy: Deployments → click the three dots → Redeploy

### Add your Vercel URL to Google OAuth
1. Go back to Google Cloud Console → Credentials → your OAuth client
2. Under "Authorised redirect URIs", click **Add URI**:
   ```
   https://your-project.vercel.app/api/auth/callback/google
   ```
3. Click Save (takes a few minutes to propagate)

### Verify the app works
```bash
# Test the health endpoint (replace with your URL)
curl https://your-project.vercel.app/healthz
# Should return: {"status":"ok","database":"connected"}

# Test that cron routes are protected
curl https://your-project.vercel.app/api/cron/midnight
# Should return: {"error":"Unauthorised"} with status 401
```

---

## STEP 12 — Set up scheduled jobs (cron)

The app needs two scheduled jobs:
- **Midnight** (daily): Recalculates streaks for all users
- **Saturday** (weekly): Runs the habit friction audit

Vercel automatically reads these from `vercel.json` (already configured).

To verify they're set up:
1. In Vercel: go to your project → **Settings** → **Cron Jobs**
2. You should see two jobs listed:
   - `/api/cron/midnight` — runs at 00:01 UTC daily
   - `/api/cron/weekly` — runs at 06:00 UTC on Saturdays

> **Note**: Cron jobs require the Vercel **Pro plan** ($20/month).
> On the free Hobby plan, you can trigger them manually or use a free
> service like [cron-job.org](https://cron-job.org) to call the endpoints.

---

## Common problems and solutions

### "The page shows an error about DATABASE_URL"
**Cause**: DATABASE_URL is missing or wrong.
**Fix**: Go to Vercel → Settings → Environment Variables and check DATABASE_URL. Make sure it uses port 6543 (not 5432) and includes your actual Supabase password.

### "Google sign-in shows an error"
**Cause**: The redirect URI isn't registered in Google Cloud.
**Fix**: Add `https://your-project.vercel.app/api/auth/callback/google` to the Authorised redirect URIs in Google Cloud Console.

### "Magic link email never arrives"
**Cause**: Resend isn't configured properly.
**Fix**: Check that RESEND_API_KEY is correct. If using a custom domain, verify DNS records in Resend → Domains.

### "The AI coach doesn't respond"
**Cause**: ANTHROPIC_API_KEY is missing or incorrect.
**Fix**: Check the key in Vercel environment variables. Make sure it starts with `sk-ant-`. Check you have credit in your Anthropic account.

### "Build fails with 'Module not found'"
**Cause**: Dependencies didn't install, or TypeScript paths aren't configured.
**Fix**:
1. Check `tsconfig.json` has `"paths": { "@/*": ["./*"] }`
2. Check the build command includes `prisma generate`
3. In Vercel, try clicking **Redeploy** → **Redeploy with existing build cache** unticked

### "Users get logged out immediately after signing in"
**Cause**: AUTH_SECRET is different between environments.
**Fix**: Make sure AUTH_SECRET has the same value in both your local `.env` and Vercel's environment variables.

---

## Going further (optional improvements)

Once your app is running, consider these upgrades:

### Faster database (recommended when you have 100+ users)
Enable Supabase's connection pooler or set up Prisma Accelerate:
```
# In .env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_KEY"
```

### Custom domain
1. Buy a domain (Namecheap, Google Domains, Cloudflare)
2. In Vercel: Settings → Domains → Add Domain
3. Follow the DNS instructions Vercel provides
4. Update NEXTAUTH_URL and Google OAuth redirect URI to your new domain

### Email with your own domain
1. In Resend: Domains → Add Domain → follow the DNS setup
2. Update EMAIL_FROM to `"Tomorrow's People <noreply@yourdomain.com>"`
3. Redeploy

### Monitoring (know when things break)
1. [UptimeRobot](https://uptimerobot.com) — free, pings your /healthz endpoint every 5 minutes
2. Vercel Analytics — already built in, enable in Project → Analytics

---

## Keeping the app updated

When you make changes to the code:

```bash
# 1. Make your changes
# 2. Test locally
npm run dev

# 3. Push to GitHub (Vercel auto-deploys)
git add .
git commit -m "Description of what you changed"
git push origin main
```

If you change the database schema (`prisma/schema.prisma`):

```bash
# Create a migration file
npx prisma migrate dev --name describe_your_change

# Push to GitHub — migrations run automatically during Vercel deploy
git add prisma/migrations
git commit -m "Add migration: describe_your_change"
git push origin main
```

---

## Your `.env` file should look like this when complete

```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@pooler.supabase.com:5432/postgres"

AUTH_SECRET="at-least-32-random-characters-here"
NEXTAUTH_URL="https://your-project.vercel.app"

GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"

RESEND_API_KEY="re_your_key_here"
EMAIL_FROM="Tomorrow's People <onboarding@resend.dev>"

ANTHROPIC_API_KEY="sk-ant-your-key-here"

CRON_SECRET="at-least-32-random-hex-characters"

NODE_ENV="development"
```

---

*Something still not working? Open an issue on GitHub with the error message
from your Vercel deployment logs (Project → Deployments → click a deploy → View Build Logs).*
