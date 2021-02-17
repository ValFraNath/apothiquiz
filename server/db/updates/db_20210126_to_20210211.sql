ALTER TABLE `molecule` ADD `mo_image` VARCHAR(64) NULL DEFAULT NULL AFTER `mo_system`; 

UPDATE `server_informations`
    SET `value` = "2021-02-11" WHERE `key` = "api_version";
    