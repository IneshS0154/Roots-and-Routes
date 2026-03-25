import pool from './db.js';
import logger from './logger.js';

/**
 * Auto-creates all application tables if they don't already exist.
 * Safe to run on every server start (uses IF NOT EXISTS).
 */
export async function initDb() {
  let connection;
  try {
    connection = await pool.getConnection();
    logger.info('Running DB initialisation – verifying tables…');

    // ── admin ───────────────────────────────────────────────────────────────
    // Must be created first – no foreign-key dependencies.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        email      VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        name       VARCHAR(150) NOT NULL DEFAULT 'Admin',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: admin');

    // Seed a default admin account (password: admin123) if the table is empty
    const [adminRows] = await connection.query('SELECT COUNT(*) AS cnt FROM admin');
    if (adminRows[0].cnt === 0) {
      await connection.query(
        `INSERT INTO admin (email, password, name) VALUES ('admin@rootsroutes.com', 'admin123', 'Platform Admin')`
      );
      logger.info('Seeded default admin: admin@rootsroutes.com / admin123');
    }

    // ── users (customers) ───────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        email      VARCHAR(255) NOT NULL UNIQUE,
        password   VARCHAR(255) NOT NULL,
        name       VARCHAR(150) NOT NULL,
        phone      VARCHAR(30)  DEFAULT NULL,
        city       VARCHAR(100) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: users');

    // ── farmer ──────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS farmer (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        email           VARCHAR(255) NOT NULL UNIQUE,
        password        VARCHAR(255) NOT NULL,
        name            VARCHAR(150) NOT NULL,
        phone           VARCHAR(30)  DEFAULT NULL,
        farm_location   VARCHAR(255) DEFAULT NULL,
        farm_size       VARCHAR(100) DEFAULT NULL,
        crops_produced  VARCHAR(255) DEFAULT NULL,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: farmer');

    // ── driver ──────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS driver (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        email          VARCHAR(255) NOT NULL UNIQUE,
        password       VARCHAR(255) NOT NULL,
        name           VARCHAR(150) NOT NULL,
        phone          VARCHAR(30)  DEFAULT NULL,
        city           VARCHAR(100) DEFAULT NULL,
        license_number VARCHAR(50)  DEFAULT NULL,
        vehicle_number VARCHAR(50)  DEFAULT NULL,
        vehicle_type   VARCHAR(80)  DEFAULT NULL,
        created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: driver');

    // ── farmer_products ────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS farmer_products (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        farmer_id   INT NOT NULL,
        name        VARCHAR(150) NOT NULL,
        category    VARCHAR(80)  NOT NULL DEFAULT 'General',
        unit        VARCHAR(20)  NOT NULL DEFAULT 'kg',
        price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        description TEXT,
        is_organic  TINYINT(1) NOT NULL DEFAULT 0,
        is_active   TINYINT(1) NOT NULL DEFAULT 1,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_fp_farmer
          FOREIGN KEY (farmer_id) REFERENCES farmer(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: farmer_products');

    // ── safe column migrations (run on existing tables too) ─────────────────
    // Add is_organic if the column doesn't exist yet
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'farmer_products' AND COLUMN_NAME = 'is_organic'
    `);
    if (cols.length === 0) {
      await connection.query(
        `ALTER TABLE farmer_products ADD COLUMN is_organic TINYINT(1) NOT NULL DEFAULT 0 AFTER description`
      );
      logger.info('Migration: added is_organic column to farmer_products');
    }

    // ── farmer_inventory ───────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS farmer_inventory (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        product_id   INT NOT NULL,
        farmer_id    INT NOT NULL,
        quantity     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        harvest_date DATE,
        expiry_date  DATE,
        updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_fi_product
          FOREIGN KEY (product_id) REFERENCES farmer_products(id) ON DELETE CASCADE,
        CONSTRAINT fk_fi_farmer
          FOREIGN KEY (farmer_id)  REFERENCES farmer(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: farmer_inventory');

    // ── orders ──────────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        customer_id     INT NOT NULL,
        status          ENUM('Pending','Processing','Out for Delivery','Delivered','Cancelled')
                        NOT NULL DEFAULT 'Pending',
        payment_method  ENUM('cash','card') NOT NULL DEFAULT 'cash',
        payment_status  ENUM('Unpaid','Paid') NOT NULL DEFAULT 'Unpaid',
        total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        delivery_address TEXT,
        notes           TEXT,
        created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_order_customer
          FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: orders');

    // ── order_items ──────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        order_id    INT NOT NULL,
        product_id  INT NOT NULL,
        farmer_id   INT NOT NULL,
        quantity    DECIMAL(10,2) NOT NULL,
        unit_price  DECIMAL(10,2) NOT NULL,
        subtotal    DECIMAL(12,2) NOT NULL,
        CONSTRAINT fk_oi_order
          FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_oi_product
          FOREIGN KEY (product_id) REFERENCES farmer_products(id),
        CONSTRAINT fk_oi_farmer
          FOREIGN KEY (farmer_id)  REFERENCES farmer(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: order_items');

    // ── Idempotent: add city to users (customers) ───────────────────────────
    await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL
    `).catch(() =>
      connection.query(`
        ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL
      `).catch(() => {}) // already exists
    );
    logger.info('Column ensured: users.city');

    // ── Idempotent: add city to driver ──────────────────────────────────────
    await connection.query(`
      ALTER TABLE driver
      ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL
    `).catch(() =>
      connection.query(`
        ALTER TABLE driver ADD COLUMN city VARCHAR(100) DEFAULT NULL
      `).catch(() => {})
    );
    logger.info('Column ensured: driver.city');

    // ── Idempotent: add driver_id + city to orders ──────────────────────────
    await connection.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS driver_id INT DEFAULT NULL
    `).catch(() =>
      connection.query(`
        ALTER TABLE orders ADD COLUMN driver_id INT DEFAULT NULL
      `).catch(() => {})
    );
    await connection.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL
    `).catch(() =>
      connection.query(`
        ALTER TABLE orders ADD COLUMN city VARCHAR(100) DEFAULT NULL
      `).catch(() => {})
    );
    logger.info('Columns ensured: orders.driver_id, orders.city');

    // ── farmer_notifications ────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS farmer_notifications (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        farmer_id   INT NOT NULL,
        sent_by     INT,
        subject     VARCHAR(255) NOT NULL,
        message     TEXT NOT NULL,
        is_urgent   TINYINT(1) NOT NULL DEFAULT 1,
        is_read     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fn_farmer
          FOREIGN KEY (farmer_id) REFERENCES farmer(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: farmer_notifications');

    // ── product_reviews ─────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        order_id     INT NOT NULL,
        product_id   INT NOT NULL,
        farmer_id    INT NOT NULL,
        customer_id  INT NOT NULL,
        rating       TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment      TEXT,
        created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_order_product_review (order_id, product_id),
        CONSTRAINT fk_rev_product  FOREIGN KEY (product_id)  REFERENCES farmer_products(id) ON DELETE CASCADE,
        CONSTRAINT fk_rev_farmer   FOREIGN KEY (farmer_id)   REFERENCES farmer(id) ON DELETE CASCADE,
        CONSTRAINT fk_rev_customer FOREIGN KEY (customer_id) REFERENCES users(id)  ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: product_reviews');

    // ── review_deletion_requests ────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS review_deletion_requests (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        review_id   INT NOT NULL,
        farmer_id   INT NOT NULL,
        reason      TEXT,
        status      ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME DEFAULT NULL,
        CONSTRAINT fk_rdr_review  FOREIGN KEY (review_id)  REFERENCES product_reviews(id) ON DELETE CASCADE,
        CONSTRAINT fk_rdr_farmer  FOREIGN KEY (farmer_id)  REFERENCES farmer(id)          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: review_deletion_requests');

    // ── chat_sessions (chatbot / dispute) ───────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        subject     VARCHAR(255) NOT NULL DEFAULT 'General Enquiry',
        status      ENUM('Open','Under Review','Resolved','Closed') NOT NULL DEFAULT 'Open',
        is_complaint TINYINT(1) NOT NULL DEFAULT 0,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cs_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: chat_sessions');

    // ── chat_messages ────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        session_id  INT NOT NULL,
        sender_type ENUM('customer','bot','admin') NOT NULL DEFAULT 'customer',
        message     TEXT NOT NULL,
        created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    logger.info('Table verified: chat_messages');

    logger.info('DB init complete – all tables verified ✓');

  } catch (err) {
    logger.error('DB init failed', { error: err.message, stack: err.stack });
    throw err;
  } finally {
    if (connection) connection.release();
  }
}
