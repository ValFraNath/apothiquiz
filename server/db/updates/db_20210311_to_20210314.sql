DROP PROCEDURE `getDuel`;

CREATE PROCEDURE `getDuel`(IN `id` INT(11), IN `player` VARCHAR(32))
    NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER
    SELECT *
    FROM results NATURAL JOIN duel, server_informations
    WHERE du_id = id AND `key` = 'config_duel_lifetime'
      AND EXISTS (SELECT *
                  FROM results NATURAL JOIN duel
                  WHERE us_login = player
                    AND du_id = id);

DROP PROCEDURE `getDuelsOf`;

CREATE PROCEDURE `getDuelsOf`(IN `player` VARCHAR(32))
    NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER
    SELECT *
    FROM results NATURAL JOIN duel AS D1, server_informations
    WHERE EXISTS (SELECT *
                  FROM results NATURAL JOIN duel AS D2
                  WHERE us_login = player
                  AND D1.du_id = D2.du_id)
     AND `key` = 'config_duel_lifetime'
    ORDER BY du_id;

UPDATE `server_informations`
	SET `value` = "2021-03-14" WHERE `key` = "api_version";
