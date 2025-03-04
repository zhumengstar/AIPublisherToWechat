/*
 Navicat Premium Dump SQL

 Source Server         : 107.173.152.50
 Source Server Type    : MySQL
 Source Server Version : 80403 (8.4.3)
 Source Host           : 107.173.152.50:3306
 Source Schema         : trendfind

 Target Server Type    : MySQL
 Target Server Version : 80403 (8.4.3)
 File Encoding         : 65001

 Date: 27/02/2025 16:40:12
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for cron_sources
-- ----------------------------
DROP TABLE IF EXISTS `cron_sources`;
CREATE TABLE `cron_sources`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `NewsType` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `NewsPlatform` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `identifier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
