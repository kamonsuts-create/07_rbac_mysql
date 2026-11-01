import mysql from "mysql2/promise";

const globalForMysql = globalThis;

const pool =
  globalForMysql.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = pool;
}

export default pool;
