-- constraints table `molecule_class`
ALTER TABLE `molecule_class`
    DROP CONSTRAINT `molecule_class_ibfk_1`,
    DROP CONSTRAINT `molecule_class_ibfk_2`;

ALTER TABLE `molecule_class`
    ADD CONSTRAINT `molecule_class_ibfk_1` FOREIGN KEY (`mo_id`) REFERENCES `molecule` (`mo_id`) ON UPDATE CASCADE ON DELETE RESTRICT ,
    ADD CONSTRAINT `molecule_class_ibfk_2` FOREIGN KEY (`cl_id`) REFERENCES `class` (`cl_id`) ON UPDATE CASCADE ON DELETE RESTRICT ;

-- Contstraints table `molecule_property`
ALTER TABLE `molecule_property`
    DROP CONSTRAINT `molecule_property_ibfk_1`,
    DROP CONSTRAINT `molecule_property_ibfk_2`;

ALTER TABLE `molecule_property`
    ADD CONSTRAINT `molecule_property_ibfk_1` FOREIGN KEY (`mo_id`) REFERENCES `molecule` (`mo_id`) ON UPDATE CASCADE ON DELETE RESTRICT ,
    ADD CONSTRAINT `molecule_property_ibfk_2` FOREIGN KEY (`pr_id`) REFERENCES `property` (`pr_id`) ON UPDATE CASCADE ON DELETE RESTRICT ;

UPDATE `system` SET `sy_version` = "2020-11-04";