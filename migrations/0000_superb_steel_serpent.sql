CREATE TABLE `action_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reportId` integer NOT NULL,
	`text` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`response` text,
	`createdAt` integer NOT NULL,
	`respondedAt` integer,
	FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `action_report_idx` ON `action_requests` (`reportId`);--> statement-breakpoint
CREATE TABLE `areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reportId` integer NOT NULL,
	`name` text NOT NULL,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `area_report_idx` ON `areas` (`reportId`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`areaId` integer NOT NULL,
	`name` text NOT NULL,
	`clean` integer,
	`undamaged` integer,
	`working` integer,
	`rating` integer,
	`comment` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `item_area_idx` ON `items` (`areaId`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`reportId` integer NOT NULL,
	`areaId` integer,
	`kind` text NOT NULL,
	`url` text NOT NULL,
	`caption` text,
	`sortOrder` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`reportId`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`areaId`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `media_report_idx` ON `media` (`reportId`);--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`address` text NOT NULL,
	`suburb` text NOT NULL,
	`state` text NOT NULL,
	`postcode` text NOT NULL,
	`inspectorId` integer NOT NULL,
	`ownerId` integer,
	`ownerCode` text NOT NULL,
	`tenantName` text,
	`leaseExpiry` text,
	`weeklyRent` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`inspectorId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `properties_ownerCode_unique` ON `properties` (`ownerCode`);--> statement-breakpoint
CREATE INDEX `prop_inspector_idx` ON `properties` (`inspectorId`);--> statement-breakpoint
CREATE INDEX `prop_owner_idx` ON `properties` (`ownerId`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`propertyId` integer NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`inspectionDate` text NOT NULL,
	`inspectorName` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`summary` text,
	`maintenanceRequired` text,
	`suggestedImprovements` text,
	`cleanliness` integer,
	`condition` integer,
	`score` integer,
	`tenantName` text,
	`createdAt` integer NOT NULL,
	`publishedAt` integer,
	FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `report_prop_idx` ON `reports` (`propertyId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`unionId` text NOT NULL,
	`name` text,
	`email` text,
	`passwordHash` text,
	`avatar` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignInAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_unionId_unique` ON `users` (`unionId`);