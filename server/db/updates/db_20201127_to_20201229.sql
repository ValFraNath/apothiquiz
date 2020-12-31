DROP TABLE `molecule_class`;
DROP TABLE `class`;

CREATE TABLE `category` (
    ca_id int(11) NOT NULL AUTO_INCREMENT,
    ca_name VARCHAR(256) NOT NULL,
    PRIMARY KEY (ca_id)
)ENGINE = InnoDB DEFAULT CHARSET=utf8 COLLATE utf8_bin;

ALTER TABLE `property` 
    ADD COLUMN pr_category int(11) NOT NULL,
    ADD UNIQUE( `pr_name`, `pr_category`),
    ADD FOREIGN KEY (pr_category) REFERENCES `category`(ca_id);

UPDATE `system` SET `sy_version` = "2020-12-29";