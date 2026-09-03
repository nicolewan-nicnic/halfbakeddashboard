# What changed & how to deploy

## The real reason icons looked wrong

The nine icons you uploaded were sitting in `icons/` on GitHub, but the app had **no reference to them** — the internal `ART` lookup table only listed the old `.webp` icons. So every recipe pointing at a new icon silently fell back to the croissant. On top of that, the boot code has a line that *overwrites* any icon it can't find in `ART` with a guess — so the new icons were being actively discarded on every page load. Both are now fixed: all new icons are registered in `ART`, so they display and are no longer clobbered.

---

## Icons: generic naming (as you asked)

Reusable icons now have generic names so they can be shared across recipes. Specific dish illustrations kept their own names.

### Add these 5 NEW files to `icons/`
| File | What it is | Reused by |
|------|-----------|-----------|
| `soft-eggs.png` | Jammy soft egg | Onsen Eggs **and** Mayak Eggs |
| `green-salad.png` | Garden salad | Pa Muchim |
| `brown-soup.png` | Generic brown soup bowl | Collagen Chicken Congee |
| `red-soup.png` | Generic red soup bowl | Gochujang Hummus |
| `beef-soup.png` | Beef & radish soup (specific) | *No recipe yet — spare, ready in the picker* |

### DELETE these 4 old files from `icons/` (renamed/wrong)
- `mayak-eggs.png`  → replaced by `soft-eggs.png`
- `onsen-eggs.png`  → was a soup image, not eggs; replaced by `soft-eggs.png`
- `pa-muchim.png`   → replaced by `green-salad.png`
- `gochujang-hummus.png` → replaced by `red-soup.png`

### KEEP these (already correct)
`banh-xeo.png`, `basque-cheesecake.png`, `kkaenip-jeon.png`, `pajeon.png`, `maeuntang.png`

> Filenames use hyphens (`brown-soup.png`) because spaces break in URLs — but they represent your "brown soup" / "red soup" names.

---

## Final recipe → icon map

| Recipe | Icon |
|--------|------|
| Basque Cheesecake | basque-cheesecake |
| Mayak Eggs | soft-eggs |
| Onsen Eggs | soft-eggs |
| Lazy Girl Maeuntang | maeuntang |
| Kkaenip Jeon | kkaenip-jeon |
| Collagen Chicken Congee | brown-soup |
| Gochujang Hummus | red-soup |
| Bánh Xèo | banh-xeo |
| Crispy Air Fryer Chicken Wings | friedchicken (unchanged) |
| Pa Muchim | green-salad |
| Green Onion Pancake (Pajeon) | pajeon |

Everything else (Red Curry, Nuoc Cham, Tomato Somen, Charred Cabbage, Carrot Salad, Steak, Chicken Rice, Vietnamese Coffee) is unchanged.

---

## Deploy steps

```bash
# 1. Add the 5 new generic icons
cp soft-eggs.png green-salad.png brown-soup.png red-soup.png beef-soup.png  your-repo/icons/

# 2. Remove the 4 renamed old ones
cd your-repo/icons
git rm mayak-eggs.png onsen-eggs.png pa-muchim.png gochujang-hummus.png

# 3. Drop in the updated app
cp /path/to/index.html your-repo/

# 4. Commit & push
git add icons/ index.html
git commit -m "Register new icons in ART, generic soup/salad/egg naming, faster startup"
git push
```

---

## Faster page load

Startup was making **11 database requests one after another** before drawing anything — that was the long blank pause. Two changes:

1. **Instant first paint** — the page now draws the recipe list from the built-in recipes the moment it opens, before any network call. Your saved edits merge in a fraction of a second later.
2. **Parallel loading** — those 11 requests now fire together instead of in a queue.

Net effect: the app appears immediately and fills in, rather than waiting on a chain of requests.

---

## Deliveroo "other shops" — updated diagnosis

Your screenshot shows all nine shop files **are** present in `data/`, so my earlier "missing files" guess was wrong — ignore it. Since the three main shops load fine individually, the loading mechanism itself works. That error only appears when *all nine* fail at once, which points at something else (e.g. a `vercel.json` rewrite catching `/data/` paths, or one malformed file breaking a shared step).

To pin it down I'd need one of:
- your `vercel.json`, or
- one of the shop JSON files (e.g. `co-op.json`) to check its structure, or
- the exact error text / a screenshot of the browser console (F12 → Console) when you hit "compare all shops".

Send any of those and I can fix it properly rather than guessing.
