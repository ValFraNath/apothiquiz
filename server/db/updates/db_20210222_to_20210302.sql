ALTER TABLE `duel` ADD `du_finished` DATE NULL DEFAULT NULL AFTER `du_inProgress`;

CREATE PROCEDURE `removeOldDuels` (IN `olderThan` DATE)
BEGIN
    DELETE FROM `duel`
    WHERE `du_finished` IS NOT NULL
      AND `du_finished` <= oldThan;
END;


UPDATE `server_informations`
    SET `value` = "2021-03-02" WHERE `key` = "api_version";
    