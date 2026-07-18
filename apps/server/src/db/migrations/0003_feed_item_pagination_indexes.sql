CREATE INDEX IF NOT EXISTS "idx_feed_items_user_state_effective_date_id"
  ON "feed_items" USING btree (
    "user_id",
    "state",
    (coalesce("published_at", "discovered_at")),
    "id"
  );

CREATE INDEX IF NOT EXISTS "idx_feed_items_user_state_subscription_effective_date_id"
  ON "feed_items" USING btree (
    "user_id",
    "state",
    "subscription_id",
    (coalesce("published_at", "discovered_at")),
    "id"
  );
