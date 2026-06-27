CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"link_id" uuid,
	"guid" text,
	"url" text NOT NULL,
	"normalized_url" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"author" text,
	"published_at" timestamp with time zone,
	"image_url" text,
	"state" varchar(20) DEFAULT 'new' NOT NULL,
	"discovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"saved_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"feed_url" text NOT NULL,
	"normalized_feed_url" text NOT NULL,
	"site_url" text,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"auto_save" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_fetched_at" timestamp with time zone,
	"last_successful_fetch_at" timestamp with time zone,
	"next_fetch_after" timestamp with time zone,
	"last_error" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"etag" text,
	"last_modified" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_subscription_id_feed_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."feed_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_items" ADD CONSTRAINT "feed_items_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_subscriptions" ADD CONSTRAINT "feed_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feed_items_subscription_guid" ON "feed_items" USING btree ("subscription_id","guid");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feed_items_subscription_normalized_url" ON "feed_items" USING btree ("subscription_id","normalized_url");--> statement-breakpoint
CREATE INDEX "idx_feed_items_user_state_published" ON "feed_items" USING btree ("user_id","state","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_feed_items_user_normalized_url" ON "feed_items" USING btree ("user_id","normalized_url");--> statement-breakpoint
CREATE INDEX "idx_feed_items_subscription_discovered" ON "feed_items" USING btree ("subscription_id","discovered_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_feed_items_link_id" ON "feed_items" USING btree ("link_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feed_subscriptions_user_normalized_url" ON "feed_subscriptions" USING btree ("user_id","normalized_feed_url");--> statement-breakpoint
CREATE INDEX "idx_feed_subscriptions_user_created" ON "feed_subscriptions" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_feed_subscriptions_status_next_fetch" ON "feed_subscriptions" USING btree ("status","next_fetch_after");--> statement-breakpoint
CREATE INDEX "idx_feed_subscriptions_user_status" ON "feed_subscriptions" USING btree ("user_id","status");