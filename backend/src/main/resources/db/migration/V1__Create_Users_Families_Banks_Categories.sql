CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),

    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    google_id VARCHAR(255),


    INDEX idx_verification_token (verification_token),
    INDEX idx_google_id (google_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS families (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        name VARCHAR(255),
    created_by INT NOT NULL,
    KEY(created_by),
    CONSTRAINT fk_families_user FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS banks (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     name VARCHAR(255),
    bank_code VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO banks (name, bank_code)
SELECT 'PICPAY', 380
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'PICPAY' AND bank_code = 380);

INSERT INTO banks (name, bank_code)
SELECT 'INTER', 077
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'INTER' AND bank_code = 077);

INSERT INTO banks (name, bank_code)
SELECT 'UNKNOWN', 000
WHERE NOT EXISTS (SELECT 1 FROM banks WHERE name = 'UNKNOWN' AND bank_code = 000);


CREATE TABLE IF NOT EXISTS categories (
                                          id INT AUTO_INCREMENT PRIMARY KEY,
                                          family_id INT NOT NULL,
                                          name VARCHAR(255),
    icon VARCHAR(255),
    color VARCHAR(255),
    is_income TINYINT(1) NOT NULL DEFAULT 0,
    is_system TINYINT(1) NOT NULL DEFAULT 0,
    UNIQUE KEY (family_id, name),
    CONSTRAINT fk_categories_family FOREIGN KEY (family_id)
    REFERENCES families (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
