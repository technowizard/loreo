CREATE INDEX "idx_feed_items_user_effective_date_id" ON "feed_items" USING btree ("user_id",coalesce("published_at", "discovered_at"),"id");--> statement-breakpoint
CREATE INDEX "idx_feed_items_user_subscription_effective_date_id" ON "feed_items" USING btree ("user_id","subscription_id",coalesce("published_at", "discovered_at"),"id");
