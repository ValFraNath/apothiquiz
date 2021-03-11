ALTER TABLE `property_value` 
CHANGE `pv_name` `pv_name` VARCHAR(128) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL; 

UPDATE `server_informations`
	SET `value` = "2021-03-11" WHERE `key` = "api_version";
    