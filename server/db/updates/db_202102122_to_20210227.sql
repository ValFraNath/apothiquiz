ALTER TABLE `user`
ADD `us_messaging_token` VARCHAR(255) NULL DEFAULT FALSE
AFTER `us_avatar`;


UPDATE `server_informations`
    SET `value` = "2021-02-27" WHERE `key` = "api_version";