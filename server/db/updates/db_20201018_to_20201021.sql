START TRANSACTION;

ALTER TABLE `molecule`
DROP COLUMN `mo_name`;

UPDATE `system` SET `sy_version` = "2020-10-21";
