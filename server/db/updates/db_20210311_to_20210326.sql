CREATE PROCEDURE `getChallengeableUsers`(IN `player` VARCHAR(32)) 
    NOT DETERMINISTIC NO SQL SQL SECURITY DEFINER 
    SELECT  us_login        AS pseudo,
            us_victories    AS victories,
            us_defeats      AS defeats,
            us_avatar       AS avatar 
    FROM user
    WHERE us_deleted IS NULL
    AND us_login != player
    AND us_login NOT IN (
        -- All the users currently challenged by player
        SELECT DISTINCT(R2.us_login) 
        FROM duel, results AS R1, results as R2 
        WHERE R1.du_id = R2.du_id 
        AND R1.du_id = duel.du_id 
        AND duel.du_finished IS NULL 
        AND R1.us_login = player
    );

UPDATE `server_informations`
	SET `value` = "2021-03-26" WHERE `key` = "api_version";
    