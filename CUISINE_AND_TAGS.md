# Cuisine grouping, tags, and the icon diagnostic

## First — I gave you a bad test

I told you to check for "Version 6". That was useless advice: `APP_VERSION` was already `6` in the file you originally sent me and I never bumped it, so it reads 6 on both the old and new build. Sorry — that test couldn't have told either of us anything. There's a real diagnostic below instead.

---

## The icon problem: most likely cause

When the app merges your saved data over the shipped recipes, **your saved version wins**. That's normally right — it's what stops an app update from wiping your edits. But it means that if an earlier, broken build ever saved a *guessed* icon into your database (which happens the moment you edit and save a recipe while the guess is on screen), that wrong icon keeps winning even after the code is fixed.

That fits your screenshot exactly: the icons showing are precisely what the guesser produces for those recipe names.

### Two things now in Settings

Open **Settings** and you'll see a new line, e.g.:

> `Icons: 25 registered · all recognised · 8 saved icon overrides`

- **"25 registered"** — if this says 25, the new `index.html` is definitely live. If the line is missing entirely, it isn't.
- **"unknown on: …"** — names listed here point at an icon file the app can't find.
- **"N saved icon overrides"** — this is the smoking gun. If N is more than 0, saved icons are overriding the correct ones.

And a button: **"Reset all icons to shipped defaults."** It clears only saved *icon* choices — your recipes, edits, ingredients and method are untouched. That should fix the grid in one click.

> Also worth checking: the five new PNGs (`soft-eggs`, `green-salad`, `brown-soup`, `red-soup`, `beef-soup`) need to be in `icons/`. Your last folder listing didn't include them.

---

## Cuisine grouping

The drawer now groups recipes under cuisine headings, in a fixed order so the layout doesn't shuffle around as you add recipes:

**Korean → Vietnamese → Japanese → Chinese → Thai → Singaporean → Fusion → Western**

Anything with an unrecognised cuisine falls to the end rather than disappearing. Each heading shows a count.

| Cuisine | Recipes |
|---|---|
| Korean | Mayak Eggs, Lazy Girl Maeuntang, Kkaenip Jeon, Pa Muchim, Pajeon |
| Vietnamese | Bánh Xèo, Nuoc Cham, Vietnamese Coffee |
| Japanese | Onsen Eggs, Tomato Somen |
| Chinese | Collagen Chicken Congee |
| Thai | Red Curry Chicken & Charred Cabbage |
| Singaporean | Chicken Rice |
| Fusion | Gochujang Hummus, Steak au Poivre |
| Western | Basque Cheesecake, Crispy Wings, Charred Cabbage, Carrot Salad |

I put Gochujang Hummus and the miso/sansho Steak au Poivre under **Fusion** since neither sits honestly in one tradition — move them if you disagree.

---

## Tags

A row of filter pills sits under the search box. Tap one to narrow the drawer, tap "All" to clear. Tags are ordered by how often they're used, so the ones you actually reach for stay at the front. The row is built from whatever tags exist, so it grows automatically as you add your own.

Starting tags: **Main, Side, Dessert, Drink, Dip, Sauce, Quick, Weeknight, Weekend, Date night, Make-ahead, No-cook, Vegetarian, Spicy, Soup, Noodles, Eggs, Pan-fried, Baking, Air fryer, Comfort**

Search, cuisine grouping, and tag filtering all work together — search "egg" with **Quick** active and you get only quick egg recipes.

### Editing them
The recipe editor has two new fields: **Cuisine** (free text) and **Tags** (comma separated). Both save like any other edit, and both are treated as patches — so future updates to a recipe won't wipe tags you've set yourself.

Tags and cuisine also appear as small chips on the recipe page itself.

---

## Still to sort

**Deliveroo "other shops".** Your screenshot confirmed all nine JSON files are present, so my earlier "missing files" guess was wrong. To diagnose it properly I need one of: your `vercel.json`, one shop file (e.g. `co-op.json`), or the browser console output (F12 → Console) when you hit compare-all-shops. Any one of those and I can fix it rather than guess.
