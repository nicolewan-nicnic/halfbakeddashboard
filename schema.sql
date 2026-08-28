-- One row per store. Values are JSON; the app owns their shape.
CREATE TABLE IF NOT EXISTS store (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Keys the app uses:
--   hbs:recipes.mine       recipes you created
--   hbs:recipes.overrides  only the fields you changed on a shipped recipe
--   hbs:recipes.removed    ids you deleted
--   hbs:fridge  hbs:grocery  hbs:plan  hbs:todos  hbs:foodprefs  hbs:meta
