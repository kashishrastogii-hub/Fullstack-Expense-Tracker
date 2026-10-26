-- V2: initial PocketWise schema.
--
-- V1 is an intentional no-op placeholder that may already be applied in existing
-- development databases, so it must not be edited (Flyway checksums). This migration is
-- written to be safe on both empty and already-populated databases:
--
--   * every table is created with CREATE TABLE IF NOT EXISTS
--   * foreign keys are declared inline, so they are only added together with a new table
--   * seed rows for Hibernate's table-based id generators are inserted only when missing
--
-- Names follow Spring Boot's default naming strategies
-- (SpringImplicitNamingStrategy + CamelCaseToUnderscoresNamingStrategy), and types match what
-- Hibernate's MySQLDialect generates. Column lengths for validated fields (for example
-- users.username) come from Bean Validation. The DDL can be regenerated for comparison with
-- backend/src/test/java/com/fullStack/expenseTracker/SchemaDumpTest.java.

CREATE TABLE IF NOT EXISTS users (
    id bigint NOT NULL AUTO_INCREMENT,
    email varchar(255) DEFAULT NULL,
    enabled bit(1) NOT NULL,
    password varchar(255) DEFAULT NULL,
    profile_img_url varchar(255) DEFAULT NULL,
    username varchar(20) DEFAULT NULL,
    verification_code varchar(64) DEFAULT NULL,
    verification_code_expiry_time datetime(6) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username),
    UNIQUE KEY uk_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS roles (
    id int NOT NULL AUTO_INCREMENT,
    name enum ('ROLE_USER', 'ROLE_ADMIN') DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS transaction_type (
    transaction_type_id int NOT NULL AUTO_INCREMENT,
    transaction_type_name enum ('TYPE_EXPENSE', 'TYPE_INCOME') DEFAULT NULL,
    PRIMARY KEY (transaction_type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS category (
    category_id int NOT NULL AUTO_INCREMENT,
    category_name varchar(255) DEFAULT NULL,
    enabled bit(1) NOT NULL,
    transaction_type_id int DEFAULT NULL,
    PRIMARY KEY (category_id),
    KEY fk_category_transaction_type (transaction_type_id),
    CONSTRAINT fk_category_transaction_type
        FOREIGN KEY (transaction_type_id) REFERENCES transaction_type (transaction_type_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS transaction (
    transaction_id bigint NOT NULL AUTO_INCREMENT,
    amount double NOT NULL,
    date date DEFAULT NULL,
    description varchar(255) DEFAULT NULL,
    category_id int DEFAULT NULL,
    user_id bigint DEFAULT NULL,
    PRIMARY KEY (transaction_id),
    KEY fk_transaction_category (category_id),
    KEY fk_transaction_user (user_id),
    CONSTRAINT fk_transaction_category FOREIGN KEY (category_id) REFERENCES category (category_id),
    CONSTRAINT fk_transaction_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id bigint NOT NULL,
    role_id int NOT NULL,
    PRIMARY KEY (user_id, role_id),
    KEY fk_user_roles_role (role_id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS budget (
    budget_id bigint NOT NULL,
    amount double NOT NULL,
    month int NOT NULL,
    user_id bigint NOT NULL,
    year bigint NOT NULL,
    PRIMARY KEY (budget_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS budget_seq (
    next_val bigint DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO budget_seq (next_val)
SELECT 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM budget_seq);

CREATE TABLE IF NOT EXISTS saved_transaction (
    plan_id bigint NOT NULL,
    amount double NOT NULL,
    category_id int NOT NULL,
    description varchar(255) DEFAULT NULL,
    frequency enum ('ONE_TIME', 'DAILY', 'MONTHLY') DEFAULT NULL,
    transaction_type_id int NOT NULL,
    upcoming_date date DEFAULT NULL,
    user_id bigint NOT NULL,
    PRIMARY KEY (plan_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS saved_transaction_seq (
    next_val bigint DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

INSERT INTO saved_transaction_seq (next_val)
SELECT 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM saved_transaction_seq);
