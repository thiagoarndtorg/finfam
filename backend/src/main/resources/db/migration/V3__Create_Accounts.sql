CREATE TABLE IF NOT EXISTS accounts (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        user_id INT NOT NULL,
                                        family_id INT NOT NULL,
                                        bank_id INT NOT NULL,
                                        item_id VARCHAR(255) NOT NULL UNIQUE,
                                        name VARCHAR(255),
                                        balance DECIMAL(38,2),
                                        currency VARCHAR(255),
                                        color VARCHAR(255),
                                        is_active TINYINT(1) NOT NULL DEFAULT 1,
                                        CONSTRAINT fk_accounts_user FOREIGN KEY (user_id)
                                            REFERENCES users (id) ON DELETE CASCADE,
                                        CONSTRAINT fk_accounts_family FOREIGN KEY (family_id)
                                            REFERENCES families (id) ON DELETE CASCADE,
                                        CONSTRAINT fk_accounts_bank FOREIGN KEY (bank_id)
                                            REFERENCES banks (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
