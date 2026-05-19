CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text,
	"start_offset" integer NOT NULL,
	"end_offset" integer NOT NULL,
	"color" varchar(10) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"filename" varchar(255) NOT NULL,
	"total_rows" integer NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"job_id" varchar(255),
	"error_message" text,
	"extraction_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"extraction_progress" integer DEFAULT 0 NOT NULL,
	"extraction_completed" integer DEFAULT 0 NOT NULL,
	"extraction_failed" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"text_content" text,
	"excerpt" text,
	"search_vector" tsvector GENERATED ALWAYS AS (
		setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
		setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'B') ||
		setweight(to_tsvector('simple', COALESCE(text_content, '')), 'C')
	) STORED,
	"author" text,
	"favicon" text,
	"cover_image" text,
	"published_at" timestamp with time zone,
	"reading_time" integer NOT NULL,
	"reading_progress" integer DEFAULT 0 NOT NULL,
	"time_spent_reading" integer DEFAULT 0 NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_paywalled" boolean DEFAULT false NOT NULL,
	"priority" varchar(20) DEFAULT 'none' NOT NULL,
	"last_read_at" timestamp with time zone,
	"processing_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"import_session_id" uuid,
	"processing_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(10) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"avatar" varchar(512),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_sessions" ADD CONSTRAINT "import_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_tags" ADD CONSTRAINT "link_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_import_session_id_import_sessions_id_fk" FOREIGN KEY ("import_session_id") REFERENCES "public"."import_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_groups" ADD CONSTRAINT "tag_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_group_id_tag_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."tag_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_highlights_link_id" ON "highlights" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_user_id" ON "highlights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_link_user" ON "highlights" USING btree ("link_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_start_offset" ON "highlights" USING btree ("start_offset");--> statement-breakpoint
CREATE INDEX "idx_import_sessions_user_id" ON "import_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_import_sessions_status" ON "import_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_sessions_created_at" ON "import_sessions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_link_tags_link_id" ON "link_tags" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "idx_link_tags_tag_id" ON "link_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_link_tags_user_id" ON "link_tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_link_tags_link_tag" ON "link_tags" USING btree ("link_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_links_user_id" ON "links" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_links_url" ON "links" USING btree ("url");--> statement-breakpoint
CREATE INDEX "idx_links_title" ON "links" USING btree ("title");--> statement-breakpoint
CREATE INDEX "idx_links_search_vector" ON "links" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "idx_links_title_trgm" ON "links" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_links_url_trgm" ON "links" USING gin ("url" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_links_excerpt_trgm" ON "links" USING gin ("excerpt" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_links_is_read" ON "links" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_links_is_favorite" ON "links" USING btree ("is_favorite");--> statement-breakpoint
CREATE INDEX "idx_links_is_archived" ON "links" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "idx_links_priority" ON "links" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_links_processing_status" ON "links" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "idx_links_created_at" ON "links" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_links_last_read_at" ON "links" USING btree ("user_id","last_read_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_links_user_created" ON "links" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_links_user_last_read_at" ON "links" USING btree ("user_id","last_read_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_links_import_session_id" ON "links" USING btree ("import_session_id");--> statement-breakpoint
CREATE INDEX "idx_links_processing_started_at" ON "links" USING btree ("processing_started_at");--> statement-breakpoint
CREATE INDEX "idx_tag_groups_name" ON "tag_groups" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_tag_groups_user_id" ON "tag_groups" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tag_groups_user_id_name" ON "tag_groups" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "idx_tags_user_id" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tags_group_id" ON "tags" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_tags_name" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_tags_user_group" ON "tags" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tags_user_group_name" ON "tags" USING btree ("user_id","group_id","name");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_settings" ON "users" USING gin ("settings");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_deleted_at" ON "users" USING btree ("deleted_at");
