// config/database.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

console.log('========== DATABASE CONFIG ==========');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_USER:', process.env.DB_USER || 'root');
console.log('DB_NAME:', process.env.DB_NAME || 'lost_found_db');
console.log('DB_PORT:', process.env.DB_PORT || '3306');
console.log('DB_PASSWORD exists:', process.env.DB_PASSWORD ? '✅ YES' : '❌ NO');
console.log('=====================================');

// Detect if we're connecting to TiDB Cloud (requires SSL)
const isTiDB = process.env.DB_HOST && process.env.DB_HOST.includes('tidbcloud.com');
console.log('SSL required:', isTiDB ? '✅ YES (TiDB Cloud)' : '❌ NO (local)');

const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lost_found_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Only enable SSL for TiDB Cloud
if (isTiDB) {
    poolConfig.ssl = {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    };
}

const pool = mysql.createPool(poolConfig);

// Test connection
const initializeDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully to:', process.env.DB_HOST);
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
    }
};

initializeDatabase();

module.exports = pool;