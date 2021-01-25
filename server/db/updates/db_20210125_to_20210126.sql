ALTER TABLE `user` CHANGE `us_wins` `us_wins` INT(11) NULL DEFAULT '0', CHANGE `us_losts` `us_losts` INT(11) NULL DEFAULT '0'; 

CREATE PROCEDURE `incrementUserWins`(IN `user` VARCHAR(32)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
UPDATE user 
SET us_wins = ( SELECT IFNULL(us_wins,0)+1 
                FROM user 
                WHERE us_login = user) 
WHERE us_login = user;

CREATE PROCEDURE `incrementUserLosts`(IN `user` VARCHAR(32)) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
UPDATE user 
SET us_losts = ( SELECT IFNULL(us_losts,0)+1 
                FROM user 
                WHERE us_login = user) 
WHERE us_login = user;

UPDATE `server_informations`
    SET `value` = "2021-01-26" WHERE `key` = "api_version";
    