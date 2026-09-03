# Reprocessed icons — transparent and tightly cropped

## What was wrong

Two separate problems with the files, both in the images rather than the code:

**1. Baked-in backgrounds.** Each ChatGPT export had a solid cream background painted into the image — and crucially, a slightly *different* cream each time (rgb 243–249 across the set). Your page is a single ivory, so every icon showed as a faintly mismatched square. Your original `.webp` icons are transparent, which is why they sit cleanly.

**2. Far too much empty space.** The subject occupied as little as **13.5%** of the canvas on some files — around 86% was padding. Since the app scales the whole image to fit the thumbnail slot, that padding got scaled too, leaving a tiny drawing in a large box.

| Icon | Subject filled (before) | After |
|---|---|---|
| soft-eggs | 13.5% | 56% |
| brown-soup / red-soup | 13.6% | 68% |
| pajeon | 19.6% | 70% |
| green-salad | 23.5% | 56% |
| beef-soup | 26.7% | 75% |
| maeuntang | 28.8% | 84% |
| basque-cheesecake | 29.6% | 50% |
| banh-xeo | 35.5% | 60% |
| kkaenip-jeon | 35.8% | 62% |

## What I did

- **Removed the background to true transparency**, sampling the actual background colour per file rather than assuming one value.
- **Feathered the edge** over a narrow range instead of a hard cutoff. A hard threshold leaves a jagged halo on hand-drawn linework; feathering keeps the wobbly pen edges looking drawn rather than cut out.
- **Cropped to the artwork** and re-centred on a square transparent canvas with a slim 4% margin — so every icon scales consistently and none looks bigger or smaller than its neighbours.
- Verified corner pixels are fully transparent (alpha 0) on all ten, and composited them against your ivory to confirm no halos or edge fringing.

All ten are 512×512 PNG with alpha.

## Deploy

Replace all ten files in `icons/` — including the five you already uploaded, since those had the same background and padding issues:

```bash
cp *.png your-repo/icons/
git add icons/
git commit -m "Reprocess icons: transparent background, tight crop"
git push
```

No code change needed — `index.html` is unchanged from the last version, and the filenames are identical, so the mapping still holds. You will likely need a hard refresh (Cmd/Ctrl-Shift-R) since the browser caches images by filename.

## One note on the grid

In your screenshot **Nuoc Cham** shows the `jar` icon (the mug) and **Vietnamese Coffee** shows `icedcoffee` — both are original `.webp` icons working as intended, not errors. If the jar reads oddly as a mug at thumbnail size, a dedicated sauce-bottle icon would be a nice future addition, but nothing is broken.
