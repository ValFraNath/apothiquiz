ALTER TABLE `molecule` CHANGE `mo_ID` `mo_id` INT(11) NOT NULL AUTO_INCREMENT;

UPDATE `system` SET `sy_version` = "2020-10-27";