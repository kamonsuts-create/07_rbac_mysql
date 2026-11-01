import pool from "./db";

export async function getUserPermissions(userId) {
  const [rows] = await pool.execute(
    `SELECT p.code
     FROM users u
     JOIN roles r ON r.id = u.role_id
     JOIN role_permissions rp ON rp.role_id = r.id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = ? AND u.is_active = TRUE`,
    [userId]
  );

  return rows.map((row) => row.code);
}

export async function hasPermission(userId, permission) {
  const permissions = await getUserPermissions(userId);

  return (
    permissions.includes("*") ||
    permissions.includes(permission)
  );
}

export async function getRoleByCode(code) {
  const [rows] = await pool.execute(
    "SELECT id, code, name FROM roles WHERE code = ? LIMIT 1",
    [code]
  );

  return rows[0] || null;
}
