SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET AUTOCOMMIT = 0;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `guacamoleDb`
--

-- --------------------------------------------------------

--
-- Structure de la table `server_informations`
--

DROP TABLE IF EXISTS `server_informations`;
CREATE TABLE IF NOT EXISTS `server_informations` (
  `key` varchar(16) COLLATE utf8_bin NOT NULL,
  `value` varchar(16) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `category`
--

DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `ca_id` int(11) NOT NULL AUTO_INCREMENT,
  `ca_name` varchar(64) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`ca_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `class`
--

DROP TABLE IF EXISTS `class`;
CREATE TABLE IF NOT EXISTS `class` (
  `cl_id` int(11) NOT NULL AUTO_INCREMENT,
  `cl_name` varchar(128) COLLATE utf8_bin NOT NULL,
  `cl_higher` int(11) DEFAULT NULL,
  `cl_level` int(11) DEFAULT NULL,
  PRIMARY KEY (`cl_id`),
  KEY `cl_higher` (`cl_higher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `duel`
--

DROP TABLE IF EXISTS `duel`;
CREATE TABLE IF NOT EXISTS `duel` (
  `du_id` int(11) NOT NULL,
  `du_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`du_content`)),
  `du_currentRound` int(11) NOT NULL,
  PRIMARY KEY (`du_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `molecule`
--

DROP TABLE IF EXISTS `molecule`;
CREATE TABLE IF NOT EXISTS `molecule` (
  `mo_id` int(11) NOT NULL AUTO_INCREMENT,
  `mo_dci` varchar(128) COLLATE utf8_bin NOT NULL,
  `mo_difficulty` int(11) NOT NULL DEFAULT 0,
  `mo_skeletal_formula` varchar(64) COLLATE utf8_bin NOT NULL,
  `mo_ntr` tinyint(1) NOT NULL,
  `mo_class` int(11) DEFAULT NULL,
  `mo_system` int(11) DEFAULT NULL,
  PRIMARY KEY (`mo_id`),
  KEY `mo_class` (`mo_class`),
  KEY `mo_system` (`mo_system`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

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

-- --------------------------------------------------------

--
-- Structure de la table `property`
--

DROP TABLE IF EXISTS `property`;
CREATE TABLE IF NOT EXISTS `property` (
  `pr_id` int(11) NOT NULL AUTO_INCREMENT,
  `pr_name` varchar(256) COLLATE utf8_bin NOT NULL,
  `pr_category` int(11) NOT NULL,
  PRIMARY KEY (`pr_id`),
  UNIQUE KEY `pr_name` (`pr_name`,`pr_category`),
  KEY `pr_category` (`pr_category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `results`
--

DROP TABLE IF EXISTS `results`;
CREATE TABLE IF NOT EXISTS `results` (
  `us_login` varchar(32) COLLATE utf8_bin NOT NULL,
  `du_id` int(11) NOT NULL,
  `re_answers` text COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`us_login`,`du_id`),
  KEY `du_id` (`du_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `system`
--

DROP TABLE IF EXISTS `system`;
CREATE TABLE IF NOT EXISTS `system` (
  `sy_id` int(11) NOT NULL AUTO_INCREMENT,
  `sy_name` varchar(128) COLLATE utf8_bin NOT NULL,
  `sy_higher` int(11) DEFAULT NULL,
  `sy_level` int(11) DEFAULT NULL,
  PRIMARY KEY (`sy_id`),
  KEY `sy_higher` (`sy_higher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `us_login` varchar(32) COLLATE utf8_bin NOT NULL,
  `us_wins` int(11) DEFAULT NULL,
  `us_losts` int(11) DEFAULT NULL,
  PRIMARY KEY (`us_login`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `class`
--
ALTER TABLE `class`
  ADD CONSTRAINT `class_ibfk_1` FOREIGN KEY (`cl_higher`) REFERENCES `class` (`cl_id`);

--
-- Contraintes pour la table `molecule`
--
ALTER TABLE `molecule`
  ADD CONSTRAINT `molecule_ibfk_1` FOREIGN KEY (`mo_class`) REFERENCES `class` (`cl_id`),
  ADD CONSTRAINT `molecule_ibfk_2` FOREIGN KEY (`mo_system`) REFERENCES `system` (`sy_id`);

--
-- Contraintes pour la table `molecule_property`
--
ALTER TABLE `molecule_property`
  ADD CONSTRAINT `molecule_property_ibfk_1` FOREIGN KEY (`mo_id`) REFERENCES `molecule` (`mo_id`),
  ADD CONSTRAINT `molecule_property_ibfk_2` FOREIGN KEY (`pr_id`) REFERENCES `property` (`pr_id`);

--
-- Contraintes pour la table `property`
--
ALTER TABLE `property`
  ADD CONSTRAINT `property_ibfk_1` FOREIGN KEY (`pr_category`) REFERENCES `category` (`ca_id`);

--
-- Contraintes pour la table `results`
--
ALTER TABLE `results`
  ADD CONSTRAINT `results_ibfk_1` FOREIGN KEY (`us_login`) REFERENCES `user` (`us_login`),
  ADD CONSTRAINT `results_ibfk_2` FOREIGN KEY (`du_id`) REFERENCES `duel` (`du_id`);

--
-- Contraintes pour la table `system`
--
ALTER TABLE `system`
  ADD CONSTRAINT `system_ibfk_1` FOREIGN KEY (`sy_higher`) REFERENCES `system` (`sy_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

SET AUTOCOMMIT = 1;

INSERT INTO `server_informations` (`key`, `value`)
VALUES ('api_version', '2021-01-08');
