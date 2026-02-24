-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 24, 2026 at 12:03 PM
-- Server version: 10.6.18-MariaDB-log
-- PHP Version: 8.3.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
--
--

-- --------------------------------------------------------

--
-- Table structure for table `gw_builds`
--

CREATE TABLE IF NOT EXISTS `gw_builds` (
  `gw_build_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `primary_prof_id` tinyint(3) UNSIGNED NOT NULL,
  `secondary_prof_id` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `skill1_id` int(10) UNSIGNED DEFAULT NULL,
  `skill2_id` int(10) UNSIGNED DEFAULT NULL,
  `skill3_id` int(10) UNSIGNED DEFAULT NULL,
  `skill4_id` int(10) UNSIGNED DEFAULT NULL,
  `skill5_id` int(10) UNSIGNED DEFAULT NULL,
  `skill6_id` int(10) UNSIGNED DEFAULT NULL,
  `skill7_id` int(10) UNSIGNED DEFAULT NULL,
  `skill8_id` int(10) UNSIGNED DEFAULT NULL,
  `buildcode` varchar(64) DEFAULT NULL,
  `skills_hash` binary(32) DEFAULT NULL,
  `attrs_hash` binary(32) DEFAULT NULL,
  PRIMARY KEY (`gw_build_id`),
  KEY `idx_profs` (`primary_prof_id`,`secondary_prof_id`),
  KEY `idx_skill1` (`skill1_id`),
  KEY `idx_skill2` (`skill2_id`),
  KEY `idx_skill3` (`skill3_id`),
  KEY `idx_skill4` (`skill4_id`),
  KEY `idx_skill5` (`skill5_id`),
  KEY `idx_skill6` (`skill6_id`),
  KEY `idx_skill7` (`skill7_id`),
  KEY `idx_skill8` (`skill8_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gw_build_attributes`
--

CREATE TABLE IF NOT EXISTS `gw_build_attributes` (
  `gw_build_id` bigint(20) UNSIGNED NOT NULL,
  `attribute_id` smallint(5) UNSIGNED NOT NULL,
  `points` tinyint(3) UNSIGNED NOT NULL,
  PRIMARY KEY (`gw_build_id`,`attribute_id`),
  KEY `idx_attribute` (`attribute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE IF NOT EXISTS `skills` (
  `id` int(11) NOT NULL,
  `campaign` int(11) DEFAULT NULL,
  `profession` int(11) DEFAULT NULL,
  `attribute` int(11) DEFAULT NULL,
  `elite` tinyint(1) DEFAULT NULL,
  `split` tinyint(1) DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `upkeep` int(11) DEFAULT NULL,
  `energy` int(11) DEFAULT NULL,
  `activation` decimal(10,2) DEFAULT NULL,
  `recharge` int(11) DEFAULT NULL,
  `adrenaline` int(11) DEFAULT NULL,
  `sacrifice` int(11) DEFAULT NULL,
  `overcast` int(11) DEFAULT NULL,
  `name_de` varchar(255) DEFAULT NULL,
  `name_en` varchar(255) DEFAULT NULL,
  `desc_de` text DEFAULT NULL,
  `desc_en` text DEFAULT NULL,
  `concise_de` text DEFAULT NULL,
  `concise_en` text DEFAULT NULL,
  `pvp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pvp`)),
  `pve_only` tinyint(1) DEFAULT 0,
  `pre_searing` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skill_condition_relations`
--

CREATE TABLE IF NOT EXISTS `skill_condition_relations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `skill_id` int(11) NOT NULL,
  `condition_id` int(11) DEFAULT NULL,
  `interaction_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `skill_id` (`skill_id`),
  KEY `condition_id` (`condition_id`),
  KEY `interaction_id` (`interaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `display_name` varchar(32) NOT NULL,
  `public_key_raw` varbinary(32) NOT NULL,
  `public_key_fingerprint` binary(32) NOT NULL,
  `last_seen_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_pub_fpr` (`public_key_fingerprint`),
  KEY `idx_last_seen` (`last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_builds`
--

CREATE TABLE IF NOT EXISTS `user_builds` (
  `user_build_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `gw_build_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `name` varchar(80) NOT NULL,
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `position` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_build_id`),
  KEY `fk_user_builds_gw_build` (`gw_build_id`),
  KEY `idx_owner` (`owner_user_id`,`position`),
  KEY `idx_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_builds_in_containers`
--

CREATE TABLE IF NOT EXISTS `user_builds_in_containers` (
  `user_container_id` bigint(20) UNSIGNED NOT NULL,
  `user_build_id` bigint(20) UNSIGNED NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_container_id`,`user_build_id`),
  KEY `idx_container_position` (`user_container_id`,`position`),
  KEY `idx_build` (`user_build_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_containers`
--

CREATE TABLE IF NOT EXISTS `user_containers` (
  `user_container_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `icon` varchar(120) DEFAULT NULL,
  `color_primary` varchar(20) DEFAULT NULL,
  `color_secondary` varchar(20) DEFAULT NULL,
  `type` enum('build_group','team_build','skill_book','address_book','note_book') NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_container_id`),
  UNIQUE KEY `uniq_user_container_name` (`owner_user_id`,`type`,`name`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_owner_position` (`owner_user_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_container_sections`
--

CREATE TABLE IF NOT EXISTS `user_container_sections` (
  `user_container_section_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_container_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('manual_skills','manual_builds','text','url_list','auto_labels','auto_notes','auto_favorites','auto_builds','friends') NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_container_section_id`),
  KEY `idx_container_position` (`user_container_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_labels`
--

CREATE TABLE IF NOT EXISTS `user_labels` (
  `user_label_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL,
  `color_primary` varchar(20) NOT NULL,
  `color_secondary` varchar(20) DEFAULT NULL,
  `icon` varchar(50) NOT NULL DEFAULT 'fa-tag',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_label_id`),
  UNIQUE KEY `uniq_user_label_name` (`owner_user_id`,`name`),
  KEY `idx_owner` (`owner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_section_items`
--

CREATE TABLE IF NOT EXISTS `user_section_items` (
  `user_section_item_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_container_section_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('skill','build','text') NOT NULL,
  `skill_id` int(11) DEFAULT NULL,
  `user_build_id` bigint(20) UNSIGNED DEFAULT NULL,
  `text_content` text DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_section_item_id`),
  KEY `fk_usi_skill` (`skill_id`),
  KEY `fk_usi_build` (`user_build_id`),
  KEY `idx_section_position` (`user_container_section_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_skill_labels`
--

CREATE TABLE IF NOT EXISTS `user_skill_labels` (
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` int(11) NOT NULL,
  `user_label_id` bigint(20) UNSIGNED NOT NULL,
  PRIMARY KEY (`owner_user_id`,`skill_id`,`user_label_id`),
  KEY `fk_usl_label` (`user_label_id`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_skill` (`skill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_skill_meta`
--

CREATE TABLE IF NOT EXISTS `user_skill_meta` (
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` int(11) NOT NULL,
  `is_favorite` tinyint(1) NOT NULL DEFAULT 0,
  `rating` tinyint(3) UNSIGNED DEFAULT NULL CHECK (`rating` <= 5),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`owner_user_id`,`skill_id`),
  KEY `fk_usm_skill` (`skill_id`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_skill_notes`
--

CREATE TABLE IF NOT EXISTS `user_skill_notes` (
  `user_skill_note_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `skill_id` int(11) NOT NULL,
  `note_text` text NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_skill_note_id`),
  KEY `fk_usn_skill` (`skill_id`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_user_skill_position` (`owner_user_id`,`skill_id`,`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `gw_build_attributes`
--
ALTER TABLE `gw_build_attributes`
  ADD CONSTRAINT `fk_gw_build_attrs_build` FOREIGN KEY (`gw_build_id`) REFERENCES `gw_builds` (`gw_build_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_builds`
--
ALTER TABLE `user_builds`
  ADD CONSTRAINT `fk_user_builds_gw_build` FOREIGN KEY (`gw_build_id`) REFERENCES `gw_builds` (`gw_build_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_builds_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_builds_in_containers`
--
ALTER TABLE `user_builds_in_containers`
  ADD CONSTRAINT `fk_ubic_build` FOREIGN KEY (`user_build_id`) REFERENCES `user_builds` (`user_build_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ubic_container` FOREIGN KEY (`user_container_id`) REFERENCES `user_containers` (`user_container_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_containers`
--
ALTER TABLE `user_containers`
  ADD CONSTRAINT `fk_uc_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_container_sections`
--
ALTER TABLE `user_container_sections`
  ADD CONSTRAINT `fk_ucs_container` FOREIGN KEY (`user_container_id`) REFERENCES `user_containers` (`user_container_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_labels`
--
ALTER TABLE `user_labels`
  ADD CONSTRAINT `fk_ul_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_section_items`
--
ALTER TABLE `user_section_items`
  ADD CONSTRAINT `fk_usi_build` FOREIGN KEY (`user_build_id`) REFERENCES `user_builds` (`user_build_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usi_section` FOREIGN KEY (`user_container_section_id`) REFERENCES `user_container_sections` (`user_container_section_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usi_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skill_labels`
--
ALTER TABLE `user_skill_labels`
  ADD CONSTRAINT `fk_usl_label` FOREIGN KEY (`user_label_id`) REFERENCES `user_labels` (`user_label_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usl_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usl_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skill_meta`
--
ALTER TABLE `user_skill_meta`
  ADD CONSTRAINT `fk_usm_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usm_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_skill_notes`
--
ALTER TABLE `user_skill_notes`
  ADD CONSTRAINT `fk_usn_skill` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usn_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;
