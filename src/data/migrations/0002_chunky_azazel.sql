CREATE TABLE `daily_draw` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`draw_date` text NOT NULL,
	`pocket_id` text NOT NULL,
	`reroll_count` integer DEFAULT 0 NOT NULL,
	`confirmed_at` integer,
	`rested_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_draw_stone` (
	`id` text PRIMARY KEY NOT NULL,
	`draw_id` text NOT NULL,
	`stone_id` text NOT NULL,
	`cant_do_at` integer,
	`created_at` integer NOT NULL
);
