ALTER TABLE `duel` ADD `du_finished` DATE NULL DEFAULT NULL AFTER `du_questionTimerDuration`;

ALTER TABLE `results` ADD `re_last_time` DATE NULL DEFAULT NULL AFTER `re_answers`;

CREATE PROCEDURE `removeOldDuels`(IN olderThan DATE)
BEGIN
	DELETE FROM `duel`
        WHERE `du_finished` IS NOT NULL
          AND `du_finished` <= olderThan;
END;

DROP PROCEDURE `createDuel`;

CREATE PROCEDURE `createDuel`(IN `player1` VARCHAR(32),
                              IN `player2` VARCHAR(32),
                              IN `content` JSON) NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER
  BEGIN
    SET @id = ( SELECT IFNULL(MAX(du_id),0)+1 FROM duel);
    SET @timer = (SELECT value FROM server_informations WHERE server_informations.key = "config_question_timer_duration");
    INSERT INTO duel VALUES (@id,content,1,true,@timer, NULL);
    INSERT INTO results VALUES (player1,@id,"[]", NULL);
    INSERT INTO results VALUES (player2,@id,"[]", NULL);
    SELECT @id as id;
  END;


UPDATE `server_informations`
    SET `value` = "2021-03-02" WHERE `key` = "api_version";
    