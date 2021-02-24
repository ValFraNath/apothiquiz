ALTER TABLE `server_informations` 
    CHANGE `key` `key` VARCHAR(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL; 

ALTER TABLE `duel` ADD `du_questionTimerDuration` INT AFTER `du_inProgress`;  

DROP PROCEDURE `createDuel`; 

CREATE PROCEDURE `createDuel`(IN `player1` VARCHAR(32), 
                              IN `player2` VARCHAR(32), 
                              IN `content` JSON) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER                               
  BEGIN 
    SET @id = ( SELECT IFNULL(MAX(du_id),0)+1 FROM duel); 
    SET @timer = (SELECT value FROM server_informations WHERE server_informations.key = "config_question_timer_duration"); 
    INSERT INTO duel VALUES (@id,content,1,true,@timer); 
    INSERT INTO results VALUES (player1,@id,"[]"); 
    INSERT INTO results VALUES (player2,@id,"[]"); 
    SELECT @id as id; 
  END;

UPDATE `server_informations`
    SET `value` = "2021-02-22" WHERE `key` = "api_version";
    