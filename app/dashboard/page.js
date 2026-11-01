
"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/me");
        const data = await response.json();

        if (!response.ok) {
          window.location.href = "/login";
          return;
        }

        setUser(data.user);
        setPermissions(data.permissions || []);
      } catch {
        setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const can = (permission) =>
    permissions.includes("*") || permissions.includes(permission);

  const role = user?.role || "";
  const roleLabel = user?.roleName || role;

  const menu = [
    { label: "Dashboard", href: "/dashboard", icon: "⌂", show: true },
    { label: "จัดการข่าว", href: "/app/admin/news", icon: "▤", show: can("news:read") },
    { label: "จัดการผู้ใช้งาน", href: "/admin/users", icon: "♙", show: can("users:read") || can("user:manage") },
    { label: "หน้าข่าว", href: "/news", icon: "◉", show: true },
  ];

  if (loading) {
    return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;
  }

  if (error) {
    return <div style={styles.loading}>{error}</div>;
  }

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>R</div>
          <div>
            <strong>RBAC SYSTEM</strong>
            <small>Management Portal</small>
          </div>
        </div>

        <p style={styles.menuTitle}>เมนูหลัก</p>

        <nav>
          {menu.filter(item => item.show).map(item => (
            <a key={item.href} href={item.href} style={{
              ...styles.menuItem,
              ...(item.href === "/dashboard" ? styles.activeMenu : {})
            }}>
              <span style={styles.menuIcon}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={styles.sidebarBottom}>
          <div style={styles.avatar}>
            {(user?.fullName || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={styles.userName}>{user?.fullName || user?.full_name || user?.email}</strong>
            <small style={styles.userRole}>{roleLabel}</small>
          </div>
          <button onClick={logout} style={styles.logoutIcon} title="ออกจากระบบ">↪</button>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <p style={styles.breadcrumb}>หน้าหลัก / Dashboard</p>
            <h1 style={styles.heading}>Dashboard</h1>
            <p style={styles.subheading}>ภาพรวมระบบจัดการสิทธิ์การใช้งาน</p>
          </div>
          <div style={styles.headerBadge}>● ระบบออนไลน์</div>
        </header>

        <section style={styles.welcome}>
          <div>
            <p style={styles.welcomeEyebrow}>WELCOME BACK</p>
            <h2>ยินดีต้อนรับ {user?.fullName || user?.full_name || user?.email}</h2>
            <p>คุณเข้าสู่ระบบในฐานะ {roleLabel}</p>
          </div>
          <div style={styles.welcomeIcon}>✦</div>
        </section>

        <section style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>♙</div>
            <p>ชื่อผู้ใช้งาน</p>
            <strong>{user?.fullName || user?.full_name || "-"}</strong>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>✉</div>
            <p>อีเมล</p>
            <strong style={styles.email}>{user?.email || "-"}</strong>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>◆</div>
            <p>บทบาทของคุณ</p>
            <strong>{roleLabel}</strong>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>✓</div>
            <p>จำนวนสิทธิ์</p>
            <strong>{permissions.length} รายการ</strong>
          </div>
        </section>

        <section style={styles.contentGrid}>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h3>สิทธิ์การใช้งาน</h3>
                <p>Permissions ที่บัญชีของคุณได้รับ</p>
              </div>
              <span style={styles.count}>{permissions.length}</span>
            </div>

            <div style={styles.permissionList}>
              {permissions.map(permission => (
                <div key={permission} style={styles.permission}>
                  <span style={styles.check}>✓</span>
                  <span>{permission}</span>
                  <span style={styles.granted}>Granted</span>
                </div>
              ))}
              {permissions.length === 0 && <p>ไม่พบรายการสิทธิ์</p>}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h3>เมนูที่คุณใช้งานได้</h3>
                <p>แสดงตามสิทธิ์ของบัญชี</p>
              </div>
            </div>

            <div style={styles.quickLinks}>
              {menu.filter(item => item.show && item.href !== "/dashboard").map(item => (
                <a href={item.href} key={item.href} style={styles.quickLink}>
                  <span style={styles.quickIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={styles.arrow}>→</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          RBAC Management System · Next.js & MySQL
        </footer>
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#faf9f2",
    color: "#263b2c",
    fontFamily: "inherit",
  },
  sidebar: {
    width: 255,
    minWidth: 255,
    background: "#174c35",
    color: "#fffdf4",
    padding: "28px 18px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 45,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "#dcebcf",
    color: "#24583b",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
    fontWeight: "bold",
  },
  menuTitle: {
    color: "#b9d0bc",
    fontSize: 12,
    margin: "0 0 12px 10px",
  },
  menuItem: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "13px 14px",
    borderRadius: 10,
    color: "#e0eadf",
    textDecoration: "none",
    marginBottom: 7,
  },
  activeMenu: {
    background: "#dcebcf",
    color: "#24583b",
    fontWeight: "bold",
  },
  menuIcon: {
    width: 22,
    textAlign: "center",
    fontSize: 19,
  },
  sidebarBottom: {
    marginTop: "auto",
    borderTop: "1px solid #426d53",
    paddingTop: 22,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#dcebcf",
    color: "#24583b",
    display: "grid",
    placeItems: "center",
    fontWeight: "bold",
  },
  userName: {
    display: "block",
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userRole: {
    color: "#c3d7c4",
    fontSize: 11,
  },
  logoutIcon: {
    background: "transparent",
    border: 0,
    color: "#fff",
    cursor: "pointer",
    fontSize: 21,
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: "35px 42px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 28,
  },
  breadcrumb: {
    color: "#82917f",
    fontSize: 13,
  },
  heading: {
    fontSize: 30,
    margin: "8px 0",
    color: "#24583b",
  },
  subheading: {
    color: "#788777",
    margin: 0,
    fontSize: 14,
  },
  headerBadge: {
    color: "#286744",
    background: "#e3f1df",
    padding: "10px 15px",
    borderRadius: 30,
    fontSize: 12,
  },
  welcome: {
    background: "linear-gradient(120deg,#174c35,#47845b)",
    color: "#fffdf4",
    padding: "32px",
    borderRadius: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    boxShadow: "0 10px 25px rgba(31,78,52,0.12)",
  },
  welcomeEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    opacity: 0.75,
  },
  welcomeIcon: {
    fontSize: 55,
    opacity: 0.7,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: "#fffef9",
    padding: 21,
    borderRadius: 16,
    border: "1px solid #e7e6d8",
    minWidth: 0,
    boxShadow: "0 5px 18px rgba(40,65,43,0.04)",
  },
  cardIcon: {
    background: "#eaf1e5",
    color: "#39784e",
    width: 40,
    height: 40,
    borderRadius: 11,
    display: "grid",
    placeItems: "center",
    fontSize: 19,
  },
  email: {
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 18,
  },
  panel: {
    background: "#fffef9",
    border: "1px solid #e7e6d8",
    borderRadius: 17,
    padding: 23,
    minWidth: 0,
    boxShadow: "0 5px 18px rgba(40,65,43,0.04)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  count: {
    background: "#eaf1e5",
    color: "#286744",
    padding: "7px 12px",
    borderRadius: 20,
    fontWeight: "bold",
  },
  permissionList: {
    display: "grid",
    gap: 11,
  },
  permission: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    background: "#f4f6ed",
    borderRadius: 9,
    fontSize: 13,
    overflowWrap: "anywhere",
  },
  check: {
    color: "#39784e",
    fontWeight: "bold",
  },
  granted: {
    marginLeft: "auto",
    color: "#39784e",
    fontSize: 10,
  },
  quickLinks: {
    display: "grid",
    gap: 10,
  },
  quickLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "#f4f6ed",
    borderRadius: 10,
    color: "#315b3e",
    textDecoration: "none",
    fontSize: 14,
  },
  quickIcon: {
    fontSize: 20,
    color: "#39784e",
  },
  arrow: {
    marginLeft: "auto",
  },
  footer: {
    textAlign: "center",
    color: "#929b87",
    fontSize: 12,
    marginTop: 35,
  },
  loading: {
    padding: 50,
    textAlign: "center",
    fontFamily: "inherit",
    color: "#315b3e",
  },
};
