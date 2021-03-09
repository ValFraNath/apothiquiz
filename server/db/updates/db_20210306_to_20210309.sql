ALTER TABLE `user`
ADD `us_messaging_token` VARCHAR(255) NULL DEFAULT NULL
AFTER `us_avatar`;


UPDATE `server_informations`
    SET `value` = "2021-03-09" WHERE `key` = "api_version";