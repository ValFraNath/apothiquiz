ALTER TABLE `server_informations` 
    CHANGE `key` `key` VARCHAR(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL; 

UPDATE `server_informations`
    SET `value` = "2021-02-19" WHERE `key` = "api_version";
    