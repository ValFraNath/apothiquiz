ALTER TABLE `results` CHANGE `re_answers` `re_answers` JSON NULL DEFAULT NULL; 

ALTER TABLE `duel` ADD `du_inProgress` BOOLEAN NOT NULL DEFAULT TRUE AFTER `du_currentRound`; 

CREATE PROCEDURE `createDuel`(  IN `player1` VARCHAR(32), 
                                IN `player2` VARCHAR(32), 
                                IN `content` JSON) 
                                NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
BEGIN 
    SET @id = ( SELECT IFNULL(MAX(du_id),0)+1 
            FROM duel); 
            
    INSERT INTO duel VALUES (@id,content,1); 

    INSERT INTO results VALUES (player1,@id,"[]"); 
    INSERT INTO results VALUES (player2,@id,"[]"); 

    SELECT @id as id; 
END;

CREATE PROCEDURE `getDuel`(IN `id` INT(11), IN `player` VARCHAR(32)) 
    NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
    SELECT * 
    FROM results NATURAL JOIN duel 
    WHERE du_id = id 
    AND EXISTS (SELECT * 
                FROM results NATURAL JOIN duel 
                WHERE us_login = player 
                AND du_id = id);

CREATE PROCEDURE `getDuelsOf`(IN `player` VARCHAR(32)) 
    NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
    SELECT * 
    FROM results NATURAL JOIN duel AS D1 
    WHERE EXISTS (  SELECT * 
                    FROM results NATURAL JOIN duel AS D2 
                    WHERE us_login = player 
                    AND D1.du_id = D2.du_id) 
                    ORDER BY du_id;                



UPDATE `server_informations`
    SET `value` = "2021-01-24" WHERE `key` = "api_version";
    