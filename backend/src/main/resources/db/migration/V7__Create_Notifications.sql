CREATE TABLE IF NOT EXISTS notifications (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             family_id INT NOT NULL,
                                             user_id INT DEFAULT NULL,
                                             category_id INT DEFAULT NULL,
                                             budget_id INT DEFAULT NULL,
                                             notification_type ENUM('BUDGET_EXCEEDED') NOT NULL,
                                             title VARCHAR(255) NOT NULL,
                                             message TEXT NOT NULL,
                                             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                             metadata JSON DEFAULT NULL,
                                             INDEX idx_family_created (family_id, created_at),
                                             INDEX idx_notification_type (notification_type),
                                             INDEX idx_budget_id (budget_id),
                                             CONSTRAINT fk_notifications_family FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE,
                                             CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
                                             CONSTRAINT fk_notifications_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
                                             CONSTRAINT fk_notifications_budget FOREIGN KEY (budget_id) REFERENCES budgets (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

