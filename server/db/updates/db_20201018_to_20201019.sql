START TRANSACTION;

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
    `us_login` varchar(16) COLLATE utf8_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO `molecule` (`mo_ID`, `mo_name`, `mo_dci`, `mo_difficulty`, `mo_skeletal_formula`) VALUES (NULL, 'paracetamol', 'malocrane', '1', 'N2F4K3');

UPDATE system SET sy_version = "2020-10-19";

COMMIT;