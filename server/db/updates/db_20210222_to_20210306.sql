CREATE TABLE `token` ( 
	`to_value` VARCHAR(64) NOT NULL , 
	`us_login` VARCHAR(32) COLLATE utf8_bin NOT NULL , 
	PRIMARY KEY (`to_value`),
	FOREIGN KEY (`us_login`) REFERENCES `user`(`us_login`)
) ENGINE = InnoDB CHARSET=utf8 COLLATE utf8_bin; 

UPDATE `server_informations`
	SET `value` = "2021-03-06" WHERE `key` = "api_version";
    