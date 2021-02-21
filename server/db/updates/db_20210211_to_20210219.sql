ALTER TABLE `user` 
ADD `us_admin` BOOLEAN NOT NULL DEFAULT FALSE 
AFTER `us_login`; 


ALTER TABLE `user` ADD `us_deleted` DATE NULL DEFAULT NULL AFTER `us_admin`; 

ALTER TABLE `user` 
CHANGE `us_avatar` `us_avatar` JSON NOT NULL DEFAULT '[]';

ALTER TABLE `results` 
DROP FOREIGN KEY `results_ibfk_1`; 

ALTER TABLE `results` 
ADD CONSTRAINT `results_ibfk_1` FOREIGN KEY (`us_login`) REFERENCES `user`(`us_login`) ON DELETE CASCADE ON UPDATE CASCADE; 

ALTER TABLE `results` 
DROP FOREIGN KEY `results_ibfk_2`; 

ALTER TABLE `results` 
ADD CONSTRAINT `results_ibfk_2` FOREIGN KEY (`du_id`) REFERENCES `duel`(`du_id`) ON DELETE CASCADE ON UPDATE CASCADE; 


UPDATE `server_informations`
    SET `value` = "2021-02-19" WHERE `key` = "api_version";
    