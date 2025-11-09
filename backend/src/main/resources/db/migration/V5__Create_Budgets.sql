CREATE TABLE IF NOT EXISTS budgets (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       family_id INT NOT NULL,
                                       category_id INT DEFAULT NULL,
                                       user_id INT DEFAULT NULL,
                                       budget_type ENUM('CATEGORY','MEMBER') NOT NULL,
                                       amount DECIMAL(38,2) NOT NULL,
                                       month INT DEFAULT NULL,
                                       year INT DEFAULT NULL,
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                       UNIQUE KEY uk_category_budget (family_id, category_id, year, month),
                                       UNIQUE KEY uk_member_budget (family_id, user_id, year, month),
                                       INDEX idx_family_year_month (family_id, year, month),
                                       CONSTRAINT fk_budgets_family FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE,
                                       CONSTRAINT fk_budgets_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
                                       CONSTRAINT fk_budgets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
