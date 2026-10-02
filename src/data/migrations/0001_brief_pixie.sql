CREATE TABLE `pocket` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stone` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pocket_id` text NOT NULL,
	`plan_id` text,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`weekly_n_target` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
