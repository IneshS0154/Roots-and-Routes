import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'RandR',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('Database connection pool created');

export default pool;
