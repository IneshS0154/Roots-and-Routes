import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import logger, { requestLogger } from './logger.js';
import { initDb } from './initDb.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const LOGIN_TABLES = {
  customer: 'users',
  farmer: 'farmer',
  driver: 'driver',
  admin: 'admin',
};
const SIGNUP_TABLES = {
  customer: 'users',
  farmer: 'farmer',
  driver: 'driver',
};

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);               // log every HTTP request/response

// ── Utility ─────────────────────────────────────────────────────────────────
/** Central error responder – logs and sends JSON 500 */
function handleError(res, error, context = 'API') {
  logger.error(`${context} error`, { message: error.message, stack: error.stack });
  res.status(500).json({ success: false, error: error.message });
}

// ════════════════════════════════════════════════════════════════════════════
// GENERAL / DIAGNOSTIC ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    logger.info('DB connection test OK');
    res.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    handleError(res, error, 'test-connection');
  }
});

app.get('/api/tables', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [tables] = await connection.query('SHOW TABLES');
    res.json({ success: true, tables });
  } catch (error) {
    handleError(res, error, 'GET /api/tables');
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/table-structure/:tableName', async (req, res) => {
  let connection;
  try {
    const { tableName } = req.params;
    connection = await pool.getConnection();
    const [columns] = await connection.query(`DESCRIBE ${tableName}`);
    res.json({ success: true, table: tableName, columns });
  } catch (error) {
    handleError(res, error, 'GET /api/table-structure');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.post('/api/login', async (req, res) => {
  let connection;
  try {
    const { email, password, userType } = req.body;
    if (!email || !password || !userType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const tableName = LOGIN_TABLES[userType];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Invalid user type' });
    }
    connection = await pool.getConnection();
    const [rows] = await connection.query(`SELECT * FROM ${tableName} WHERE email = ?`, [email]);
    if (rows.length === 0) {
      logger.warn(`Login failed – user not found: ${email} (${userType})`);
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    const user = rows[0];
    if (user.password !== password) {
      logger.warn(`Login failed – wrong password for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }
    logger.info(`Login success: ${email} (${userType})`);
    res.json({ success: true, message: 'Login successful', user });
  } catch (error) {
    handleError(res, error, 'POST /api/login');
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/register', async (req, res) => {
  let connection;
  try {
    const { email, password, firstName, lastName, phone, city, userType } = req.body;
    if (!email || !password || !firstName || !lastName || !phone || !userType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const tableName = SIGNUP_TABLES[userType];
    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Only customer, farmer, and driver can sign up' });
    }
    const name = `${firstName} ${lastName}`.trim();
    connection = await pool.getConnection();
    const [existingRows] = await connection.query(
      `SELECT id FROM ${tableName} WHERE email = ? LIMIT 1`, [email]
    );
    if (existingRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
    const normalizedCity = city ? city.trim() : null;
    if (userType === 'customer') {
      await connection.query(
        `INSERT INTO users (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)`,
        [email, password, name, phone, normalizedCity]
      );
    } else if (userType === 'farmer') {
      await connection.query(
        `INSERT INTO farmer (email, password, name, phone) VALUES (?, ?, ?, ?)`,
        [email, password, name, phone]
      );
    } else if (userType === 'driver') {
      await connection.query(
        `INSERT INTO driver (email, password, name, phone, city) VALUES (?, ?, ?, ?, ?)`,
        [email, password, name, phone, normalizedCity]
      );
    }
    logger.info(`New ${userType} registered: ${email} (city: ${normalizedCity})`);
    return res.status(201).json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    handleError(res, error, 'POST /api/register');
  } finally {
    if (connection) connection.release();
  }
});


// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ════════════════════════════════════════════════════════════════════════════

app.get('/api/admin/users', async (req, res) => {
  let connection;
  try {
    const { role = 'all' } = req.query;
    const allowedRoles = ['all', 'farmer', 'user', 'driver'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role filter' });
    }
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT id, name, email, phone, 'farmer' AS role, 'Active' AS status FROM farmer
      UNION ALL
      SELECT id, name, email, phone, 'user'   AS role, 'Active' AS status FROM users
      UNION ALL
      SELECT id, name, email, phone, 'driver' AS role, 'Active' AS status FROM driver
    `);
    const normalizedUsers = rows
      .map(u => ({ ...u, userId: `${u.role.toUpperCase()}-${String(u.id).padStart(3, '0')}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const filteredUsers = role === 'all' ? normalizedUsers : normalizedUsers.filter(u => u.role === role);
    const counts = {
      total: normalizedUsers.length,
      farmer: normalizedUsers.filter(u => u.role === 'farmer').length,
      user:   normalizedUsers.filter(u => u.role === 'user').length,
      driver: normalizedUsers.filter(u => u.role === 'driver').length,
    };
    return res.json({ success: true, users: filteredUsers, counts });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/users');
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/admin/users', async (req, res) => {
  let connection;
  try {
    const { role, email, password, firstName, lastName, phone, farmLocation, farmSize, cropsProduced, licenseNumber, vehicleNumber, vehicleType } = req.body;
    if (!role || !email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!['user', 'farmer', 'driver'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const tableName = role === 'user' ? 'users' : role;
    const name = `${firstName} ${lastName}`.trim();
    connection = await pool.getConnection();
    const [existingRows] = await connection.query(`SELECT id FROM ${tableName} WHERE email = ? LIMIT 1`, [email]);
    if (existingRows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists for this role' });
    }
    if (role === 'user') {
      await connection.query('INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)', [email, password, name, phone]);
    } else if (role === 'farmer') {
      await connection.query(
        'INSERT INTO farmer (email, password, name, phone, farm_location, farm_size, crops_produced) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, password, name, phone, farmLocation || null, farmSize || null, cropsProduced || null]
      );
    } else if (role === 'driver') {
      await connection.query(
        'INSERT INTO driver (email, password, name, phone, license_number, vehicle_number, vehicle_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [email, password, name, phone, licenseNumber || null, vehicleNumber || null, vehicleType || null]
      );
    }
    logger.info(`Admin created ${role}: ${email}`);
    return res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    handleError(res, error, 'POST /api/admin/users');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// FARMER – PRODUCTS
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/farmer/products?farmer_id=X  – list all products for a farmer */
app.get('/api/farmer/products', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT fp.*, COALESCE(fi.quantity, 0) AS quantity
       FROM farmer_products fp
       LEFT JOIN farmer_inventory fi ON fi.product_id = fp.id
       WHERE fp.farmer_id = ? AND fp.is_active = 1
       ORDER BY fp.created_at DESC`,
      [farmer_id]
    );
    logger.info(`GET products for farmer ${farmer_id} – ${rows.length} rows`);
    res.json({ success: true, products: rows });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/products');
  } finally {
    if (connection) connection.release();
  }
});

/** POST /api/farmer/products  – add a new product (also seeds inventory row) */
app.post('/api/farmer/products', async (req, res) => {
  let connection;
  try {
    const { farmer_id, name, category, unit, price, description, is_organic } = req.body;
    if (!farmer_id || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'farmer_id, name and price are required' });
    }
    connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO farmer_products (farmer_id, name, category, unit, price, description, is_organic)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, name, category || 'General', unit || 'kg', price, description || null, is_organic ? 1 : 0]
    );
    const productId = result.insertId;
    // seed an inventory row with qty=0
    await connection.query(
      `INSERT INTO farmer_inventory (product_id, farmer_id, quantity) VALUES (?, ?, 0)`,
      [productId, farmer_id]
    );
    logger.info(`Farmer ${farmer_id} added product "${name}" (id=${productId}, organic=${!!is_organic})`);
    res.status(201).json({ success: true, message: 'Product added', productId });
  } catch (error) {
    handleError(res, error, 'POST /api/farmer/products');
  } finally {
    if (connection) connection.release();
  }
});

/** PUT /api/farmer/products/:id  – update product details */
app.put('/api/farmer/products/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, category, unit, price, description, is_organic } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'name and price are required' });
    }
    connection = await pool.getConnection();
    await connection.query(
      `UPDATE farmer_products SET name=?, category=?, unit=?, price=?, description=?, is_organic=? WHERE id=?`,
      [name, category || 'General', unit || 'kg', price, description || null, is_organic ? 1 : 0, id]
    );
    logger.info(`Product ${id} updated`);
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    handleError(res, error, `PUT /api/farmer/products/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

/** DELETE /api/farmer/products/:id  – soft-delete (set is_active=0) */
app.delete('/api/farmer/products/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();
    await connection.query(`UPDATE farmer_products SET is_active = 0 WHERE id = ?`, [id]);
    logger.info(`Product ${id} soft-deleted`);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    handleError(res, error, `DELETE /api/farmer/products/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC – CUSTOMER-FACING PRODUCT ENDPOINTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/products
 * All active products across all farmers, joined with current inventory.
 * Supports ?category=X, ?organic=1, ?search=q, ?sort=price_asc|price_desc|name
 */
app.get('/api/products', async (req, res) => {
  let connection;
  try {
    const { category, organic, search, sort } = req.query;
    let where = `fp.is_active = 1`;
    const params = [];
    if (category && category !== 'All') { where += ` AND fp.category = ?`; params.push(category); }
    if (organic === '1') { where += ` AND fp.is_organic = 1`; }
    if (search) { where += ` AND fp.name LIKE ?`; params.push(`%${search}%`); }

    const orderMap = {
      price_asc:  'fp.price ASC',
      price_desc: 'fp.price DESC',
      name:       'fp.name ASC',
    };
    const orderBy = orderMap[sort] || 'fp.name ASC';

    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT fp.id, fp.name, fp.category, fp.unit, fp.price, fp.description, fp.is_organic,
              COALESCE(fi.quantity, 0) AS quantity,
              fi.harvest_date, fi.expiry_date,
              f.name AS farmer_name, f.id AS farmer_id, f.farm_location
       FROM farmer_products fp
       LEFT JOIN farmer_inventory fi ON fi.product_id = fp.id
       LEFT JOIN farmer           f  ON f.id = fp.farmer_id
       WHERE ${where}
       ORDER BY ${orderBy}`,
      params
    );
    res.json({ success: true, products: rows });
  } catch (error) {
    handleError(res, error, 'GET /api/products');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/products/random?limit=8
 * Returns a random subset of active products for the "Recommended For You" section.
 */
app.get('/api/products/random', async (req, res) => {
  let connection;
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT fp.id, fp.name, fp.category, fp.unit, fp.price, fp.is_organic,
              COALESCE(fi.quantity, 0) AS quantity,
              fi.harvest_date, fi.expiry_date,
              f.name AS farmer_name, f.id AS farmer_id, f.farm_location
       FROM farmer_products fp
       LEFT JOIN farmer_inventory fi ON fi.product_id = fp.id
       LEFT JOIN farmer           f  ON f.id = fp.farmer_id
       WHERE fp.is_active = 1
       ORDER BY RAND()
       LIMIT ?`,
      [limit]
    );
    res.json({ success: true, products: rows });
  } catch (error) {
    handleError(res, error, 'GET /api/products/random');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/products/:id  – single product detail with full inventory info
 */
app.get('/api/products/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT fp.id, fp.name, fp.category, fp.unit, fp.price, fp.description, fp.is_organic,
              COALESCE(fi.quantity, 0)  AS quantity,
              fi.harvest_date, fi.expiry_date,
              f.name AS farmer_name, f.id AS farmer_id, f.farm_location, f.phone
       FROM farmer_products fp
       LEFT JOIN farmer_inventory fi ON fi.product_id = fp.id
       LEFT JOIN farmer           f  ON f.id = fp.farmer_id
       WHERE fp.id = ? AND fp.is_active = 1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: rows[0] });
  } catch (error) {
    handleError(res, error, `GET /api/products/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/orders  – place an order
 * Body: { customer_id, items: [{product_id, farmer_id, quantity, unit_price}], payment_method, delivery_address, notes }
 * Atomically:
 *   1. Creates order row
 *   2. Inserts order_items rows
 *   3. Deducts quantity from farmer_inventory for each item
 */
app.post('/api/orders', async (req, res) => {
  let connection;
  try {
    const { customer_id, items, payment_method, delivery_address, notes } = req.body;
    if (!customer_id || !items?.length) {
      return res.status(400).json({ success: false, message: 'customer_id and items are required' });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Look up customer city for driver assignment
    const [custRows] = await connection.query(
      `SELECT city FROM users WHERE id = ?`, [customer_id]
    );
    const customerCity = custRows[0]?.city || null;

    // Find a driver in the same city (round-robin: pick the one with fewest active orders)
    let assignedDriverId = null;
    if (customerCity) {
      const [drivers] = await connection.query(
        `SELECT d.id,
                (SELECT COUNT(*) FROM orders o2
                 WHERE o2.driver_id = d.id AND o2.status NOT IN ('Delivered','Cancelled')) AS active_orders
         FROM driver d
         WHERE LOWER(TRIM(d.city)) = LOWER(TRIM(?))
         ORDER BY active_orders ASC, d.id ASC
         LIMIT 1`,
        [customerCity]
      );
      if (drivers.length) {
        assignedDriverId = drivers[0].id;
        logger.info(`Auto-assigned driver ${assignedDriverId} for city "${customerCity}"`);
      } else {
        logger.warn(`No driver found for city "${customerCity}" – order will be unassigned`);
      }
    }

    // Validate stock & compute total
    let total = 0;
    for (const item of items) {
      const [inv] = await connection.query(
        `SELECT fi.quantity FROM farmer_inventory fi
         JOIN farmer_products fp ON fp.id = fi.product_id
         WHERE fi.product_id = ? AND fp.is_active = 1`,
        [item.product_id]
      );
      if (!inv.length) { await connection.rollback(); return res.status(400).json({ success: false, message: `Product ${item.product_id} not found` }); }
      if (Number(inv[0].quantity) < Number(item.quantity)) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for product ${item.product_id}` });
      }
      total += Number(item.unit_price) * Number(item.quantity);
    }

    // Create order (with driver + city)
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, driver_id, city, total_amount, payment_method, payment_status, delivery_address, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, assignedDriverId, customerCity, total.toFixed(2),
       payment_method || 'cash',
       payment_method === 'card' ? 'Paid' : 'Unpaid',
       delivery_address || null, notes || null]
    );
    const orderId = orderResult.insertId;

    // Insert items & deduct inventory
    for (const item of items) {
      const subtotal = (Number(item.unit_price) * Number(item.quantity)).toFixed(2);
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, farmer_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.farmer_id, item.quantity, item.unit_price, subtotal]
      );
      await connection.query(
        `UPDATE farmer_inventory SET quantity = quantity - ? WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    logger.info(`Order #${orderId} placed by customer ${customer_id} (city: ${customerCity}) – driver: ${assignedDriverId || 'none'} – ${items.length} item(s), LKR ${total.toFixed(2)}`);
    res.status(201).json({
      success: true, message: 'Order placed', orderId,
      total: total.toFixed(2), assignedDriverId, city: customerCity,
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    handleError(res, error, 'POST /api/orders');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DRIVER ROUTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/driver/orders?driver_id=X
 * Returns all orders assigned to this driver, newest first.
 */
app.get('/api/driver/orders', async (req, res) => {
  let connection;
  try {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ success: false, message: 'driver_id is required' });
    connection = await pool.getConnection();
    const [orders] = await connection.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status,
              o.total_amount, o.delivery_address, o.city, o.created_at,
              u.name AS customer_name, u.phone AS customer_phone,
              COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.driver_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [driver_id]
    );
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      outForDelivery: orders.filter(o => o.status === 'Out for Delivery').length,
      delivered: orders.filter(o => o.status === 'Delivered').length,
    };
    res.json({ success: true, orders, stats });
  } catch (error) {
    handleError(res, error, 'GET /api/driver/orders');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/driver/orders/:id/status
 * Driver updates order status. Allowed: Pending → Out for Delivery → Delivered
 */
app.put('/api/driver/orders/:id/status', async (req, res) => {
  let connection;
  try {
    const { status, driver_id } = req.body;
    const allowed = ['Pending', 'Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    connection = await pool.getConnection();
    // Ensure order belongs to this driver
    const [rows] = await connection.query(
      `SELECT id, driver_id FROM orders WHERE id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (driver_id && rows[0].driver_id !== Number(driver_id)) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }
    await connection.query(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);
    logger.info(`Driver ${driver_id} updated order #${req.params.id} status → ${status}`);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `PUT /api/driver/orders/${req.params.id}/status`);
  } finally {
    if (connection) connection.release();
  }
});


/**
 * GET /api/customer/orders?customer_id=X  – customer's order history
 */
app.get('/api/customer/orders', async (req, res) => {
  let connection;
  try {
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ success: false, message: 'customer_id is required' });
    connection = await pool.getConnection();
    const [orders] = await connection.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status,
              o.total_amount, o.delivery_address, o.created_at
       FROM orders o
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [customer_id]
    );
    // For each order fetch its items
    for (const order of orders) {
      const [items] = await connection.query(
        `SELECT oi.*, fp.name AS product_name, fp.unit, fp.category, f.name AS farmer_name
         FROM order_items oi
         JOIN farmer_products fp ON fp.id = oi.product_id
         JOIN farmer f ON f.id = oi.farmer_id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }
    res.json({ success: true, orders });
  } catch (error) {
    handleError(res, error, 'GET /api/customer/orders');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/farmer/orders?farmer_id=X  – orders containing this farmer's products (sales)
 */
app.get('/api/farmer/orders', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT o.id AS order_id, o.status, o.payment_method, o.payment_status, o.created_at,
              oi.quantity, oi.unit_price, oi.subtotal,
              fp.name AS product_name, fp.unit, fp.category,
              u.name AS customer_name, u.email AS customer_email
       FROM order_items oi
       JOIN orders          o  ON o.id  = oi.order_id
       JOIN farmer_products fp ON fp.id = oi.product_id
       JOIN users           u  ON u.id  = o.customer_id
       WHERE oi.farmer_id = ?
       ORDER BY o.created_at DESC`,
      [farmer_id]
    );
    const totalRevenue = rows.reduce((s, r) => s + Number(r.subtotal), 0);
    res.json({ success: true, sales: rows, totalRevenue: totalRevenue.toFixed(2) });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/orders');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// FARMER – INVENTORY
// ════════════════════════════════════════════════════════════════════════════


/** GET /api/farmer/inventory?farmer_id=X  – list inventory with product details */
app.get('/api/farmer/inventory', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT fi.id AS inventory_id,
              fp.id AS product_id,
              fp.name,
              fp.category,
              fp.unit,
              fp.price,
              fi.quantity,
              fi.harvest_date,
              fi.expiry_date,
              fi.updated_at
       FROM farmer_inventory fi
       JOIN farmer_products  fp ON fp.id = fi.product_id
       WHERE fi.farmer_id = ? AND fp.is_active = 1
       ORDER BY fp.name ASC`,
      [farmer_id]
    );
    logger.info(`GET inventory for farmer ${farmer_id} – ${rows.length} rows`);
    res.json({ success: true, inventory: rows });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/inventory');
  } finally {
    if (connection) connection.release();
  }
});

/** PUT /api/farmer/inventory/:id  – update qty, harvest_date, expiry_date */
app.put('/api/farmer/inventory/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { quantity, harvest_date, expiry_date } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required' });
    }
    connection = await pool.getConnection();
    await connection.query(
      `UPDATE farmer_inventory SET quantity=?, harvest_date=?, expiry_date=? WHERE id=?`,
      [quantity, harvest_date || null, expiry_date || null, id]
    );
    logger.info(`Inventory row ${id} updated – qty=${quantity}`);
    res.json({ success: true, message: 'Inventory updated' });
  } catch (error) {
    handleError(res, error, `PUT /api/farmer/inventory/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// FARMER – DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════════════

/** GET /api/farmer/stats?farmer_id=X */
app.get('/api/farmer/stats', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    connection = await pool.getConnection();

    const [[{ totalProducts }]] = await connection.query(
      `SELECT COUNT(*) AS totalProducts FROM farmer_products WHERE farmer_id = ? AND is_active = 1`,
      [farmer_id]
    );
    const [[{ outOfStock }]] = await connection.query(
      `SELECT COUNT(*) AS outOfStock
       FROM farmer_inventory fi
       JOIN farmer_products  fp ON fp.id = fi.product_id
       WHERE fi.farmer_id = ? AND fp.is_active = 1 AND fi.quantity = 0`,
      [farmer_id]
    );
    const [[{ lowStock }]] = await connection.query(
      `SELECT COUNT(*) AS lowStock
       FROM farmer_inventory fi
       JOIN farmer_products  fp ON fp.id = fi.product_id
       WHERE fi.farmer_id = ? AND fp.is_active = 1 AND fi.quantity > 0 AND fi.quantity < 15`,
      [farmer_id]
    );
    const [[{ totalValue }]] = await connection.query(
      `SELECT COALESCE(SUM(fp.price * fi.quantity), 0) AS totalValue
       FROM farmer_inventory fi
       JOIN farmer_products  fp ON fp.id = fi.product_id
       WHERE fi.farmer_id = ? AND fp.is_active = 1`,
      [farmer_id]
    );

    // recent 5 products sorted by last inventory update
    const [recent] = await connection.query(
      `SELECT fp.name, fp.category, fp.unit, fp.price, fi.quantity, fi.expiry_date
       FROM farmer_inventory fi
       JOIN farmer_products  fp ON fp.id = fi.product_id
       WHERE fi.farmer_id = ? AND fp.is_active = 1
       ORDER BY fi.updated_at DESC LIMIT 5`,
      [farmer_id]
    );

    res.json({
      success: true,
      stats: { totalProducts, outOfStock, lowStock, totalValue: parseFloat(totalValue) },
      recentProducts: recent,
    });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/stats');
  } finally {
    if (connection) connection.release();
  }
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Boot ────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// ADMIN – ALL ORDERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/orders
 * Returns all orders with customer name, item count, and status.
 * Supports ?status=X, ?search=q (customer name / order id), ?payment=X
 */
app.get('/api/admin/orders', async (req, res) => {
  let connection;
  try {
    const { status, search, payment } = req.query;
    let where = '1=1';
    const params = [];
    if (status && status !== 'All') { where += ' AND o.status = ?'; params.push(status); }
    if (payment && payment !== 'All') { where += ' AND o.payment_status = ?'; params.push(payment); }
    if (search) { where += ' AND (u.name LIKE ? OR CAST(o.id AS CHAR) LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    connection = await pool.getConnection();
    const [orders] = await connection.query(
      `SELECT o.id, o.status, o.payment_method, o.payment_status,
              o.total_amount, o.delivery_address, o.created_at,
              u.name AS customer_name, u.email AS customer_email,
              COUNT(oi.id) AS item_count
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      params
    );
    const [summary] = await connection.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='Pending'           THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='Delivered'         THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN status='Cancelled'         THEN 1 ELSE 0 END) AS cancelled,
        SUM(total_amount) AS totalRevenue
       FROM orders`
    );
    res.json({ success: true, orders, summary: summary[0] });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/orders');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/admin/orders/:id/status  – update order status
 */
app.put('/api/admin/orders/:id/status', async (req, res) => {
  let connection;
  try {
    const { status } = req.body;
    connection = await pool.getConnection();
    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    logger.info(`Admin updated order ${req.params.id} status to ${status}`);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `PUT /api/admin/orders/${req.params.id}/status`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN – DELIVERY MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/deliveries
 * Returns all orders enriched with driver name, city, item count.
 * Supports ?status=&search= query filters.
 */
app.get('/api/admin/deliveries', async (req, res) => {
  let connection;
  try {
    const { status, search } = req.query;
    let where = '1=1';
    const params = [];
    if (status && status !== 'All') { where += ' AND o.status = ?'; params.push(status); }
    if (search) {
      where += ' AND (u.name LIKE ? OR CAST(o.id AS CHAR) LIKE ? OR COALESCE(d.name,\'\') LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    connection = await pool.getConnection();
    const [deliveries] = await connection.query(
      `SELECT
         o.id           AS order_id,
         o.status,
         o.payment_method,
         o.payment_status,
         o.total_amount,
         o.delivery_address,
         o.created_at,
         o.city         AS customer_city,
         u.name         AS customer_name,
         u.email        AS customer_email,
         d.id           AS driver_id,
         d.name         AS driver_name,
         d.city         AS driver_city,
         d.phone        AS driver_phone,
         COUNT(oi.id)   AS item_count
       FROM orders o
       JOIN users u  ON u.id = o.customer_id
       LEFT JOIN driver d  ON d.id = o.driver_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE ${where}
       GROUP BY o.id, d.id
       ORDER BY o.created_at DESC`,
      params
    );

    const [stats] = await connection.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='Pending'           THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status='Processing'        THEN 1 ELSE 0 END) AS processing,
         SUM(CASE WHEN status='Out for Delivery'  THEN 1 ELSE 0 END) AS out_for_delivery,
         SUM(CASE WHEN status='Delivered'         THEN 1 ELSE 0 END) AS delivered,
         SUM(CASE WHEN driver_id IS NULL          THEN 1 ELSE 0 END) AS unassigned
       FROM orders`
    );

    res.json({ success: true, deliveries, stats: stats[0] });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/deliveries');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN – ALL PAYMENTS
// ════════════════════════════════════════════════════════════════════════════


/**
 * GET /api/admin/payments
 * Returns all orders with payment info joined.
 */
app.get('/api/admin/payments', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT o.id AS order_id, o.payment_method, o.payment_status,
              o.total_amount, o.created_at,
              u.name AS customer_name, u.email AS customer_email,
              GROUP_CONCAT(DISTINCT f.name ORDER BY f.name SEPARATOR ', ') AS farmers
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN farmer f ON f.id = oi.farmer_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    const [summary] = await connection.query(
      `SELECT
        SUM(total_amount) AS totalRevenue,
        SUM(CASE WHEN payment_status='Paid' THEN total_amount ELSE 0 END) AS paidRevenue,
        SUM(CASE WHEN payment_status='Unpaid' THEN total_amount ELSE 0 END) AS unpaidRevenue,
        SUM(CASE WHEN payment_method='card' THEN total_amount ELSE 0 END) AS cardRevenue,
        SUM(CASE WHEN payment_method='cash' THEN total_amount ELSE 0 END) AS cashRevenue
       FROM orders`
    );
    res.json({ success: true, payments: rows, summary: summary[0] });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/payments');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// FARMER NOTIFICATIONS (Admin → Farmer messaging)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/farmers  – list all farmers (for the seller contact dropdown)
 */
app.get('/api/admin/farmers', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT f.id, f.name, f.email, f.phone, f.farm_location,
              COUNT(fp.id) AS product_count
       FROM farmer f
       LEFT JOIN farmer_products fp ON fp.farmer_id = f.id AND fp.is_active = 1
       GROUP BY f.id
       ORDER BY f.name ASC`
    );
    res.json({ success: true, farmers: rows });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/farmers');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/admin/notifications  – send a message/notification to a farmer
 */
app.post('/api/admin/notifications', async (req, res) => {
  let connection;
  try {
    const { farmer_id, subject, message, is_urgent } = req.body;
    if (!farmer_id || !subject || !message) {
      return res.status(400).json({ success: false, message: 'farmer_id, subject and message are required' });
    }
    connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO farmer_notifications (farmer_id, subject, message, is_urgent)
       VALUES (?, ?, ?, ?)`,
      [farmer_id, subject, message, is_urgent !== false ? 1 : 0]
    );
    logger.info(`Admin sent notification to farmer ${farmer_id}: "${subject}"`);
    res.status(201).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    handleError(res, error, 'POST /api/admin/notifications');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/farmer/notifications?farmer_id=X  – fetch notifications for a farmer
 */
app.get('/api/farmer/notifications', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT id, subject, message, is_urgent, is_read, created_at
       FROM farmer_notifications
       WHERE farmer_id = ?
       ORDER BY is_read ASC, created_at DESC`,
      [farmer_id]
    );
    const unreadCount = rows.filter(r => !r.is_read).length;
    res.json({ success: true, notifications: rows, unreadCount });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/notifications');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/farmer/notifications/:id/read  – mark a notification as read
 */
app.put('/api/farmer/notifications/:id/read', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('UPDATE farmer_notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `PUT /api/farmer/notifications/${req.params.id}/read`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// REVIEW ROUTES
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/orders/:id/reviewable-items?customer_id=X
 * Returns items in a Delivered order that the customer hasn't reviewed yet.
 */
app.get('/api/orders/:id/reviewable-items', async (req, res) => {
  let connection;
  try {
    const { customer_id } = req.query;
    connection = await pool.getConnection();
    const [order] = await connection.query(
      `SELECT id, status, customer_id FROM orders WHERE id = ?`, [req.params.id]
    );
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order[0].status !== 'Delivered') {
      return res.json({ success: true, items: [], message: 'Order not delivered yet' });
    }
    const [items] = await connection.query(
      `SELECT oi.id AS item_id, oi.product_id, oi.farmer_id,
              fp.name AS product_name, fp.category,
              f.name AS farmer_name,
              (SELECT id FROM product_reviews WHERE order_id = ? AND product_id = oi.product_id AND customer_id = ?) AS review_id
       FROM order_items oi
       JOIN farmer_products fp ON fp.id = oi.product_id
       JOIN farmer f ON f.id = oi.farmer_id
       WHERE oi.order_id = ?`,
      [req.params.id, customer_id, req.params.id]
    );
    res.json({ success: true, items });
  } catch (error) {
    handleError(res, error, `GET /api/orders/${req.params.id}/reviewable-items`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/reviews  – customer submits a review for a delivered product
 * Body: { order_id, product_id, farmer_id, customer_id, rating, comment }
 */
app.post('/api/reviews', async (req, res) => {
  let connection;
  try {
    const { order_id, product_id, farmer_id, customer_id, rating, comment } = req.body;
    if (!order_id || !product_id || !farmer_id || !customer_id || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }
    connection = await pool.getConnection();
    // Ensure order is delivered and belongs to this customer
    const [order] = await connection.query(
      `SELECT status, customer_id FROM orders WHERE id = ?`, [order_id]
    );
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order[0].customer_id !== Number(customer_id)) {
      return res.status(403).json({ success: false, message: 'Not your order' });
    }
    if (order[0].status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Can only review delivered orders' });
    }
    // Prevent duplicate reviews for same order + product
    const [existing] = await connection.query(
      `SELECT id FROM product_reviews WHERE order_id = ? AND product_id = ? AND customer_id = ?`,
      [order_id, product_id, customer_id]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Already reviewed this product for this order' });
    }
    const [result] = await connection.query(
      `INSERT INTO product_reviews (order_id, product_id, farmer_id, customer_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, product_id, farmer_id, customer_id, rating, comment?.trim() || null]
    );
    logger.info(`Review #${result.insertId} submitted by customer ${customer_id} for product ${product_id}`);
    res.status(201).json({ success: true, reviewId: result.insertId });
  } catch (error) {
    handleError(res, error, 'POST /api/reviews');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/reviews/product/:id  – all reviews for a product (shown on product detail page)
 */
app.get('/api/reviews/product/:id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [reviews] = await connection.query(
      `SELECT pr.id, pr.rating, pr.comment, pr.created_at,
              u.name AS customer_name
       FROM product_reviews pr
       JOIN users u ON u.id = pr.customer_id
       WHERE pr.product_id = ?
         AND pr.id NOT IN (
           SELECT rdr.review_id FROM review_deletion_requests rdr WHERE rdr.status = 'Approved'
         )
       ORDER BY pr.created_at DESC`,
      [req.params.id]
    );
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;
    res.json({ success: true, reviews, average: avg, count: reviews.length });
  } catch (error) {
    handleError(res, error, `GET /api/reviews/product/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/farmer/reviews?farmer_id=X  – all reviews for a farmer's products
 */
app.get('/api/farmer/reviews', async (req, res) => {
  let connection;
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id required' });
    connection = await pool.getConnection();
    const [reviews] = await connection.query(
      `SELECT pr.id, pr.order_id, pr.product_id, pr.rating, pr.comment, pr.created_at,
              fp.name AS product_name, fp.category,
              u.name  AS customer_name,
              (SELECT rdr.status FROM review_deletion_requests rdr WHERE rdr.review_id = pr.id ORDER BY rdr.id DESC LIMIT 1) AS deletion_status
       FROM product_reviews pr
       JOIN farmer_products fp ON fp.id = pr.product_id
       JOIN users u            ON u.id  = pr.customer_id
       WHERE pr.farmer_id = ?
       ORDER BY pr.created_at DESC`,
      [farmer_id]
    );
    res.json({ success: true, reviews });
  } catch (error) {
    handleError(res, error, 'GET /api/farmer/reviews');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/farmer/reviews/deletion-request
 * Farmer requests admin to delete a review.
 * Body: { review_id, farmer_id, reason }
 */
app.post('/api/farmer/reviews/deletion-request', async (req, res) => {
  let connection;
  try {
    const { review_id, farmer_id, reason } = req.body;
    if (!review_id || !farmer_id) {
      return res.status(400).json({ success: false, message: 'review_id and farmer_id required' });
    }
    connection = await pool.getConnection();
    // Verify review belongs to this farmer
    const [rev] = await connection.query(
      `SELECT id FROM product_reviews WHERE id = ? AND farmer_id = ?`, [review_id, farmer_id]
    );
    if (!rev.length) return res.status(403).json({ success: false, message: 'Review not found or not yours' });
    // Check no pending request already
    const [pending] = await connection.query(
      `SELECT id FROM review_deletion_requests WHERE review_id = ? AND status = 'Pending'`, [review_id]
    );
    if (pending.length) return res.status(409).json({ success: false, message: 'A deletion request is already pending for this review' });
    await connection.query(
      `INSERT INTO review_deletion_requests (review_id, farmer_id, reason) VALUES (?, ?, ?)`,
      [review_id, farmer_id, reason?.trim() || null]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    handleError(res, error, 'POST /api/farmer/reviews/deletion-request');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/reviews  – all reviews for admin
 */
app.get('/api/admin/reviews', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [reviews] = await connection.query(
      `SELECT pr.id, pr.order_id, pr.product_id, pr.rating, pr.comment, pr.created_at,
              fp.name   AS product_name, fp.category,
              f.name    AS farmer_name,
              u.name    AS customer_name,
              (SELECT rdr.status FROM review_deletion_requests rdr WHERE rdr.review_id = pr.id ORDER BY rdr.id DESC LIMIT 1) AS deletion_status
       FROM product_reviews pr
       JOIN farmer_products fp ON fp.id = pr.product_id
       JOIN farmer f           ON f.id  = pr.farmer_id
       JOIN users u            ON u.id  = pr.customer_id
       ORDER BY pr.created_at DESC`
    );
    res.json({ success: true, reviews });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/reviews');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/reviews/deletion-requests  – all pending deletion requests
 */
app.get('/api/admin/reviews/deletion-requests', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [requests] = await connection.query(
      `SELECT rdr.id, rdr.review_id, rdr.reason, rdr.status, rdr.created_at, rdr.resolved_at,
              pr.rating, pr.comment AS review_text,
              fp.name   AS product_name,
              f.name    AS farmer_name,
              u.name    AS customer_name
       FROM review_deletion_requests rdr
       JOIN product_reviews pr ON pr.id = rdr.review_id
       JOIN farmer_products fp ON fp.id = pr.product_id
       JOIN farmer f           ON f.id  = rdr.farmer_id
       JOIN users  u           ON u.id  = pr.customer_id
       ORDER BY rdr.status ASC, rdr.created_at DESC`
    );
    res.json({ success: true, requests });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/reviews/deletion-requests');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/admin/reviews/deletion-requests/:id  – approve or reject
 * Body: { action: 'approve'|'reject' }
 */
app.put('/api/admin/reviews/deletion-requests/:id', async (req, res) => {
  let connection;
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }
    connection = await pool.getConnection();
    const [rdr] = await connection.query(
      `SELECT id, review_id, status FROM review_deletion_requests WHERE id = ?`, [req.params.id]
    );
    if (!rdr.length) return res.status(404).json({ success: false, message: 'Request not found' });
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    await connection.query(
      `UPDATE review_deletion_requests SET status = ?, resolved_at = NOW() WHERE id = ?`,
      [newStatus, req.params.id]
    );
    // If approved, delete the review
    if (action === 'approve') {
      await connection.query(`DELETE FROM product_reviews WHERE id = ?`, [rdr[0].review_id]);
      logger.info(`Admin approved deletion of review #${rdr[0].review_id}`);
    }
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `PUT /api/admin/reviews/deletion-requests/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});



// ════════════════════════════════════════════════════════════════════════════
// CHATBOT / DISPUTE ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ── Gemini AI setup ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let geminiClient = null;

const SYSTEM_PROMPT = `You are a friendly, concise customer support assistant for "Roots & Routes", a Sri Lankan agri-commerce platform that connects local farmers with customers.

Your role:
- Help customers with questions about their orders, deliveries, payments, refunds, product quality, and anything related to the platform.
- Keep replies SHORT (2-4 sentences max), warm, and helpful.
- If a customer has a complaint or serious issue, encourage them to click the "File a Complaint" button below the chat.
- You can reference these features: My Orders (order tracking with status stepper), Products page (browse all farmer products), Cart (shopping), Reviews (post-delivery), and the Complaint form in this chat.
- For refunds, cancellations, or serious issues, always recommend filing a complaint so admin can take action.
- Do NOT make up information about specific orders. You do not have access to order data.
- Respond in plain text only (no markdown symbols). Use a friendly emoji occasionally.
- If asked something unrelated to the platform or shopping, politely redirect.`;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // systemInstruction must go here on getGenerativeModel, NOT in startChat
  geminiClient = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
  });
  logger.info('Gemini AI model ready (gemini-1.5-flash)');
} else {
  logger.warn('GEMINI_API_KEY not set – chatbot will use fallback replies');
}

async function getGeminiReply(conversationHistory, userMessage) {
  if (!geminiClient) {
    // Fallback keyword matcher
    const lower = userMessage.toLowerCase();
    if (lower.includes('track') || lower.includes('order status')) return "You can track your order in the My Orders section. Click any order to see the live delivery status. 📦";
    if (lower.includes('refund')) return "Refund requests are handled by our admin team. Please use the File a Complaint button below and include your order number. We will get back to you within 2-3 business days.";
    if (lower.includes('payment')) return "For payment issues, check your order in My Orders. If the problem persists, please file a complaint and our team will investigate promptly. 💳";
    if (lower.includes('quality') || lower.includes('damaged') || lower.includes('wrong item')) return "We are sorry to hear that! Please file a complaint using the button below, include your order number and a description, and we will resolve it immediately. 🙏";
    if (lower.includes('delivery') || lower.includes('delay') || lower.includes('driver')) return "Your driver updates the delivery status in real-time in My Orders. For significant delays, please file a complaint and we will follow up with the driver.";
    if (lower.includes('cancel')) return "Order cancellations are possible before the driver picks up your order. Please file a complaint with your order number and our team will check if it is still possible.";
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return "Hello! 👋 How can I help you today? Ask me anything about your orders, products, delivery, payments or refunds!";
    return "I am not sure about that. Could you provide more details? Or you can file a complaint below and our admin team will help you directly. 😊";
  }

  try {
    // Build alternating user/model history for Gemini (must start with user role)
    // Skip bot-only messages at the start (the greeting) and only include
    // pairs where customer and bot have exchanged messages
    const history = [];
    for (const m of conversationHistory) {
      if (m.sender_type === 'customer') {
        history.push({ role: 'user',  parts: [{ text: m.message }] });
      } else if ((m.sender_type === 'bot' || m.sender_type === 'admin') && history.length > 0) {
        // Only add model turn if there's already a user turn before it
        history.push({ role: 'model', parts: [{ text: m.message }] });
      }
      // skip bot messages before any user message (e.g. greeting)
    }

    const chat = geminiClient.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (err) {
    logger.error('Gemini API error', { error: err.message });
    // 429 = quota/rate-limit: give a friendlier message so the bug is clear
    if (err.status === 429) {
      return "I'm a little busy right now (rate limit). Please wait a few seconds and try again! 🙏";
    }
    return "I am having a little trouble right now. Please try again in a moment, or file a complaint below and our team will help you directly. 😊";
  }
}



/**
 * POST /api/chat/session  – start a new chat session
 * Body: { customer_id, subject?, is_complaint? }
 */
app.post('/api/chat/session', async (req, res) => {
  let connection;
  try {
    const { customer_id, subject = 'General Enquiry', is_complaint = 0 } = req.body;
    if (!customer_id) return res.status(400).json({ success: false, message: 'customer_id required' });
    connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO chat_sessions (customer_id, subject, is_complaint) VALUES (?, ?, ?)`,
      [customer_id, subject, is_complaint ? 1 : 0]
    );
    const sessionId = result.insertId;
    const greeting = "Hello! 👋 I'm the Roots & Routes assistant. How can I help you today? You can ask me anything about your orders, deliveries, payments, refunds, or product quality — or tap a quick question below!";
    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'bot', ?)`,
      [sessionId, greeting]
    );
    res.status(201).json({ success: true, sessionId, greeting });
  } catch (error) {
    handleError(res, error, 'POST /api/chat/session');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/chat/message  – customer sends a message; Gemini replies
 * Body: { session_id, customer_id, message }
 */
app.post('/api/chat/message', async (req, res) => {
  let connection;
  try {
    const { session_id, customer_id, message } = req.body;
    if (!session_id || !customer_id || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'session_id, customer_id, message required' });
    }
    connection = await pool.getConnection();

    // Fetch last 10 messages as conversation context for Gemini
    const [history] = await connection.query(
      `SELECT sender_type, message FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT 10`,
      [session_id]
    );

    // Save customer message
    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'customer', ?)`,
      [session_id, message.trim()]
    );

    // Generate Gemini reply (uses history context)
    const botReply = await getGeminiReply(history, message.trim());

    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'bot', ?)`,
      [session_id, botReply]
    );
    await connection.query(`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?`, [session_id]);
    res.json({ success: true, reply: botReply });
  } catch (error) {
    handleError(res, error, 'POST /api/chat/message');
  } finally {
    if (connection) connection.release();
  }
});



/**
 * POST /api/chat/complaint  – mark session as complaint and record details
 * Body: { session_id, customer_id, complaint_text }
 */
app.post('/api/chat/complaint', async (req, res) => {
  let connection;
  try {
    const { session_id, customer_id, complaint_text } = req.body;
    if (!session_id || !customer_id || !complaint_text?.trim()) {
      return res.status(400).json({ success: false, message: 'session_id, customer_id, complaint_text required' });
    }
    connection = await pool.getConnection();
    await connection.query(
      `UPDATE chat_sessions SET is_complaint = 1, subject = 'Complaint', status = 'Open' WHERE id = ? AND customer_id = ?`,
      [session_id, customer_id]
    );
    // Save complaint as a customer message
    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'customer', ?)`,
      [session_id, `[COMPLAINT] ${complaint_text.trim()}`]
    );
    const ack = "✅ Your complaint has been submitted. Our team will review it and respond within 24 hours. Thank you for letting us know!";
    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'bot', ?)`,
      [session_id, ack]
    );
    res.json({ success: true, message: ack });
  } catch (error) {
    handleError(res, error, 'POST /api/chat/complaint');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/chat/sessions/:sessionId/messages
 * Returns all messages for a session (sorted oldest→newest)
 */
app.get('/api/chat/sessions/:sessionId/messages', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [messages] = await connection.query(
      `SELECT id, sender_type, message, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`,
      [req.params.sessionId]
    );
    res.json({ success: true, messages });
  } catch (error) {
    handleError(res, error, `GET /api/chat/sessions/${req.params.sessionId}/messages`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/chat/sessions  – admin: all sessions with customer info
 */
app.get('/api/admin/chat/sessions', async (req, res) => {
  let connection;
  try {
    const { status, complaint } = req.query;
    let where = '1=1';
    const params = [];
    if (status && status !== 'All') { where += ' AND cs.status = ?'; params.push(status); }
    if (complaint === '1') { where += ' AND cs.is_complaint = 1'; }
    connection = await pool.getConnection();
    const [sessions] = await connection.query(
      `SELECT cs.id, cs.subject, cs.status, cs.is_complaint, cs.created_at, cs.updated_at,
              u.name AS customer_name, u.email AS customer_email,
              COUNT(cm.id) AS message_count
       FROM chat_sessions cs
       JOIN users u ON u.id = cs.customer_id
       LEFT JOIN chat_messages cm ON cm.session_id = cs.id
       WHERE ${where}
       GROUP BY cs.id
       ORDER BY cs.updated_at DESC`,
      params
    );
    const [stats] = await connection.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status='Open'          THEN 1 ELSE 0 END) AS open_count,
         SUM(CASE WHEN status='Under Review'  THEN 1 ELSE 0 END) AS reviewing,
         SUM(CASE WHEN status='Resolved'      THEN 1 ELSE 0 END) AS resolved,
         SUM(CASE WHEN is_complaint=1         THEN 1 ELSE 0 END) AS complaints
       FROM chat_sessions`
    );
    res.json({ success: true, sessions, stats: stats[0] });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/chat/sessions');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/admin/chat/sessions/:id/status  – admin updates session status
 * Body: { status }
 */
app.put('/api/admin/chat/sessions/:id/status', async (req, res) => {
  let connection;
  try {
    const { status } = req.body;
    const valid = ['Open', 'Under Review', 'Resolved', 'Closed'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    connection = await pool.getConnection();
    await connection.query(`UPDATE chat_sessions SET status = ? WHERE id = ?`, [status, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `PUT /api/admin/chat/sessions/${req.params.id}/status`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/admin/chat/sessions/:id/reply  – admin sends a message to a session
 * Body: { message }
 */
app.post('/api/admin/chat/sessions/:id/reply', async (req, res) => {
  let connection;
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'message required' });
    connection = await pool.getConnection();
    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'admin', ?)`,
      [req.params.id, message.trim()]
    );
    await connection.query(`UPDATE chat_sessions SET updated_at = NOW(), status = 'Under Review' WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `POST /api/admin/chat/sessions/${req.params.id}/reply`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMER – COMPLAINT THREADS (Support page)
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/customer/complaints?customer_id=X
 * Returns all complaint sessions (is_complaint=1) belonging to this customer.
 */
app.get('/api/customer/complaints', async (req, res) => {
  let connection;
  try {
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ success: false, message: 'customer_id required' });
    connection = await pool.getConnection();
    const [sessions] = await connection.query(
      `SELECT cs.id, cs.subject, cs.status, cs.is_complaint, cs.created_at, cs.updated_at,
              COUNT(cm.id) AS message_count
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cm.session_id = cs.id
       WHERE cs.customer_id = ? AND cs.is_complaint = 1
       GROUP BY cs.id
       ORDER BY cs.updated_at DESC`,
      [customer_id]
    );
    res.json({ success: true, sessions });
  } catch (error) {
    handleError(res, error, 'GET /api/customer/complaints');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/customer/complaints/:id/reply
 * Customer sends a follow-up message on their own complaint thread.
 * Body: { customer_id, message }
 */
app.post('/api/customer/complaints/:id/reply', async (req, res) => {
  let connection;
  try {
    const { customer_id, message } = req.body;
    if (!customer_id || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'customer_id and message required' });
    }
    connection = await pool.getConnection();
    // Verify ownership
    const [rows] = await connection.query(
      `SELECT id FROM chat_sessions WHERE id = ? AND customer_id = ?`,
      [req.params.id, customer_id]
    );
    if (!rows.length) return res.status(403).json({ success: false, message: 'Not your session' });

    await connection.query(
      `INSERT INTO chat_messages (session_id, sender_type, message) VALUES (?, 'customer', ?)`,
      [req.params.id, message.trim()]
    );
    await connection.query(
      `UPDATE chat_sessions SET updated_at = NOW(), status = 'Open' WHERE id = ?`,
      [req.params.id]
    );
    logger.info(`Customer #${customer_id} replied to complaint session #${req.params.id}`);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, `POST /api/customer/complaints/${req.params.id}/reply`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ANALYTICS
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/analytics  – all dashboard chart data in one shot
 */
app.get('/api/admin/analytics', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // ── KPI counts ─────────────────────────────────────────────────────
    const [[userCounts]] = await connection.query(
      `SELECT
         (SELECT COUNT(*) FROM users)   AS customers,
         (SELECT COUNT(*) FROM farmer)  AS farmers,
         (SELECT COUNT(*) FROM driver)  AS drivers,
         (SELECT COUNT(*) FROM admin)   AS admins`
    );

    const [[orderStats]] = await connection.query(
      `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_amount),0) AS totalRevenue FROM orders`
    );

    // ── Role distribution (pie chart) ───────────────────────────────────
    const roleData = [
      { name: 'Customers', value: Number(userCounts.customers) },
      { name: 'Farmers',   value: Number(userCounts.farmers) },
      { name: 'Drivers',   value: Number(userCounts.drivers) },
    ];

    // ── Top 5 selling products (bar chart) ─────────────────────────────
    const [topProducts] = await connection.query(
      `SELECT fp.name, COUNT(oi.id) AS sales
       FROM order_items oi
       JOIN farmer_products fp ON fp.id = oi.product_id
       GROUP BY oi.product_id, fp.name
       ORDER BY sales DESC
       LIMIT 5`
    );

    // ── Orders per category (bar chart) ────────────────────────────────
    const [categoryOrders] = await connection.query(
      `SELECT fp.category AS name, COUNT(oi.id) AS orders
       FROM order_items oi
       JOIN farmer_products fp ON fp.id = oi.product_id
       GROUP BY fp.category
       ORDER BY orders DESC`
    );

    // ── Revenue by weekday (line chart, last 7 days) ─────────────────
    const [revenueByDay] = await connection.query(
      `SELECT DATE_FORMAT(created_at, '%a') AS name,
              COALESCE(SUM(total_amount), 0) AS revenue
       FROM orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at), name
       ORDER BY DATE(created_at) ASC`
    );

    // ── Order status breakdown ─────────────────────────────────────────
    const [statusRows] = await connection.query(
      `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
    );

    // ── Recent orders (table) ─────────────────────────────────────────
    const [recentOrders] = await connection.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at,
              u.name AS customer_name
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    logger.info('Admin analytics fetched');
    res.json({
      success: true,
      kpi: {
        totalUsers: Number(userCounts.customers) + Number(userCounts.farmers) + Number(userCounts.drivers),
        customers: Number(userCounts.customers),
        farmers: Number(userCounts.farmers),
        drivers: Number(userCounts.drivers),
        totalOrders: Number(orderStats.totalOrders),
        totalRevenue: Number(orderStats.totalRevenue),
      },
      roleData,
      topProducts: topProducts.map(r => ({ name: r.name, sales: Number(r.sales) })),
      categoryOrders: categoryOrders.map(r => ({ name: r.name, orders: Number(r.orders) })),
      revenueByDay: revenueByDay.map(r => ({ name: r.name, revenue: Number(r.revenue) })),
      statusBreakdown: statusRows.map(r => ({ name: r.status, value: Number(r.count) })),
      recentOrders: recentOrders.map(r => ({
        id: r.id,
        customer: r.customer_name,
        total: Number(r.total_amount),
        status: r.status,
        date: r.created_at,
      })),
    });
  } catch (error) {
    handleError(res, error, 'GET /api/admin/analytics');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMER PROFILE
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/customer/profile?id=X  – fetch a customer's own profile
 */
app.get('/api/customer/profile', async (req, res) => {
  let connection;
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: 'id is required' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?`, [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    handleError(res, error, 'GET /api/customer/profile');
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/customer/profile  – update a customer's own profile
 * Body: { id, name, phone, city }
 */
app.put('/api/customer/profile', async (req, res) => {
  let connection;
  try {
    const { id, name, phone, city } = req.body;
    if (!id || !name || !phone) {
      return res.status(400).json({ success: false, message: 'id, name and phone are required' });
    }
    connection = await pool.getConnection();
    await connection.query(
      `UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?`,
      [name.trim(), phone.trim(), city?.trim() || null, id]
    );
    const [rows] = await connection.query(
      `SELECT id, name, email, phone, city FROM users WHERE id = ?`, [id]
    );
    logger.info(`Customer #${id} updated profile`);
    res.json({ success: true, user: rows[0] });
  } catch (error) {
    handleError(res, error, 'PUT /api/customer/profile');
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN – SINGLE USER CRUD (view / edit / delete)
// ════════════════════════════════════════════════════════════════════════════

const ROLE_TO_TABLE = { user: 'users', farmer: 'farmer', driver: 'driver' };

/**
 * GET /api/admin/users/:role/:id  – fetch a single user's full details
 */
app.get('/api/admin/users/:role/:id', async (req, res) => {
  let connection;
  try {
    const table = ROLE_TO_TABLE[req.params.role];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid role' });
    connection = await pool.getConnection();
    const [rows] = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    const { password: _pw, ...safeUser } = rows[0];
    res.json({ success: true, user: safeUser });
  } catch (error) {
    handleError(res, error, `GET /api/admin/users/${req.params.role}/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/admin/users/:role/:id  – admin edits a user
 * Body: { name, phone, email, city?, farmLocation?, farmSize?, cropsProduced?, licenseNumber?, vehicleNumber?, vehicleType? }
 */
app.put('/api/admin/users/:role/:id', async (req, res) => {
  let connection;
  try {
    const table = ROLE_TO_TABLE[req.params.role];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid role' });
    const { name, email, phone, city, farmLocation, farmSize, cropsProduced, licenseNumber, vehicleNumber, vehicleType } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'name, email and phone are required' });
    }
    connection = await pool.getConnection();
    if (req.params.role === 'user') {
      await connection.query(
        `UPDATE users SET name=?, email=?, phone=?, city=? WHERE id=?`,
        [name, email, phone, city || null, req.params.id]
      );
    } else if (req.params.role === 'farmer') {
      await connection.query(
        `UPDATE farmer SET name=?, email=?, phone=?, farm_location=?, farm_size=?, crops_produced=? WHERE id=?`,
        [name, email, phone, farmLocation || null, farmSize || null, cropsProduced || null, req.params.id]
      );
    } else if (req.params.role === 'driver') {
      await connection.query(
        `UPDATE driver SET name=?, email=?, phone=?, city=?, license_number=?, vehicle_number=?, vehicle_type=? WHERE id=?`,
        [name, email, phone, city || null, licenseNumber || null, vehicleNumber || null, vehicleType || null, req.params.id]
      );
    }
    logger.info(`Admin updated ${req.params.role} #${req.params.id}`);
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    handleError(res, error, `PUT /api/admin/users/${req.params.role}/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

/**
 * DELETE /api/admin/users/:role/:id  – admin deletes a user
 */
app.delete('/api/admin/users/:role/:id', async (req, res) => {
  let connection;
  try {
    const table = ROLE_TO_TABLE[req.params.role];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid role' });
    connection = await pool.getConnection();
    await connection.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    logger.info(`Admin deleted ${req.params.role} #${req.params.id}`);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    handleError(res, error, `DELETE /api/admin/users/${req.params.role}/${req.params.id}`);
  } finally {
    if (connection) connection.release();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Start server
// ════════════════════════════════════════════════════════════════════════════

(async () => {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Run: lsof -ti tcp:${PORT} | xargs kill -9`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (err) {
    logger.error('Fatal: could not start server', { error: err.message });
    process.exit(1);
  }
})();

