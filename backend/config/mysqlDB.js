const mysql = require('mysql2/promise');
require('dotenv').config();

const dbUrl = new URL(process.env.MYSQL_URL);

const mysqlPool = mysql.createPool({
    host: dbUrl.hostname,
    port: dbUrl.port,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.replace('/', ''),
    connectTimeout: 10000
});

const testMySQLConnection = async () => {
    try {
        const connection = await mysqlPool.getConnection();
        console.log('MySQL Connected Successfully');
        connection.release();
    } catch (error) {
        console.error('MySQL Connection Error:', error.message);
    }
};

module.exports = { mysqlPool, testMySQLConnection };