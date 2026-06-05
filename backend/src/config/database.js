const mariadb = require('mariadb');

console.log('[DB CONFIG]', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_NAME
});

const pool = mariadb.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tfg_ldm',
    connectionLimit: 5,
    acquireTimeout: 10000
});

async function query(sql, params = []) {
    let connection;

    try {
        connection = await pool.getConnection();
        return await connection.query(sql, params);
    } catch (error) {
        console.error('[DB ERROR]', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });

        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        const result = await connection.query('SELECT 1 AS ok');
        console.log('[DB] Conexión correcta:', result);
    } catch (error) {
        console.error('[DB] No se pudo conectar:', error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    query,
    testConnection
};