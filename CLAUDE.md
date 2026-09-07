# Half Baked Society — recipe app

Single-page recipe, fridge, meal-plan and grocery-shopping app. Deployed on Vercel.

## Layout

```
index.html    the entire app — markup, CSS and JS in one file (~2,800 lines)
api/kv.js     key-value store backing /api/kv
data/         nine Deliveroo shop price lists (JSON) + boots_borehamwood_products.csv
icons/        recipe icons — .webp (originals) and .png (newer)
schema.sql
```

Everything lives in `index.html`. There is no build step. Editing it is the whole job.

## Running it

Open `index.html` directly and it runs against local storage. For the API and the
shop price lists you need it served — `python3 -m http.server` from the repo root,
or `vercel dev`.

**Please actually open it in a browser after changing it.** Most of the bugs in this
file's history were things a single page-load would have caught immediately.

---

## Architecture

### Data model
Three layers merge in `rebuild()`:
1. `seed()` — recipes shipped in the code
2. `overrides` — only the fields the user changed on a seed recipe
3. `mine` — recipes the user created

**An override beats the seed.** That is deliberate (app updates must not wipe edits),
but it means a bad value written once keeps winning until it is explicitly cleared.
There is a self-heal for icons in `init()` that does exactly that.

### Storage
`sget` / `sset` wrap `/api/kv`, falling back to local storage when the API is down.
Keys are in the `S` object. `sset` is the single choke point for every write.

### Rendering
`render()` dispatches on `mode`. Each section has its own `renderX()`. Handlers are
re-bound on every render — there is no framework.

---

## Gotchas that have already caused bugs

Each of these cost real debugging time. They are not hypothetical.

**Verify `seed()` by executing it, never by pattern-matching.**
Counting `{id:'` with a regex counts nested objects too. That reported "21 recipes"
while two of them were actually buried inside another recipe's `calc.options`. To check:

```js
const m = html.match(/function seed\(\)\{return \[([\s\S]*?)\n\];\}/);
const arr = new Function('return [' + m[1] + '\n];')();
console.log(arr.length, arr.map(r => r.id));
```

**Every icon must be in the `ART` map.**
`art()` falls back to `guessIcon()` for any icon name not in `ART`, and `init()`
*overwrites* unknown icon names with the guess. So an icon file that exists on disk
but is missing from `ART` doesn't render as a broken image — it silently becomes a
croissant. Add the icon to `ART` and to `ICONS` (the editor picker) together.

**`calc` must be `null`, never `[]`.**
An empty array is truthy, so a recipe with `calc:[]` enters the batch-calculator path,
throws, and — because handler binding happens after — kills every tickbox on the page.
`wireCalc` and `calcHTML` now guard on shape, but don't reintroduce the pattern.

**Bind critical handlers before optional ones.**
Ticks are bound before `wireCalc`, which is wrapped in try/catch. Keep it that way:
anything that throws mid-render silently disables everything bound after it.

**`ticked` is keyed by ingredient index and is memory-only.**
Cleared when a recipe opens; does not survive a refresh. If the visible ingredient
rows change (the variant toggle), clear it or ticks land on the wrong lines.

**Recipe ingredients can have an `opt` key.**
Used for either/or groups (Basque cheesecake: hojicha vs black sesame praline). Rows
tagged with `opt` only show when that option is selected, and the selection is shared
with the batch calculator via `anchorOpt`. Quantities in the ingredient list and in
`calc.options` must agree — they were out of sync before and nobody noticed.

**Boots is not a Deliveroo shop.**
It loads from CSV, not JSON, via `loadBootsProducts()`, keyed by `BOOTS_SLUG`. It must
produce the same `{slug, store, items[]}` shape as `loadCatalogue()` or it loads and
renders nothing. It is deliberately excluded from the fridge and grocery list — it's
toiletries — while still counting toward the £15 minimum. The CSV has a UTF-8 BOM and
both `unit_price` and `price_gbp` columns; match column names exactly.

**Share mode.**
`SHARE` is set from the URL hash (`#/share` or `#/share/<id>`). In share mode `sset`
returns immediately, only the three recipe keys are fetched, and every personal
section is unreachable. If you add a new write path or a new section, check it against
`SHARE` — the guard in `sset` covers writes, but new UI needs its own check.

---

## Design system

Ivory / beige / sage / tomato. Bricolage Grotesque, Karla, DM Mono. Wobbly 2.5px
borders (`--wob*` radii), flat taupe shadows.

**No gradients, no blur, no drop shadows.** Match the existing components rather than
introducing new patterns.

Icons are 512×512 PNGs with **transparent** backgrounds, cropped tight to the artwork
with roughly a 4% margin. Exports from image tools usually arrive with a baked-in
cream background and ~80% empty padding; both must be removed or the icon renders as
a small picture in a visible square.

---

## Outstanding

- **Four Deliveroo orders (13 July) were never actually added.** An earlier attempt
  wrote them against an invented data shape and the code was removed. The real shape is
  `shopHist[slug][itemName] = {a, b, last}` — `a` counts adds, `b` counts buys. Screenshots
  are in the chat history if needed.
- **A blackberry hojicha ice cream recipe** is still to be added; the source document
  came through empty.
- **`/api/kv` has no authentication.** Any key is readable by anyone who knows the URL.
  Share links make this more relevant. Fix: allowlist the three recipe keys for
  unauthenticated GET, require a secret from an env var for everything else.
- **`icons/beef-soup.png` is unused** — no recipe references it. It's a beef and radish
  soup, waiting for a matching recipe.
- **The tin planner only appears on recipes with an anchor calculator** (currently just
  the Basque cheesecake). Making it available to any recipe with a known batter weight
  is a small change.
- **Nothing here has been verified in a browser** — only statically and by executing
  the logic directly.

---

## Working style that has proven necessary

- Read the file before editing it. Blind find-and-replace on this file has corrupted
  the doctype, nested recipes inside other recipes, and scattered calls to a function
  that was never defined.
- After any change to `seed()`, execute it and inspect the array.
- "It parses" is not verification. The JavaScript parsed cleanly while raw JS was
  sitting outside the `<script>` tag and the doctype was broken.
- When a fix doesn't work, check whether the assumed cause is real before adding a
  second fix on top of it.
