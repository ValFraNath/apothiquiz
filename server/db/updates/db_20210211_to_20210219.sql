ALTER TABLE `user` 
ADD `us_admin` BOOLEAN NOT NULL DEFAULT FALSE 
AFTER `us_login`; 

ALTER TABLE `user` 
CHANGE `us_avatar` `us_avatar` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '\'[]\''; 

CREATE TRIGGER `before_user_delete` 
BEFORE DELETE ON `user` 
FOR EACH ROW 
DELETE FROM duel 
WHERE EXISTS (  SELECT * 
                FROM results 
                WHERE results.du_id = duel.du_id 
                AND results.us_login = OLD.us_login );

UPDATE `server_informations`
    SET `value` = "2021-02-19" WHERE `key` = "api_version";
    