ALTER TABLE `molecule` CHANGE `mo_difficulty` `mo_difficulty` INT(11) NOT NULL DEFAULT 0; 
UPDATE `server_informations`
    SET `value` = "2021-04-20" WHERE `key` = "api_version";