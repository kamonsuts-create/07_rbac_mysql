import mysql from "mysql2/promise";

let connection;

try {
  connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const [rows] = await connection.query(`
    SELECT DATABASE() AS database_name,
           VERSION() AS mysql_version
  `);

  console.log("เชื่อมต่อ MySQL สำเร็จ!");
  console.log("Database:", rows[0].database_name);
  console.log("MySQL version:", rows[0].mysql_version);
} catch (error) {
  console.error("เชื่อมต่อไม่สำเร็จ:", error.message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
