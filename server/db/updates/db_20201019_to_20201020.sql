START TRANSACTION;

DROP TABLE IF EXISTS `userss`;
CREATE TABLE IF NOT EXISTS `userss` (
    `us_login` varchar(16) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

UPDATE `molecule` SET `mo_difficulty` = '3', `mo_skeletal_formula` = 'N2F4K3FF' WHERE `molecule`.`mo_ID` = 1;

UPDATE system SET sy_version = "2020-10-20";

COMMIT;
