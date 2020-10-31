INSERT IGNORE INTO class (cl_id, cl_name)
VALUES
(1, 'virus de la grippe'),
(2, 'heprès'),
(3, 'VIH'),
(4, 'anticonvulsivants');

INSERT IGNORE INTO molecule (mo_ID, mo_dci, mo_difficulty, mo_skeletal_formula)
VALUES
(1, 'amantadine', 1, 'C10H17N'),
(2, 'oseltamivir', 1, 'C16H28N2O4'),
(3, 'aciclovir', 1, 'C8H11N5O3'),
(4, 'valganciclovir', 1, 'C14H22N6O5'),
(5, 'efavirenz', 1, 'C14H9CIF3NO2'),
(6, 'zidovudine', 1, 'C10H13N5O4'),
(7, 'lamotrigine',  1, 'C9H7CI2N5'),
(8, 'phénytoïne',  1, 'C15H12N2O2');

INSERT IGNORE INTO `molecule_class` (`mo_id`, `cl_id`)
VALUES
(1, 1),
(2, 1),
(3, 2),
(4, 2),
(5, 3),
(6, 3),
(7, 4),
(8, 4);

INSERT IGNORE INTO `property` (`pr_id`, `pr_name`)
VALUES
(1, "médicaments à l'origine d'une hypotension orthostatique"),
(2, "médicaments néphrotoxiques"),
(3, "inducteurs enzymatiques");

INSERT IGNORE INTO `molecule_property` (`mo_id`, `pr_id`)
VALUES
(1, 1),
(3, 2),
(4, 2),
(5, 3);

INSERT IGNORE INTO `user` (`us_login`)
VALUES
('fpoguet'),
('vperignon'),
('nhoun');
