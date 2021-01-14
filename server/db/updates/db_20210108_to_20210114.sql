ALTER TABLE `user`
    ADD `us_avatar` VARCHAR(256) NOT NULL DEFAULT '' AFTER `us_losts`;

UPDATE `server_informations`
    SET `value` = "2021-01-14" WHERE `key` = "api_version";