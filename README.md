# Launch Planner — Go-To-Market Timeline & Budget

Turns a launch date, budget, and a handful of strategy questions (launch
type, audience, product count, team size, manufacturing status) into an
actual week-by-week launch timeline and a budget split — dates and dollar
amounts computed directly, with a short AI-written note on why each
milestone matters. Can also pick up market/category context carried over
from Market Entry Dossier via URL, so the two tools connect.

**Live:** https://launch-planner-two.vercel.app/

**Model:** Deterministic JavaScript for every date and dollar amount —
chosen so the numbers are 100% predictable and auditable, not something a
model could hallucinate — plus one small Gemini call used only to write
the short "why it matters" sentence under each milestone.

Built with AI-assisted development — I directed the strategy, content,
and architecture; AI executed the code under my review.

## Features
- Export milestones to your calendar (.ics)

---

## Part 1 — Get it running on your Mac

### Step 1: Install Node.js (if you haven't already)
Go to https://nodejs.org, download the **LTS** version, run the installer.

### Step 2: Get your free Gemini API key
1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click **Create API Key**
4. Copy the key that appears

No credit card, no payment info — this can be the same key already used
by Shelf Copy, since Vercel env vars are per-project and the key value
can be reused across projects.

### Step 3: Unzip the project and open Terminal there
1. Unzip this project (double-click the zip in Downloads)
2. Open **Terminal** (Cmd+Space, type "Terminal", Enter)
3. Type `cd ` (with a space after), then drag the unzipped `launch-planner`
   folder into the Terminal window, then press Enter
4. Double check you're in the right place — type `pwd` and press Enter.
   It should print the path ending in `/launch-planner`

### Step 4: Add your key
```
cp .env.example .env.local
open -a TextEdit .env.local
```
In the TextEdit window, replace `your-gemini-key-here` with your real key.
Save (Cmd+S) and close.

### Step 5: Start the app
```
npx vercel dev
```
First time, it'll ask a few questions — press Enter to accept each default.
Wait for a line like `Ready! Available at http://localhost:3000`.

### Step 6: Open it
In your browser, go to:
```
localhost:3000
```

---

## Part 2 — Make it a real link you can send to anyone

1. Create a free account at https://vercel.com
2. In Terminal, in the project folder, run:
   ```
   npx vercel
   ```
   Accept the defaults it suggests.
3. Add your key to the deployed version:
   ```
   npx vercel env add GEMINI_API_KEY
   ```
   Paste your key, choose "Production" (and the others if it asks).
4. Deploy for real:
   ```
   npx vercel --prod
   ```
5. You'll get a URL like `https://launch-planner-yourname.vercel.app`.

---

## If something goes wrong

Copy the exact red error text from Terminal and send it back — that's all
that's needed to figure out the fix. Don't try to guess-fix errors yourself.

---

## If you want to keep improving this later

Install Claude Code (`npm install -g @anthropic-ai/claude-code`), `cd` into
this folder, run `claude`, and just describe changes in plain English.

---

## What's in this folder
- `index.html` — the app itself (single-page, no build step): the form,
  the deterministic timeline/budget math, and the results UI
- `api/generate.js` — the backend piece that safely calls Gemini for the
  milestone explanations using your key (your key never reaches anyone's
  browser)
- `.env.example` — template for your key (copy to `.env.local`, never
  share the real one)
