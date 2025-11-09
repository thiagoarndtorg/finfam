CREATE TABLE IF NOT EXISTS family_members (
                                              id INT AUTO_INCREMENT PRIMARY KEY,
                                              family_id INT NOT NULL,
                                              user_id INT NOT NULL,
                                              role ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
                                              status ENUM('ACTIVE','INACTIVE','PENDING') DEFAULT 'PENDING',
                                              UNIQUE KEY (family_id, user_id),
                                              KEY (user_id),
                                              CONSTRAINT fk_family_members_family FOREIGN KEY (family_id)
                                                  REFERENCES families (id) ON DELETE CASCADE,
                                              CONSTRAINT fk_family_members_user FOREIGN KEY (user_id)
                                                  REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;