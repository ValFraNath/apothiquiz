RENAME TABLE `property` TO `property_value`;
RENAME TABLE `category` TO `property`;

ALTER TABLE `property_value` DROP FOREIGN KEY `property_value_ibfk_1`;

ALTER TABLE `property` CHANGE `ca_id` `ca_id` INT(11) NOT NULL; 
ALTER TABLE `property` DROP PRIMARY KEY ;
ALTER TABLE `property` CHANGE `ca_id` `pr_id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, CHANGE `ca_name` `pr_name` VARCHAR(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL; 

ALTER TABLE `molecule_property` DROP FOREIGN KEY `molecule_property_ibfk_2`;

ALTER TABLE `property_value` CHANGE `pr_id` `pr_id` INT(11) NOT NULL; 
ALTER TABLE `property_value` DROP PRIMARY KEY ;
ALTER TABLE `property_value` 
    CHANGE `pr_id` `pv_id` INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    CHANGE `pr_name` `pv_name` VARCHAR(64) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
    CHANGE `pr_category` `pv_property` INT(11) NOT NULL; 
    

ALTER TABLE `molecule_property` CHANGE `pr_id` `pv_id` INT(11) NOT NULL; 



ALTER TABLE `property_value`
	ADD FOREIGN KEY (`pv_property`) REFERENCES `property`(`pr_id`);

ALTER TABLE `molecule_property`
	ADD FOREIGN KEY (`pv_id`) REFERENCES `property_value`(`pv_id`);

    
UPDATE `server_informations`
    SET `value` = "2021-01-16" WHERE `key` = "api_version";
    