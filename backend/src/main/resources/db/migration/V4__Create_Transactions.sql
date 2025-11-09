CREATE TABLE IF NOT EXISTS transactions (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            account_id INT NOT NULL,
                                            user_id INT NOT NULL,
                                            family_id INT NOT NULL,
                                            category_id INT DEFAULT NULL,
                                            amount DECIMAL(38,2),
                                            description VARCHAR(255) NOT NULL,
                                            transaction_date DATE NOT NULL,
                                            transaction_type VARCHAR(255),
                                            pluggy_id VARCHAR(255) NOT NULL UNIQUE,
                                            KEY idx_transaction_date (transaction_date),
                                            KEY idx_transaction_type (transaction_type),
                                            CONSTRAINT fk_transactions_account FOREIGN KEY (account_id)
                                                REFERENCES accounts (id) ON DELETE CASCADE,
                                            CONSTRAINT fk_transactions_user FOREIGN KEY (user_id)
                                                REFERENCES users (id) ON DELETE CASCADE,
                                            CONSTRAINT fk_transactions_family FOREIGN KEY (family_id)
                                                REFERENCES families (id) ON DELETE CASCADE,
                                            CONSTRAINT fk_transactions_category FOREIGN KEY (category_id)
                                                REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
