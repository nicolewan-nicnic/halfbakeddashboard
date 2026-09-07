# Half Baked Society — recipe app

Single-page recipe, fridge, meal-plan and grocery-shopping app. Deployed on Vercel.

## Layout

```
index.html    the entire app — markup, CSS and JS in one file (~2,800 lines)
api/kv.js     key-value store backing /api/kv
api/ai.js     server proxy for the Claude calls (photo intake, recipe paste)
data/         shop price lists — `<slug>.csv` per shop (current), `<slug>.json` (older fallback)
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

`hbs:menu` (`menu`) is a flat list of mix-and-match dishes: `{id, name, role, note}`
where `role` is one of `carb` / `veg` / `meat` / `other`. It backs the "Mix & match
menu" panel on the meal plan — tap a dish to write `role: name` into a day.

### Meal-plan entries
`plan[isoDate]` is an array of entries. Three shapes:
- `{id, done}` — a recipe reference (rendered from `seed()`/`mine`).
- `{note, done}` (no `id`) — a plain line the user typed. Stored verbatim; nothing
  parses it. A free-text slot for Claude Code to read and act on.
- `{tmpl:'nbd', id:'no-brainer-dinner', carb, protein, veg[], cook, fav, status,
  done, created, updated}` — a **No-Brainer Dinner** instance (see below).
`renderPlan`, `renderHome`'s "Today", `renderNav`'s count and `#plan-to-list` all
branch on these — check `p.tmpl==='nbd'` first, then `p.id==null && p.note!=null`.

### No-Brainer Dinner
One catalogue meal — the seed recipe `no-brainer-dinner`. Every combination is a
planned **instance** in `plan[iso]` (`tmpl:'nbd'`), never a new catalogue meal.
- Builder: `mode='nbd'`, `nbdRef={iso,idx}` → `renderNbd()`. Transient (no route);
  entered by choosing "No-Brainer Dinner" in the day picker or tapping an instance.
- `carb` = `{kind}` (5 standards + custom carbs stored in `menu` as `role:'carb'`).
  `protein` = `{cat, name?}` (5 categories + optional specific). `veg` = `[{ids:[fridge
  ids], name}]` — dedup fridge+freezer by name, keep **all** ids so a renamed/removed
  item is still linked. `cook` = optional string.
- `foodClass(item)` classifies by keyword (`VEG_WORDS`/`CARB_WORDS`/`PROT_WORDS`),
  overridable per fridge item via `f.class`. `f.opened` (bool, toggled in the fridge
  row) feeds priority.
- Inventory is **never** touched on planning. `nbdComplete()` (via "Mark cooked" →
  confirm-usage panel) removes the ticked fridge ids, sets `status:'completed'`,
  `done:true`, and pushes the combo to `nbdRecent` (`hbs:nbd.recent`, cap 12).
  `status` ∈ `planned`/`completed`/`skipped`; removing the entry = deleted.
- `hbs:nbd.fav` (`nbdFav`) = saved combos; veg stored by name, re-resolved to ids
  on reuse (`nbdLoadCombo`), unresolved ones flagged by `nbdMissing`.
- "Use what I have" = `nbdAuto()` — fills gaps from available inventory, expiring +
  opened first, nudges off an exact `nbdRecent` repeat. Never auto-adds to the
  shopping list; every shopping action is an explicit button that dedupes.

### Rendering
`render()` calls `renderNav()`, then `renderBody()` (the `mode` dispatch), then
`shapeBalls()`. Each section has its own `renderX()`. Handlers are re-bound on every
render — there is no framework.

### Hash routing
`syncHash()` uses `history.pushState` (not `location.hash =`) so the app's own
navigation never fires `hashchange` and never bounces back through `applyHash`.
`hashFor()` returns `null` while `editing`, `mode==='paste'` or `mode==='nbd'` —
transient states with no URL of their own. Only real Back/Forward reaches the
`hashchange` listener.

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

**Shop price lists: `data/<slug>.csv` is the source of truth.**
`data/<slug>.json` is a compact pre-parsed copy, regenerated from the CSV by
`scripts/csv-to-json.py` — **run that after editing any CSV**.
- `loadCatalogue()` (single shop): CSV first (`parseShopCsv`), JSON fallback — the
  shop you're building a basket for is always freshest.
- `loadAllCatalogues()` ("compare every shop"): JSON first — the browser would
  otherwise parse ~14 MB of CSV. CSV fallback for a shop with no JSON.
- `loadBootsProducts()`: `boots-borehamwood.csv` → `boots_borehamwood_products.csv`
  → `boots.json`.
Every path must produce `{slug, store, items:[{name,price,cat,size}]}`.
`parseShopCsv` strips the UTF-8 BOM, takes `price_gbp` (never `unit_price` — it
carries `£x/L` junk) and **`category`** for `cat` (the ~30-bucket curated taxonomy
the `FAMS` family filter is tuned for, not the 190+ raw `subcategory` aisles).

**Boots is still not a food shop.**
Toiletries/pharmacy — excluded from the fridge and grocery list, still counts toward
the £15 minimum. Keyed by `BOOTS_SLUG`, own loader; its slug has no `STORES` entry.

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
- **`/api/kv` authentication.** Set `APP_TOKEN` in the environment to lock the store
  down: with it set, writes and reads of anything other than the three public recipe
  keys (`hbs:recipes.mine` / `.overrides` / `.removed`) require
  `Authorization: Bearer <APP_TOKEN>`. The owner supplies it once via `?k=<token>` in
  the app URL — the page stores it, strips it from the address bar, and sends it on
  every call. Share links never carry it. With `APP_TOKEN` unset the store stays fully
  open (dev only). Same token gates `/api/ai`.
- **Photo intake / recipe paste need a server.** They POST to `/api/ai`, which adds
  `x-api-key` from `ANTHROPIC_API_KEY` (env) and forwards to Anthropic — the key never
  reaches the browser. Without a server (`API_BASE=''`) the feature can't work.
- **`icons/beef-soup.png` is unused** — no recipe references it. It's a beef and radish
  soup, waiting for a matching recipe.
- **`icons/ice-cream.png` and `icons/empty-plate.png` are referenced but not yet on
  disk.** `ART` and three recipes (`matcha-gelato`, `matcha-hojicha-rice-ice-cream`
  → ice-cream; `no-brainer-dinner` → empty-plate) point at them. Until the files are
  added (512×512, transparent bg, tight ~4% crop) `art()` falls back to the croissant
  via a new `onerror` handler — no broken images, but not the intended art.
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
