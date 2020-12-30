ALTER TABLE `user` 
ADD `us_wins` INT NOT NULL DEFAULT '0' AFTER `us_login`, 
ADD `us_losts` INT NOT NULL DEFAULT '0' AFTER `us_wins`; 

DROP TABLE IF EXISTS `duel`;
CREATE TABLE IF NOT EXISTS `duel` ( 
    `du_id` INT NOT NULL AUTO_INCREMENT , 
    `du_content` TEXT NOT NULL , 
    `du_currentRound` INT NOT NULL , 
    PRIMARY KEY (`du_id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin; 

DROP TABLE IF EXISTS `results`;
CREATE TABLE IF NOT EXISTS `results` ( 
    `us_login` VARCHAR(32) NOT NULL , 
    `du_id` INT NOT NULL , 
    `re_answers` TEXT NOT NULL , 
    PRIMARY KEY (`us_login`, `du_id`),
    CONSTRAINT `result_fkey_user` FOREIGN KEY (`us_login`) REFERENCES `user` (`us_login`) ON UPDATE CASCADE ON DELETE RESTRICT ,
    CONSTRAINT `result_fkey_duel` FOREIGN KEY (`du_id`) REFERENCES `duel` (`du_id`) ON UPDATE CASCADE ON DELETE RESTRICT 
) ENGINE = InnoDB DEFAULT CHARSET=utf8 COLLATE utf8_bin; 
    

UPDATE `system` SET `sy_version` = "2020-11-27";
