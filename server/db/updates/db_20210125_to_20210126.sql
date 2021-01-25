ALTER TABLE `user` CHANGE `us_wins` `us_victories` INT(11) NULL DEFAULT '0', CHANGE `us_losts` `us_defeats` INT(11) NULL DEFAULT '0'; 

CREATE PROCEDURE `incrementUserVictories`(IN `user` VARCHAR(32)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
UPDATE user 
SET us_victories = ( SELECT IFNULL(us_victories,0)+1 
                FROM user 
                WHERE us_login = user) 
WHERE us_login = user;

CREATE PROCEDURE `incrementUserDefeats`(IN `user` VARCHAR(32)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
UPDATE user 
SET us_defeats = ( SELECT IFNULL(us_defeats,0)+1 
                FROM user 
                WHERE us_login = user) 
WHERE us_login = user;

UPDATE `server_informations`
    SET `value` = "2021-01-26" WHERE `key` = "api_version";
    