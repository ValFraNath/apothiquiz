-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le :  sam. 17 oct. 2020 à 18:35
-- Version du serveur :  5.7.24
-- Version de PHP :  7.2.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `glowingOctoGuacamole`
--

-- --------------------------------------------------------

--
-- Structure de la table `class`
--

DROP TABLE IF EXISTS `class`;
CREATE TABLE IF NOT EXISTS `class` (
  `cl_id` int(11) NOT NULL AUTO_INCREMENT,
  `cl_name` varchar(256) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`cl_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Déchargement des données de la table `class`
--

INSERT INTO `class` (`cl_id`, `cl_name`) VALUES
(1, 'antiMalDeCrane');

-- --------------------------------------------------------

--
-- Structure de la table `molecule`
--

DROP TABLE IF EXISTS `molecule`;
CREATE TABLE IF NOT EXISTS `molecule` (
  `mo_ID` int(11) NOT NULL AUTO_INCREMENT,
  `mo_name` varchar(256) COLLATE utf8_bin NOT NULL,
  `mo_dci` varchar(128) COLLATE utf8_bin NOT NULL,
  `mo_difficulty` int(2) NOT NULL,
  `mo_skeletal_formula` varchar(64) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`mo_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Déchargement des données de la table `molecule`
--

INSERT INTO `molecule` (`mo_ID`, `mo_name`, `mo_dci`, `mo_difficulty`, `mo_skeletal_formula`) VALUES
(1, 'paracétamol', 'acétaminophène', 1, 'C8H9NO2');

-- --------------------------------------------------------

--
-- Structure de la table `molecule_class`
--

DROP TABLE IF EXISTS `molecule_class`;
CREATE TABLE IF NOT EXISTS `molecule_class` (
  `mo_id` int(11) NOT NULL,
  `cl_id` int(11) NOT NULL,
  PRIMARY KEY (`mo_id`,`cl_id`),
  KEY `cl_id` (`cl_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Déchargement des données de la table `molecule_class`
--

INSERT INTO `molecule_class` (`mo_id`, `cl_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `molecule_property`
--

DROP TABLE IF EXISTS `molecule_property`;
CREATE TABLE IF NOT EXISTS `molecule_property` (
  `mo_id` int(11) NOT NULL,
  `pr_id` int(11) NOT NULL,
  PRIMARY KEY (`mo_id`,`pr_id`),
  KEY `pr_id` (`pr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Déchargement des données de la table `molecule_property`
--

INSERT INTO `molecule_property` (`mo_id`, `pr_id`) VALUES
(1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `property`
--

DROP TABLE IF EXISTS `property`;
CREATE TABLE IF NOT EXISTS `property` (
  `pr_id` int(11) NOT NULL AUTO_INCREMENT,
  `pr_name` varchar(256) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`pr_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Déchargement des données de la table `property`
--

INSERT INTO `property` (`pr_id`, `pr_name`) VALUES
(1, 'faitDormir');

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `molecule_class`
--
ALTER TABLE `molecule_class`
  ADD CONSTRAINT `molecule_class_ibfk_1` FOREIGN KEY (`mo_id`) REFERENCES `molecule` (`mo_ID`),
  ADD CONSTRAINT `molecule_class_ibfk_2` FOREIGN KEY (`cl_id`) REFERENCES `class` (`cl_id`);

--
-- Contraintes pour la table `molecule_property`
--
ALTER TABLE `molecule_property`
  ADD CONSTRAINT `molecule_property_ibfk_1` FOREIGN KEY (`mo_id`) REFERENCES `molecule` (`mo_ID`),
  ADD CONSTRAINT `molecule_property_ibfk_2` FOREIGN KEY (`pr_id`) REFERENCES `property` (`pr_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
