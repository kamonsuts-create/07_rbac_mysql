import mysql from "mysql2/promise";
import fs from "fs";

let poolInstance = null;

function createConnectionPool() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (dbUrl) {
    const hasSSLParam = dbUrl.includes("ssl=") || dbUrl.includes("sslmode=");
    const needsSSL = process.env.DB_SSL === "true" || hasSSLParam || !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");

    return mysql.createPool({
      uri: dbUrl,
      ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });
  }

  // Socket fallback only if socket file actually exists on filesystem
  const socket = process.env.DB_SOCKET;
  const socketExists = socket && fs.existsSync(socket);

  const host = process.env.DB_HOST || "127.0.0.1";
  const isCloudHost = host !== "127.0.0.1" && host !== "localhost";
  const needsSSL = process.env.DB_SSL === "true" || (isCloudHost && process.env.DB_SSL !== "false");

  return mysql.createPool({
    socketPath: socketExists ? socket : undefined,
    host: host,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || process.env.DB_DATABASE || "rbac_mysql",
    ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
}

function getPool() {
  if (!poolInstance) {
    poolInstance = createConnectionPool();
  }
  return poolInstance;
}

const poolProxy = new Proxy(
  {},
  {
    get(target, prop) {
      const p = getPool();
      const val = p[prop];
      if (typeof val === "function") {
        return val.bind(p);
      }
      return val;
    },
  }
);

export default poolProxy;
export { getPool };
