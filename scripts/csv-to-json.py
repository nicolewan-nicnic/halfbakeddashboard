#!/usr/bin/env python3
"""Regenerate data/<slug>.json from data/<slug>.csv (and Boots).

The app reads the CSVs directly for single-shop view, but the "compare every
shop" screen loads the pre-parsed JSON so it doesn't parse ~14 MB in the
browser. Run this after updating the CSVs to refresh that view.

    python3 scripts/csv-to-json.py
"""
import csv, json, sys, pathlib

DATA = pathlib.Path(__file__).resolve().parent.parent / "data"

# slug -> csv filename (only slugs the app knows about via STORES + Boots)
SHOPS = {
    "waitrose-barnet": "waitrose-barnet.csv",
    "longdan": "longdan.csv",
    "morrisons": "morrisons.csv",
    "waitrose-kentish-town": "waitrose-kentish-town.csv",
    "sainsbury-s-local": "sainsbury-s-local.csv",
    "sainsburys-stanmore": "sainsburys-stanmore.csv",
    "co-op": "co-op.csv",
    "asda-colindale": "asda-colindale.csv",
    "asda-express": "asda-express.csv",
    "boots": "boots-borehamwood.csv",
}
STORE_NAME = {
    "waitrose-barnet": "Waitrose Barnet", "longdan": "Longdan", "morrisons": "Morrisons",
    "waitrose-kentish-town": "Waitrose Kentish Town", "sainsbury-s-local": "Sainsbury's Local",
    "sainsburys-stanmore": "Sainsbury's Stanmore", "co-op": "Co-op",
    "asda-colindale": "Asda Colindale", "asda-express": "Asda Express",
    "boots": "Boots Borehamwood",
}

def col(fieldnames, *names):
    low = {f.lower(): f for f in fieldnames}
    for n in names:
        if n in low:
            return low[n]
    return None

def price_of(raw):
    s = "".join(c for c in str(raw or "") if c.isdigit() or c == ".")
    try:
        return round(float(s), 4)
    except ValueError:
        return None

def convert(slug, csv_name):
    path = DATA / csv_name
    if not path.exists():
        print(f"  skip {slug}: {csv_name} not found", file=sys.stderr)
        return None
    with path.open(encoding="utf-8-sig", newline="") as fh:
        rd = csv.DictReader(fh)
        fn = rd.fieldnames or []
        c_name = col(fn, "product_name", "name", "product")
        c_price = col(fn, "price_gbp", "price")
        c_cat = col(fn, "category", "subcategory")   # curated bucket, matches FAMS
        c_size = col(fn, "pack_size", "size")
        c_store = col(fn, "store")
        if not c_name or not c_price:
            print(f"  skip {slug}: unexpected columns {fn}", file=sys.stderr)
            return None
        store = STORE_NAME.get(slug, slug)
        items = []
        for r in rd:
            name = (r.get(c_name) or "").strip()
            p = price_of(r.get(c_price))
            if not name or p is None:
                continue
            if c_store and (r.get(c_store) or "").strip():
                store = (r.get(c_store) or "").strip()
            cat = ((r.get(c_cat) or "").strip() if c_cat else "") or "Other"
            size = (r.get(c_size) or "").strip() if c_size else ""
            items.append([name, p, cat, size])
    return {"store": store, "items": items}

def main():
    total = 0
    for slug, csv_name in SHOPS.items():
        out = convert(slug, csv_name)
        if out is None:
            continue
        dest = DATA / f"{slug}.json"
        dest.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        print(f"  {slug}.json  {len(out['items']):6d} items")
        total += len(out["items"])
    print(f"done — {total} items across {len(SHOPS)} shops")

if __name__ == "__main__":
    main()
