CREATE UNIQUE INDEX "uq_feed_subscriptions_id_user" ON "feed_subscriptions" USING btree ("id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_links_id_user" ON "links" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "fk_feed_items_subscription_owner" FOREIGN KEY ("subscription_id","user_id") REFERENCES "public"."feed_subscriptions"("id","user_id") ON DELETE cascade ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "fk_feed_items_link_owner" FOREIGN KEY ("link_id","user_id") REFERENCES "public"."links"("id","user_id") ON DELETE no action ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "chk_feed_items_state" CHECK ("feed_items"."state" in ('new', 'dismissed', 'saved')) NOT VALID;--> statement-breakpoint
ALTER TABLE "feed_subscriptions" ADD CONSTRAINT "chk_feed_subscriptions_status" CHECK ("feed_subscriptions"."status" in ('active', 'paused')) NOT VALID;
