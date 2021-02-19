ALTER TABLE `user` 
ADD `us_admin` BOOLEAN NOT NULL DEFAULT FALSE 
AFTER `us_login`; 


ALTER TABLE `user` ADD `us_deleted` DATE NULL DEFAULT NULL AFTER `us_admin`; 

ALTER TABLE `user` 
CHANGE `us_avatar` `us_avatar` JSON NOT NULL DEFAULT '[]'; 


UPDATE `server_informations`
    SET `value` = "2021-02-19" WHERE `key` = "api_version";
    