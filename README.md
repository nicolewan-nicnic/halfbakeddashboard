# Half Baked Society — hosting on Vercel

Vercel no longer runs its own Postgres. You add a database from the Marketplace
instead; Neon is the direct successor and the smoothest fit. These steps use it.

## Repo layout

```
index.html        <- half-baked-recipes.html, renamed
package.json
schema.sql
api/
  kv.js
```

The HTML file sits at the root and is served as the site. Anything in `api/`
becomes a serverless function automatically. There is no build step.

## Steps

**1. Make the repo.** New repo on GitHub, drop the four files in, push.
Rename `half-baked-recipes.html` to `index.html` as you do it.

**2. Import to Vercel.** vercel.com → Add New → Project → pick the repo.
Framework preset: **Other**. Leave build and output settings empty. Deploy.
You now have a live URL serving the app on device storage.

**3. Add the database.** In the project → **Storage** → **Create Database** →
choose **Neon** from the Marketplace → follow the prompts. Vercel injects
`DATABASE_URL` into the project automatically.

**4. Create the table.** Open the database → **Open in Neon** → SQL Editor →
paste the contents of `schema.sql` → run.

**5. Turn server storage on.** In `index.html`, near the top of the script:

```js
const API_BASE = '';        // change to:
const API_BASE = '/api/kv';
```

Commit and push. Vercel redeploys on its own.

**6. Move your data across.** In the old copy of the app, click
**Download backup**. Open the deployed site, click **Restore from backup**,
pick that file. Done — the database is now the source of truth.

## Optional: keep it private

Anyone with the URL can read and write the data. Two ways to close that:

- **Vercel password protection** (Settings → Deployment Protection). Simplest,
  and it covers the API too. Paid feature on some plans.
- **`APP_TOKEN` env var.** The API will reject requests without a matching
  `Authorization: Bearer` header. Note that putting the token in a static HTML
  file makes it readable by anyone who views source, so this only deters
  casual pokers — it is not real security.

## Shipping a new version

Push a new `index.html`. New recipes appear; your edits, fridge, list, plan and
to-dos are untouched, because each lives in its own row and the app never
writes over a store it did not change.

Bump `APP_VERSION` in the file when you add recipes. It is recorded in
`hbs:meta` so you can see which build last ran.

## Costs

Neon has a free tier that comfortably covers a single-user recipe app. Vercel's
Hobby plan is free for personal, non-commercial projects.

## If something breaks

- **App loads but nothing saves** — check `DATABASE_URL` exists in Settings →
  Environment Variables, and that you ran `schema.sql`.
- **500 from `/api/kv`** — Vercel project → Logs. Usually the table is missing.
- **Blank page** — check `index.html` is at the repo root, not in a subfolder.
