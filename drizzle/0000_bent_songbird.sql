CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`author` varchar(100),
	`content` text NOT NULL,
	`source` varchar(255),
	`difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium',
	`questionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gradings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`score` decimal(5,1) NOT NULL,
	`comment` text NOT NULL,
	`strengths` text,
	`weaknesses` text,
	`suggestions` text,
	`gradedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gradings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`questionText` text NOT NULL,
	`standardAnswer` text NOT NULL,
	`scoringCriteria` text,
	`maxScore` int NOT NULL DEFAULT 10,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`articleId` int NOT NULL,
	`questionId` int NOT NULL,
	`answerText` text NOT NULL,
	`score` decimal(5,1),
	`maxScore` int NOT NULL DEFAULT 10,
	`status` enum('pending','grading','graded','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`color` varchar(20),
	`sortOrder` int NOT NULL DEFAULT 0,
	`articleCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
