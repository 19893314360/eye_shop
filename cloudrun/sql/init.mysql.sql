CREATE DATABASE IF NOT EXISTS `yanjing_dev`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `yanjing_dev`;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `inventory_check_items`;
DROP TABLE IF EXISTS `inventory_check_tasks`;
DROP TABLE IF EXISTS `inventory_movements`;
DROP TABLE IF EXISTS `inventory_items`;
DROP TABLE IF EXISTS `after_sale_records`;
DROP TABLE IF EXISTS `after_sale_applies`;
DROP TABLE IF EXISTS `sales_exchanges`;
DROP TABLE IF EXISTS `sales_returns`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `vision_records`;
DROP TABLE IF EXISTS `purchase_records`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `members`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `app_counters`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `app_counters` (
  `counter_key` VARCHAR(64) NOT NULL,
  `current_value` BIGINT NOT NULL,
  PRIMARY KEY (`counter_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `members` (
  `id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `gender` ENUM('male', 'female', 'unknown') NOT NULL DEFAULT 'unknown',
  `birthday` VARCHAR(20) NOT NULL DEFAULT '',
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_members_mobile` (`mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orders` (
  `id` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `member_id` VARCHAR(32) NOT NULL,
  `member_name` VARCHAR(64) NOT NULL,
  `order_type` ENUM('normal', 'optometry') NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('awaiting_payment', 'ready_delivery', 'completed') NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  `paid_at` BIGINT NULL,
  `delivered_at` BIGINT NULL,
  `pay_channel` ENUM('wechat', 'balance', 'cash') NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_order_no` (`order_no`),
  KEY `idx_orders_member_id` (`member_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `appointments` (
  `id` VARCHAR(32) NOT NULL,
  `customer_name` VARCHAR(64) NOT NULL,
  `mobile` VARCHAR(20) NOT NULL,
  `service_type` ENUM('optometry', 'recheck', 'training') NOT NULL,
  `appointment_date` VARCHAR(10) NOT NULL,
  `appointment_time` VARCHAR(5) NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('pending', 'done') NOT NULL,
  `created_at` BIGINT NOT NULL,
  `arrived_at` BIGINT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appointments_mobile` (`mobile`),
  KEY `idx_appointments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `after_sale_applies` (
  `id` VARCHAR(32) NOT NULL,
  `order_id` VARCHAR(32) NOT NULL,
  `apply_type` ENUM('return', 'exchange', 'repair', 'refund') NOT NULL,
  `reason` VARCHAR(128) NOT NULL,
  `remark` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(20) NOT NULL,
  `images` JSON NOT NULL,
  `status` ENUM('pending', 'followed_up', 'completed') NOT NULL,
  `applicant` VARCHAR(64) NOT NULL,
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_applies_order_id` (`order_id`),
  KEY `idx_after_sale_applies_phone` (`phone`),
  KEY `idx_after_sale_applies_status` (`status`),
  CONSTRAINT `fk_after_sale_applies_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `after_sale_records` (
  `order_id` VARCHAR(32) NOT NULL,
  `followed` TINYINT(1) NOT NULL DEFAULT 0,
  `rechecked` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` BIGINT NOT NULL,
  PRIMARY KEY (`order_id`),
  CONSTRAINT `fk_after_sale_records_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sales_returns` (
  `id` VARCHAR(32) NOT NULL,
  `order_id` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `member_name` VARCHAR(64) NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `reason` VARCHAR(128) NOT NULL,
  `refund_channel` VARCHAR(32) NOT NULL,
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sales_returns_order_id` (`order_id`),
  CONSTRAINT `fk_sales_returns_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sales_exchanges` (
  `id` VARCHAR(32) NOT NULL,
  `order_id` VARCHAR(32) NOT NULL,
  `order_no` VARCHAR(32) NOT NULL,
  `member_name` VARCHAR(64) NOT NULL,
  `original_item` VARCHAR(128) NOT NULL,
  `original_amount` DECIMAL(10, 2) NOT NULL,
  `new_item` VARCHAR(128) NOT NULL,
  `new_item_price` DECIMAL(10, 2) NOT NULL,
  `price_diff` DECIMAL(10, 2) NOT NULL,
  `reason` VARCHAR(128) NOT NULL,
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sales_exchanges_order_id` (`order_id`),
  CONSTRAINT `fk_sales_exchanges_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `vision_records` (
  `id` VARCHAR(32) NOT NULL,
  `member_id` VARCHAR(32) NOT NULL,
  `exam_date` VARCHAR(10) NOT NULL,
  `right_eye` VARCHAR(64) NOT NULL,
  `left_eye` VARCHAR(64) NOT NULL,
  `pd` VARCHAR(16) NOT NULL,
  `suggestion` VARCHAR(255) NOT NULL DEFAULT '',
  `doctor` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vision_records_member_id` (`member_id`),
  CONSTRAINT `fk_vision_records_member_id` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `purchase_records` (
  `id` VARCHAR(32) NOT NULL,
  `record_type` ENUM('order', 'inbound', 'return', 'frame') NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `qty` INT NOT NULL,
  `unit_cost` DECIMAL(10, 2) NOT NULL,
  `supplier` VARCHAR(64) NOT NULL,
  `operator` VARCHAR(64) NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_records_type` (`record_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_items` (
  `id` VARCHAR(32) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `location` VARCHAR(32) NOT NULL,
  `qty` INT NOT NULL,
  `safe_min` INT NOT NULL,
  `safe_max` INT NOT NULL,
  `created_at` BIGINT NOT NULL,
  `updated_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_items_sku` (`sku`),
  KEY `idx_inventory_items_item_name` (`item_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_movements` (
  `id` VARCHAR(32) NOT NULL,
  `item_id` VARCHAR(32) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `action_type` VARCHAR(32) NOT NULL,
  `qty_change` INT NOT NULL,
  `before_qty` INT NOT NULL,
  `after_qty` INT NOT NULL,
  `operator` VARCHAR(64) NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `related_id` VARCHAR(32) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_movements_item_id` (`item_id`),
  KEY `idx_inventory_movements_created_at` (`created_at`),
  CONSTRAINT `fk_inventory_movements_item_id` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_check_tasks` (
  `id` VARCHAR(32) NOT NULL,
  `scope` ENUM('all', 'low', 'high', 'location') NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `status` ENUM('ongoing', 'done') NOT NULL,
  `operator` VARCHAR(64) NOT NULL,
  `created_at` BIGINT NOT NULL,
  `completed_at` BIGINT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_check_tasks_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `inventory_check_items` (
  `id` VARCHAR(32) NOT NULL,
  `task_id` VARCHAR(32) NOT NULL,
  `inventory_item_id` VARCHAR(32) NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `item_name` VARCHAR(128) NOT NULL,
  `location` VARCHAR(32) NOT NULL,
  `system_qty` INT NOT NULL,
  `actual_qty` INT NULL,
  `difference_qty` INT NULL,
  `status` ENUM('pending', 'done', 'difference') NOT NULL,
  `note` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` BIGINT NOT NULL,
  `updated_at` BIGINT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_check_items_task_id` (`task_id`),
  KEY `idx_inventory_check_items_status` (`status`),
  KEY `idx_inventory_check_items_inventory_item_id` (`inventory_item_id`),
  CONSTRAINT `fk_inventory_check_items_task_id` FOREIGN KEY (`task_id`) REFERENCES `inventory_check_tasks` (`id`),
  CONSTRAINT `fk_inventory_check_items_inventory_item_id` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `settings` (
  `id` TINYINT NOT NULL,
  `payload` JSON NOT NULL,
  `updated_at` BIGINT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
