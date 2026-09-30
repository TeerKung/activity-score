CREATE TABLE `scoreboard_players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`imageUrl` varchar(500),
	`score` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scoreboard_players_id` PRIMARY KEY(`id`),
	CONSTRAINT `scoreboard_players_slot_unique` UNIQUE(`slot`)
);
