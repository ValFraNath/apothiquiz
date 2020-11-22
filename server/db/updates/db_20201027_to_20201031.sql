DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
    `us_login` varchar(32) NOT NULL,
    PRIMARY KEY (`us_login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

UPDATE `system` SET `sy_version` = "2020-10-31";