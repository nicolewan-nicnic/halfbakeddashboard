# Decision patterns

Append to `CLAUDE.md`. These are the recurring judgements behind the app, each with
the decision it came from, so future changes can be made in the same spirit rather
than reasoned from scratch.

---

## Product thinking

### Find the invariant, not the surface parameter

The tin planner could have been "tell me your tin size". It works backwards from
**bake depth** instead, because depth is the physical property that decides whether a
deep cheesecake sets — too shallow overbakes, too deep stays raw. Tin size is just one
way to arrive at a depth.

The reference depth (5.1 cm) was *derived from the recipe's own numbers* — 1,937 g of
batter over a 22 cm tin's 380 cm² — not asked for or invented. When the data already
implies the answer, compute it rather than adding a field.

Generalises: when a feature request names a parameter, ask what that parameter is a
proxy for. Build against the thing that actually governs the outcome.

### One source of truth, or they will drift

The Basque recipe had its variant quantities in two places: the batch calculator's
`calc.options`, and static text in the ingredient list. They had already drifted — the
list showed cream as 300 g when hojicha needs 330 g, and omitted sugar entirely. Worse,
the static text didn't rescale, so at ×2 the list said 230 g while the calculator said
460 g.

The fix reuses `anchorOpt`, the calculator's own state, for the ingredient toggle. Not
just tidier — it makes disagreement *impossible* rather than merely fixed.

Generalises: if two places can hold the same fact, treat that as a bug regardless of
whether they currently agree.

### Warnings should say what to do, not what the number is

An empty container in "fill the first, rest over" mode showed 0 cm depth and got a red
"much shallower than the recipe" warning. Numerically correct, humanly wrong — the
right message is *"not needed — the first tin takes it all"*.

Generalises: derive messages from the user's situation, not from the arithmetic.

### Stability beats correctness in list ordering

Cuisines render in a fixed order (Korean → Vietnamese → Japanese → …) rather than
alphabetically or by count, so the drawer doesn't reshuffle as recipes are added.
Unrecognised cuisines fall to the end rather than disappearing.

Tags order by *frequency*, because that list should adapt to actual use.

Generalises: for things people navigate by muscle memory, keep positions stable. For
things people scan, optimise for relevance.

### Respect what the data actually is

Boots is toiletries and pharmacy. It participates in the basket and the £15 minimum
because that's a delivery-economics question, but it's excluded from the fridge and
grocery list because those are about food you'll cook with. Same mechanism, different
semantics, and the split follows the semantics.

---

## Engineering thinking

### Guard the choke point, don't enumerate the surface

Share mode disables writes inside `sset` — the single function every save funnels
through. Hiding buttons was done too, but as presentation, not as the boundary. Hiding
N buttons is enumeration and you will miss one; guarding the funnel is structural and
holds for buttons that don't exist yet.

Generalises: for any "must never happen" rule, find the narrowest point everything
passes through and enforce it there.

### Own the failure mode of your precedence rule

`rebuild()` lets a user override beat the shipped recipe — correct, since app updates
must not wipe edits. The cost is that a bad value written once wins forever. That's why
`init()` has a self-heal that clears saved icons matching what the guesser would
produce, and why Settings has a manual reset.

Generalises: when you pick a winner in a merge, you've also chosen which mistakes
become permanent. Build the escape hatch in the same change.

### Prefer the change that doesn't multiply the codebase

Splitting into genuine `fridge.html`, `grocery.html` and so on would mean either five
copies of a 2,800-line file or extracting a shared `app.js` — a real refactor. Hash
routing delivers what was actually wanted (distinct URLs, working Back button, deep
links) with none of that.

Generalises: separate the user-facing benefit from the implementation someone imagined.
Deliver the benefit; defer the restructure until it's the genuine bottleneck.

### New data sources conform to the existing internal shape

Boots arrives as CSV rather than Deliveroo's JSON, but `loadBootsProducts()` emits the
same `{slug, store, items[]}` that `loadCatalogue()` does, so the entire shop UI works
unchanged. An early version emitted `{store, products}` — it loaded successfully and
displayed nothing.

Generalises: adapt at the boundary. Don't teach the UI about every source.

### Make additions patchable

`cuisine` and `tags` were added to `PATCHABLE` so a future edit to a shipped recipe
doesn't wipe tags the user set themselves.

Generalises: any new user-editable field needs a deliberate answer for what happens
when the shipped version of that recipe changes.

---

## Diagnostic thinking

### "Sometimes" usually means data-dependent, not random

"Sometimes the tickboxes don't work" sounded intermittent. It was perfectly
deterministic — it happened on exactly the two recipes carrying `calc:[]`. Asking
*which* recipes rather than *when* found it immediately.

### Distrust proxies for verification

Two failures in this project came from checks that measured the wrong thing:

- "The JavaScript parses cleanly" — while raw JS sat outside the `<script>` tag and the
  doctype was broken, because the check only inspected the last script block.
- "21 recipes, no duplicates" — counted `{id:'` patterns anywhere in the text, including
  two recipes nested inside another recipe's `calc.options`.

Both replaced with checks that execute the real thing: parse every script block, and
evaluate `seed()` and inspect the returned array.

Generalises: ask what the check would still report if the thing you care about were
broken. If the answer is "success", it isn't a check.

### Verify the cause before layering a second fix

The icon problem got a path fix, then an `ART` fix, then a self-heal, then a
diagnostic — because each new fix was applied without confirming the previous diagnosis
was right. The version test suggested ("check it says Version 6") was worthless:
`APP_VERSION` was already 6 before any changes, so it couldn't distinguish the builds.

Generalises: when a fix doesn't work, re-examine the diagnosis before adding to it. A
fix that doesn't help is evidence about the cause.

### Failure ordering is a design concern

`wireCalc` threw, and every tickbox on the page died — not because ticks depend on the
calculator, but because handler binding happened afterwards. Ticks now bind first and
the calculator is wrapped.

Generalises: in code that binds handlers in sequence, order encodes priority. Bind what
matters most, first.
