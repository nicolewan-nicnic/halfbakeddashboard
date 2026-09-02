# New Recipe Icons — Quick Start Guide

## 📦 Files Ready to Deploy

### PNG Icons (9 files)
All optimized at 512×512 pixels, ready to add to `icons/` folder:

```
✓ onsen-eggs.png
✓ pajeon.png
✓ pa-muchim.png
✓ mayak-eggs.png
✓ kkaenip-jeon.png
✓ banh-xeo.png
✓ maeuntang.png
✓ gochujang-hummus.png
✓ basque-cheesecake.png
```

### Updated App File
`index.html` — Already has icon references updated ✓

---

## 🚀 Deploy in 3 Steps

### Step 1: Add Icons to GitHub
```bash
cd your-half-baked-repo/icons/
cp /path/to/new/icons/* .
git add *.png
git commit -m "Add 9 new recipe icons"
```

### Step 2: Update App Code
Choose one:

**Option A (Easiest):** Use the pre-updated index.html
```bash
cp /path/to/index.html ./
git add index.html
git commit -m "Update recipe icon mappings"
git push
```

**Option B (Manual):** If you've made other changes to index.html, update these lines in `function seed()`:

```javascript
// Find these recipes and change their icon values:
name:'Onsen Eggs',icon:'onsen-eggs'
name:'Green Onion Pancake (Pajeon)',icon:'pajeon'
name:'Pa Muchim (Scallion Salad)',icon:'pa-muchim'
name:'Mayak Eggs',icon:'mayak-eggs'
name:'Kkaenip Jeon',icon:'kkaenip-jeon'
name:'Bánh Xèo',icon:'banh-xeo'
name:'Lazy Girl Maeuntang',icon:'maeuntang'
name:'Gochujang Hummus',icon:'gochujang-hummus'
name:'Basque Cheesecake',icon:'basque-cheesecake'
```

### Step 3: Deploy
Vercel will automatically rebuild once you push. Icons will appear within 2–5 minutes.

---

## 📊 What Changed

| Recipe | Old Icon | New Icon |
|--------|----------|----------|
| Onsen Eggs | eggtart | onsen-eggs |
| Green Onion Pancake | eggtart | pajeon |
| Pa Muchim | cabbage | pa-muchim |
| Mayak Eggs | jar | mayak-eggs |
| Kkaenip Jeon | eggtart | kkaenip-jeon |
| Bánh Xèo | croissant | banh-xeo |
| Lazy Girl Maeuntang | noodlebowl | maeuntang |
| Gochujang Hummus | jar | gochujang-hummus |
| Basque Cheesecake | cakeslice | basque-cheesecake |

**Result:** 100% of 19 recipes now have accurate, distinct icons ✓

---

## 🎨 Icon Naming Convention

All icon files must use kebab-case and lowercase:
- ✓ `onsen-eggs.png`
- ✓ `banh-xeo.png`
- ✗ ~~`onsen_eggs.png`~~ 
- ✗ ~~`BanhXeo.png`~~

---

## ⚠️ Troubleshooting

**Icons not showing after deploy?**
1. Clear browser cache: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Verify PNGs are in `/icons/` folder on GitHub
3. Check that icon names in seed() match PNG filenames exactly
4. Redeploy: Vercel → Deployments → Redeploy

**One icon still missing?**
- Check the exact filename matches the icon value in seed()
- File names are case-sensitive

**Wrong icon showing?**
- Verify the recipe ID matches the correct icon name
- Example: `{id:'onsen-eggs',...,icon:'onsen-eggs'}` — both must match

---

## 📱 Testing Locally

To test the single-file HTML version:
1. Place PNG files in a `data/` folder next to the HTML
2. Rename all PNGs (e.g., `onsen-eggs.png` → just the name)
3. Open HTML in browser — icons should appear immediately

---

## ✅ Verification Checklist

Before pushing to GitHub:
- [ ] All 9 PNG files copied to `icons/` folder
- [ ] Filenames use kebab-case (onsen-eggs, not onsen_eggs)
- [ ] index.html has updated icon references in seed()
- [ ] Recipe ID and icon name match (e.g., both 'onsen-eggs')
- [ ] No typos in seed() — check special characters like 'Bánh Xèo'

---

## 📞 Still stuck?

Check that your file structure looks like this:
```
your-repo/
├── index.html          ← Updated with new icon mappings
├── icons/
│   ├── onsen-eggs.png
│   ├── pajeon.png
│   ├── pa-muchim.png
│   ├── mayak-eggs.png
│   ├── kkaenip-jeon.png
│   ├── banh-xeo.png
│   ├── maeuntang.png
│   ├── gochujang-hummus.png
│   └── basque-cheesecake.png
├── data/
│   └── [shop CSVs]
└── api/
    └── [Vercel functions]
```

Once this structure is pushed and deployed, all icons will work correctly.
