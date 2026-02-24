const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.connect()
  .then(client => {
    console.log(' PostgreSQL Database Connected Successfully');
    console.log(` Connected to database: ${process.env.DB_NAME}`);
    client.release();
  })
  .catch(err => {
    console.error(' PostgreSQL Connection Error:', err.message);
  });

module.exports = pool;