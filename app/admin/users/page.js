"use client";

import { useEffect, useState } from "react";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "User" },
  { value: "farmer", label: "Farmer (เกษตรกร)" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState("user");

  async function loadUsers(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "ไม่สามารถโหลดข้อมูลได้");
        setMessageType("error");
        setUsers([]);
        return false;
      }

      setUsers(data.users || []);
      setRoles(
        Object.fromEntries(
          (data.users || []).map((user) => [
            user.id,
            user.role_code,
          ])
        )
      );

      return true;
    } catch (error) {
      console.error(error);
      setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      setMessageType("error");
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function createUser(event) {
    event.preventDefault();
    setCreating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          roleCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "สร้างสมาชิกไม่สำเร็จ");
      }

      setFullName("");
      setEmail("");
      setPassword("");
      setRoleCode("user");

      await loadUsers(false);

      setMessage(data.message || "สร้างสมาชิกสำเร็จ");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setCreating(false);
    }
  }

  function handleRoleChange(userId, newRole) {
    setRoles((previous) => ({
      ...previous,
      [userId]: newRole,
    }));
  }

  async function updateRole(userId) {
    const selectedRole = roles[userId];
    if (!selectedRole) return;

    setSavingId(userId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          roleCode: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เปลี่ยนบทบาทไม่สำเร็จ");
      }

      await loadUsers(false);
      setMessage(data.message || "เปลี่ยนบทบาทสำเร็จ");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  const roleCount = (role) =>
    users.filter((user) => user.role_code === role).length;

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loader">🌱</div>
        <p>กำลังเตรียมข้อมูลสมาชิก...</p>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: grid;
            place-content: center;
            text-align: center;
            background: #faf9f2;
            color: #45634b;
            font-family: inherit;
          }
          .loader {
            font-size: 48px;
            animation: bounce 1s infinite alternate;
          }
          @keyframes bounce {
            to { transform: translateY(-10px); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="topbar">
        <a href="/" className="brand">
          <span className="brand-icon">🌱</span>
          <span>
            ปลูกรัก
            <small>ตลาดผลผลิตจากชุมชน</small>
          </span>
        </a>

        <nav>
          <a href="/dashboard">หน้าหลัก</a>
          <a href="/admin/news">จัดการข่าว</a>
          <a href="/">หน้าเว็บไซต์</a>
        </nav>

        <button className="logout-btn" onClick={logout}>
          ออกจากระบบ
        </button>
      </header>

      <div className="container">
        <section className="hero">
          <div>
            <span className="eyebrow">COMMUNITY MANAGEMENT</span>
            <h1>จัดการสมาชิก <span>👥</span></h1>
            <p>
              ดูแลบัญชีผู้ใช้งานและกำหนดสิทธิ์ให้เหมาะสมกับสมาชิกแต่ละคน
            </p>
          </div>
          <div className="hero-icon">🌿</div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon green">👥</div>
            <div>
              <span>สมาชิกทั้งหมด</span>
              <strong>{users.length}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">🛡️</div>
            <div>
              <span>ผู้ดูแลระบบ</span>
              <strong>{roleCount("admin")}</strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🌾</div>
            <div>
              <span>เกษตรกร</span>
              <strong>{roleCount("farmer")}</strong>
            </div>
          </div>
        </section>

        {message && (
          <div className={`notice ${messageType}`} role="alert">
            <span>
              {messageType === "success"
                ? "✓"
                : messageType === "error"
                ? "!"
                : "ℹ"}
            </span>
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <section className="form-card">
          <div className="section-heading">
            <div className="heading-icon">📝</div>
            <div>
              <h2>เพิ่มสมาชิกใหม่</h2>
              <p>สร้างบัญชีและกำหนดบทบาทให้สมาชิกในระบบ</p>
            </div>
          </div>

          <form onSubmit={createUser}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="fullName">ชื่อ-นามสกุล</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="กรอกชื่อ-นามสกุล"
                  maxLength={255}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="email">อีเมล</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">รหัสผ่าน</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  minLength={8}
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="roleCode">กำหนดบทบาท</label>
                <select
                  id="roleCode"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-bottom">
              <p>🔒 กรุณากำหนดบทบาทให้ตรงกับหน้าที่ของสมาชิก</p>
              <button
                type="submit"
                className="create-btn"
                disabled={creating}
              >
                {creating ? "กำลังสร้างบัญชี..." : "＋ สร้างสมาชิก"}
              </button>
            </div>
          </form>
        </section>

        <section className="users-card">
          <div className="section-heading list-heading">
            <div>
              <h2>รายชื่อผู้ใช้งาน</h2>
              <p>จัดการบทบาทและตรวจสอบสถานะสมาชิกในระบบ</p>
            </div>
            <button
              className="refresh-btn"
              onClick={() => loadUsers()}
              disabled={loading}
            >
              ↻ รีเฟรชข้อมูล
            </button>
          </div>

          <div className="table-summary">
            พบสมาชิกทั้งหมด <strong>{users.length}</strong> บัญชี
          </div>

          {users.length === 0 ? (
            <div className="empty-state">
              <div>🌱</div>
              <h3>ยังไม่มีข้อมูลสมาชิก</h3>
              <p>เมื่อมีสมาชิกในระบบ รายชื่อจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>สมาชิก</th>
                    <th>อีเมล</th>
                    <th>บทบาท</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const selectedRole =
                      roles[user.id] ?? user.role_code;
                    const changed =
                      selectedRole !== user.role_code;

                    return (
                      <tr key={user.id}>
                        <td className="id-cell">#{user.id}</td>
                        <td>
                          <strong className="user-name">
                            {user.full_name}
                          </strong>
                        </td>
                        <td className="email-cell">{user.email}</td>
                        <td>
                          <select
                            className="role-select"
                            value={selectedRole}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={savingId === user.id}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                          {changed && (
                            <small className="changed-label">
                              มีการเปลี่ยนแปลง
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className={`status ${
                              user.is_active ? "active" : "inactive"
                            }`}
                          >
                            {user.is_active ? "● ใช้งาน" : "● ปิดใช้งาน"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="save-btn"
                            onClick={() => updateRole(user.id)}
                            disabled={!changed || savingId === user.id}
                          >
                            {savingId === user.id
                              ? "กำลังบันทึก..."
                              : "บันทึก"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <footer className="footer">
        <span>🌱 ปลูกรัก</span>
        <p>เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง</p>
        <small>© 2026 ปลูกรัก · ตลาดผลผลิตจากชุมชน</small>
      </footer>

      <style jsx>{`
        .admin-page {
          min-height: 100vh;
          background: #faf9f2;
          color: #294333;
          font-family: inherit;
        }

        .topbar {
          min-height: 76px;
          padding: 12px max(calc((100% - 1120px) / 2), 24px);
          background: rgba(255,255,255,.97);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #e8ede3;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(12px);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #245b36;
          text-decoration: none;
          font-size: 21px;
          font-weight: 800;
        }

        .brand-icon { font-size: 32px; }
        .brand small {
          display: block;
          color: #829184;
          font-size: 10px;
          font-weight: 500;
          margin-top: 3px;
        }

        nav { display: flex; gap: 25px; }
        nav a {
          color: #526456;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }
        nav a:hover { color: #26834a; }

        button, input, select { font: inherit; }
        button { cursor: pointer; }

        .logout-btn {
          padding: 10px 17px;
          border: 0;
          border-radius: 10px;
          background: #edf5eb;
          color: #315f40;
          font-weight: 700;
        }
        .logout-btn:hover { background: #dcebd9; }

        .container {
          max-width: 1120px;
          margin: auto;
          padding: 40px 24px 65px;
        }

        .hero {
          background: linear-gradient(120deg, #194e31, #317a48);
          color: white;
          border-radius: 24px;
          padding: 38px 44px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(40,90,50,.10);
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 2px;
          color: #c7e7c9;
          font-weight: 700;
        }

        .hero h1 { font-size: 34px; margin: 12px 0 8px; }
        .hero p {
          color: #e0eee1;
          margin: 0;
          font-size: 14px;
          line-height: 1.8;
        }
        .hero-icon { font-size: 86px; margin-right: 25px; }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin: 25px 0 30px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e9eee7;
          border-radius: 17px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 5px 18px rgba(41,75,43,.04);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 23px;
        }
        .green { background: #e7f4e8; }
        .orange { background: #fff1df; }
        .blue { background: #e8f1ff; }

        .stat-card span {
          display: block;
          color: #829084;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .stat-card strong { font-size: 24px; color: #294b32; }

        .notice {
          padding: 14px 17px;
          border-radius: 12px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }
        .notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          font-size: 22px;
          color: inherit;
        }
        .success {
          background: #e6f5e9;
          color: #24713b;
          border: 1px solid #c8e8ce;
        }
        .error {
          background: #fff0ed;
          color: #b63b2d;
          border: 1px solid #f5d2cc;
        }
        .info {
          background: #edf4ff;
          color: #315e9b;
          border: 1px solid #d5e4fa;
        }

        .form-card, .users-card {
          background: white;
          border: 1px solid #e8eee6;
          border-radius: 20px;
          padding: 27px;
          margin-bottom: 25px;
          box-shadow: 0 6px 22px rgba(41,75,43,.04);
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 23px;
        }
        .heading-icon {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          background: #eaf5e9;
          border-radius: 13px;
          display: grid;
          place-items: center;
          font-size: 22px;
        }
        .section-heading h2 {
          margin: 0;
          font-size: 21px;
          color: #294b32;
        }
        .section-heading p {
          margin: 6px 0 0;
          color: #89958a;
          font-size: 13px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .field { min-width: 0; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #425847;
          margin-bottom: 8px;
        }
        .field input, .field select {
          width: 100%;
          min-height: 46px;
          border: 1px solid #dfe8de;
          background: #fbfdf9;
          border-radius: 11px;
          padding: 11px 14px;
          color: #263b2b;
          outline: none;
        }
        .field input:focus, .field select:focus {
          border-color: #4d9a5d;
          box-shadow: 0 0 0 3px rgba(77,154,93,.12);
          background: white;
        }

        .form-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 22px;
        }
        .form-bottom p {
          color: #89958a;
          font-size: 12px;
          margin: 0;
        }
        .create-btn {
          border: 0;
          background: #287444;
          color: white;
          border-radius: 10px;
          padding: 12px 22px;
          font-weight: 700;
        }
        .create-btn:hover { background: #1d5d35; }
        .create-btn:disabled { opacity: .6; cursor: wait; }

        .list-heading { justify-content: space-between; }
        .refresh-btn {
          border: 1px solid #dce7dc;
          background: #f5f8f2;
          color: #45634b;
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
        }
        .refresh-btn:hover { background: #eaf3e8; }

        .table-summary {
          color: #829084;
          font-size: 12px;
          margin: 0 0 12px;
        }
        .table-summary strong { color: #347447; }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #e8eee6;
          border-radius: 13px;
        }
        table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: left;
        }
        th {
          padding: 15px 14px;
          background: #edf4e9;
          color: #315b3e;
          font-size: 12px;
          white-space: nowrap;
          border-bottom: 1px solid #dce6d7;
        }
        td {
          padding: 14px;
          border-bottom: 1px solid #edf0eb;
          color: #526456;
          font-size: 13px;
          vertical-align: middle;
        }
        tbody tr:last-child td { border-bottom: 0; }
        tbody tr:hover { background: #fbfdf9; }
        .id-cell { color: #89958a; font-weight: 600; }
        .user-name { color: #294b32; }
        .email-cell { overflow-wrap: anywhere; }

        .role-select {
          min-width: 145px;
          padding: 9px 10px;
          border: 1px solid #d4dfd0;
          border-radius: 9px;
          background: #fffef9;
          color: #315b3e;
        }
        .changed-label {
          display: block;
          color: #b07824;
          font-size: 10px;
          margin-top: 5px;
        }

        .status {
          display: inline-block;
          white-space: nowrap;
          padding: 6px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }
        .active { background: #e8f5e9; color: #347447; }
        .inactive { background: #fff0ed; color: #b64b3d; }

        .save-btn {
          padding: 9px 15px;
          background: #39784e;
          color: white;
          border: 0;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .save-btn:hover:not(:disabled) { background: #285f3b; }
        .save-btn:disabled { opacity: .4; cursor: not-allowed; }

        .empty-state {
          text-align: center;
          padding: 45px 20px;
          color: #879488;
        }
        .empty-state div { font-size: 42px; }
        .empty-state h3 {
          color: #385540;
          font-size: 18px;
          margin: 12px 0 6px;
        }
        .empty-state p { font-size: 13px; }

        .footer {
          text-align: center;
          padding: 30px 20px;
          background: white;
          border-top: 1px solid #e8eee6;
          color: #819083;
        }
        .footer span {
          font-size: 20px;
          font-weight: 800;
          color: #347447;
        }
        .footer p { font-size: 12px; }
        .footer small { font-size: 11px; }

        @media (max-width: 700px) {
          .topbar {
            padding: 13px 17px;
            flex-wrap: wrap;
            gap: 12px;
          }
          nav {
            order: 3;
            width: 100%;
            gap: 18px;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          nav a { white-space: nowrap; font-size: 12px; }
          .brand { font-size: 19px; }
          .logout-btn { margin-left: auto; font-size: 12px; }

          .container { padding: 25px 15px 45px; }
          .hero { padding: 27px 22px; border-radius: 18px; }
          .hero h1 { font-size: 27px; }
          .hero p { line-height: 1.7; max-width: 270px; }
          .hero-icon { font-size: 55px; margin: 0; }

          .stats {
            grid-template-columns: 1fr;
            gap: 10px;
            margin: 17px 0 25px;
          }
          .stat-card { padding: 14px 17px; }
          .stat-icon { width: 42px; height: 42px; }

          .form-card, .users-card {
            padding: 19px 14px;
            border-radius: 16px;
          }
          .form-grid { grid-template-columns: 1fr; gap: 15px; }
          .form-bottom { align-items: stretch; }
          .create-btn { width: 100%; }
          .section-heading h2 { font-size: 18px; }
          .list-heading { align-items: flex-start; flex-wrap: wrap; }
          .refresh-btn { width: 100%; }
        }

        @media (max-width: 380px) {
          .hero-icon { display: none; }
        }
      `}</style>
    </main>
  );
}
