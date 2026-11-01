"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminNewsPage() {
  const [news, setNews] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const canRead = permissions.includes("news:read");
  const canCreate = permissions.includes("news:create");
  const canUpdate = permissions.includes("news:update");
  const canDelete = permissions.includes("news:delete");

  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      const meResponse = await fetch("/api/me", {
        cache: "no-store",
      });

      if (!meResponse.ok) throw new Error("กรุณาเข้าสู่ระบบใหม่");

      const meData = await meResponse.json();
      setRole(meData.user?.role || "");
      setPermissions(meData.permissions || []);

      const newsResponse = await fetch("/api/news", {
        cache: "no-store",
      });

      const newsData = await newsResponse.json();

      if (!newsResponse.ok) {
        throw new Error(newsData.message || "ไม่สามารถโหลดข่าวได้");
      }

      setNews(newsData.news || []);
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  function editNews(item) {
    if (!canUpdate) {
      setMessage("คุณไม่มีสิทธิ์แก้ไขข่าว");
      setMessageType("error");
      return;
    }

    setEditingId(item.id);
    setTitle(item.title || "");
    setContent(item.content || "");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveNews(event) {
    event.preventDefault();
    setMessage("");

    if (editingId && !canUpdate) {
      setMessage("คุณไม่มีสิทธิ์แก้ไขข่าว");
      setMessageType("error");
      return;
    }

    if (!editingId && !canCreate) {
      setMessage("คุณไม่มีสิทธิ์เพิ่มข่าว");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/news", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, title, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "บันทึกข่าวไม่สำเร็จ");
      }

      setMessage(data.message || "บันทึกข่าวสำเร็จ");
      setMessageType("success");
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteNews(id) {
    if (!canDelete) {
      setMessage("คุณไม่มีสิทธิ์ลบข่าว");
      setMessageType("error");
      return;
    }

    if (!window.confirm("คุณต้องการลบข่าวนี้ใช่หรือไม่?")) return;

    try {
      const response = await fetch("/api/news", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ลบข่าวไม่สำเร็จ");
      }

      setMessage(data.message || "ลบข่าวสำเร็จ");
      setMessageType("success");
      await loadData();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    }
  }

  if (loading) {
    return (
      <main className="loading-page">
        <div className="loader">🌱</div>
        <p>กำลังเตรียมข้อมูลข่าวสาร...</p>
        <style jsx>{`
          .loading-page {
            min-height: 100vh;
            display: grid;
            place-content: center;
            text-align: center;
            background: #f5f8f1;
            color: #45634b;
            font-family: inherit;
          }
          .loader { font-size: 48px; animation: bounce 1s infinite alternate; }
          @keyframes bounce { to { transform: translateY(-10px); } }
        `}</style>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-icon">🌱</span>
          <span>ปลูกรัก <small>ตลาดผลผลิตจากชุมชน</small></span>
        </Link>
        <nav>
          <Link href="/dashboard">หน้าหลัก</Link>
          <Link href="/news">หน้าข่าวสาร</Link>
          <Link href="/">หน้าเว็บไซต์</Link>
        </nav>
      </header>

      <div className="container">
        <section className="welcome">
          <div>
            <span className="eyebrow">COMMUNITY MANAGEMENT</span>
            <h1>จัดการข่าวสาร <span>📰</span></h1>
            <p>สร้างและเผยแพร่ข่าวสาร เพื่อเชื่อมโยงเรื่องราวดี ๆ ของชุมชน</p>
          </div>
          <div className="welcome-icon">🌿</div>
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon green">📰</div>
            <div><span>ข่าวทั้งหมด</span><strong>{news.length}</strong></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">✍️</div>
            <div><span>บทบาทผู้ใช้งาน</span><strong className="role-text">{role || "ไม่ทราบ"}</strong></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">🔐</div>
            <div><span>สิทธิ์การจัดการ</span><strong>{[canRead, canCreate, canUpdate, canDelete].filter(Boolean).length} / 4</strong></div>
          </div>
        </section>

        {message && (
          <div className={`notice ${messageType}`}>
            <span>{messageType === "success" ? "✓" : messageType === "error" ? "!" : "ℹ"}</span>
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <div className="toolbar">
          <div>
            <h2>พื้นที่จัดการข่าว</h2>
            <p>จัดการเนื้อหาประชาสัมพันธ์ของชุมชน</p>
          </div>
          <button className="refresh-btn" onClick={loadData}>↻ รีเฟรชข้อมูล</button>
        </div>

        {!canRead ? (
          <section className="empty-state">
            <div>🔒</div>
            <h2>ไม่มีสิทธิ์เข้าถึงข่าวสาร</h2>
            <p>บัญชีของคุณไม่ได้รับอนุญาตให้อ่านข่าว</p>
          </section>
        ) : (
          <>
            {(canCreate || (editingId && canUpdate)) && (
              <section className="form-card">
                <div className="section-heading">
                  <div className="heading-icon">{editingId ? "✏️" : "📝"}</div>
                  <div>
                    <h2>{editingId ? "แก้ไขข่าวสาร" : "เขียนข่าวใหม่"}</h2>
                    <p>{editingId ? "ปรับปรุงรายละเอียดข่าวของคุณ" : "แบ่งปันข่าวสารและเรื่องราวดี ๆ กับชุมชน"}</p>
                  </div>
                </div>

                <form onSubmit={saveNews}>
                  <label htmlFor="news-title">หัวข้อข่าว</label>
                  <input
                    id="news-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    placeholder="กรอกหัวข้อข่าวที่ต้องการเผยแพร่..."
                    required
                  />

                  <label htmlFor="news-content">รายละเอียดข่าว</label>
                  <textarea
                    id="news-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                    placeholder="เขียนรายละเอียดข่าวสารที่นี่..."
                    required
                  />

                  <div className="form-actions">
                    <button className="submit-btn" type="submit" disabled={saving}>
                      {saving ? "กำลังบันทึก..." : editingId ? "✓ บันทึกการแก้ไข" : "＋ เผยแพร่ข่าว"}
                    </button>
                    {editingId && (
                      <button className="cancel-btn" type="button" onClick={resetForm}>
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}

            <section className="news-section">
              <div className="section-heading list-heading">
                <div>
                  <h2>ข่าวสารทั้งหมด</h2>
                  <p>รายการข่าวที่อยู่ในระบบปลูกรัก</p>
                </div>
                <span className="count-badge">{news.length} ข่าว</span>
              </div>

              {news.length === 0 ? (
                <div className="empty-state">
                  <div>🌱</div>
                  <h2>ยังไม่มีข่าวสาร</h2>
                  <p>เริ่มต้นแบ่งปันข่าวดี ๆ ให้กับชุมชนได้เลย</p>
                </div>
              ) : (
                <div className="news-grid">
                  {news.map((item) => (
                    <article className="news-card" key={item.id}>
                      <div className="news-card-top">
                        <span className="news-tag">🌿 ข่าวชุมชน</span>
                        <span className="news-date">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("th-TH", {
                                day: "numeric", month: "short", year: "numeric"
                              })
                            : "ไม่ระบุวันที่"}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      <p className="news-content">{item.content}</p>
                      <div className="news-footer">
                        <div className="author">
                          <span>👤</span>
                          <span>{item.author_name || "ผู้ดูแลระบบ"}</span>
                        </div>
                        <div className="actions">
                          {canUpdate && (
                            <button className="edit-btn" onClick={() => editNews(item)}>✏️ แก้ไข</button>
                          )}
                          {canDelete && (
                            <button className="delete-btn" onClick={() => deleteNews(item.id)}>🗑 ลบ</button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <footer className="footer">
        <span>🌱 ปลูกรัก</span>
        <p>เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง</p>
        <small>© 2026 ปลูกรัก · ตลาดผลผลิตจากชุมชน</small>
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; }
        .admin-page {
          min-height: 100vh;
          background: #f5f7f1;
          color: #263b2b;
          font-family: inherit;
        }
        .topbar {
          height: 76px;
          padding: 0 max(calc((100% - 1120px) / 2), 24px);
          background: rgba(255,255,255,.96);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e8eee5;
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
        nav { display: flex; gap: 28px; }
        nav a {
          color: #526456;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
        }
        nav a:hover { color: #26834a; }
        .container { max-width: 1120px; margin: auto; padding: 42px 24px 70px; }
        .welcome {
          background: linear-gradient(120deg, #194e31, #317a48);
          color: white;
          border-radius: 24px;
          padding: 38px 44px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow: hidden;
          position: relative;
          box-shadow: 0 12px 30px #285d381c;
        }
        .eyebrow { font-size: 11px; letter-spacing: 2px; color: #c7e7c9; font-weight: 700; }
        .welcome h1 { font-size: 34px; margin: 12px 0 8px; }
        .welcome p { color: #e0eee1; margin: 0; font-size: 14px; }
        .welcome-icon { font-size: 90px; opacity: .9; margin-right: 25px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin: 25px 0 38px; }
        .stat-card {
          background: white; border: 1px solid #e9eee7; border-radius: 17px;
          padding: 20px; display: flex; align-items: center; gap: 15px;
          box-shadow: 0 5px 18px #294b2b08;
        }
        .stat-icon { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; font-size: 23px; }
        .green { background: #e7f4e8; }
        .orange { background: #fff1df; }
        .blue { background: #e8f1ff; }
        .stat-card span { display: block; color: #829084; font-size: 12px; margin-bottom: 5px; }
        .stat-card strong { font-size: 23px; color: #294b32; }
        .stat-card .role-text { font-size: 17px; }
        .notice { padding: 14px 17px; border-radius: 12px; margin: 20px 0; display: flex; align-items: center; gap: 10px; font-size: 14px; }
        .notice button { margin-left: auto; border: 0; background: transparent; font-size: 22px; cursor: pointer; color: inherit; }
        .success { background: #e6f5e9; color: #24713b; border: 1px solid #c8e8ce; }
        .error { background: #fff0ed; color: #b63b2d; border: 1px solid #f5d2cc; }
        .info { background: #edf4ff; color: #315e9b; border: 1px solid #d5e4fa; }
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
        .toolbar h2, .section-heading h2 { margin: 0; font-size: 21px; color: #294b32; }
        .toolbar p, .section-heading p { margin: 6px 0 0; color: #89958a; font-size: 13px; }
        button { font-family: inherit; }
        .refresh-btn, .cancel-btn {
          border: 1px solid #dce7dc; background: white; color: #45634b;
          padding: 10px 16px; border-radius: 10px; cursor: pointer; font-weight: 600;
        }
        .refresh-btn:hover, .cancel-btn:hover { background: #edf5ed; }
        .form-card, .news-section {
          background: white; border: 1px solid #e8eee6; border-radius: 20px;
          padding: 27px; margin-bottom: 28px; box-shadow: 0 6px 22px #294b2b08;
        }
        .section-heading { display: flex; align-items: center; gap: 13px; margin-bottom: 23px; }
        .heading-icon { width: 46px; height: 46px; background: #eaf5e9; border-radius: 13px; display: grid; place-items: center; font-size: 22px; }
        form label { display: block; font-size: 13px; font-weight: 700; color: #425847; margin: 17px 0 8px; }
        form input, form textarea {
          width: 100%; border: 1px solid #dfe8de; background: #fbfdf9;
          border-radius: 11px; padding: 13px 15px; font: inherit; font-size: 14px;
          color: #263b2b; outline: none; transition: .2s;
        }
        form input:focus, form textarea:focus { border-color: #4d9a5d; box-shadow: 0 0 0 3px #4d9a5d18; background: white; }
        form textarea { resize: vertical; line-height: 1.7; }
        .form-actions { display: flex; gap: 10px; margin-top: 20px; }
        .submit-btn {
          border: 0; background: #287444; color: white; border-radius: 10px;
          padding: 12px 22px; font-weight: 700; cursor: pointer;
        }
        .submit-btn:hover { background: #1d5d35; }
        .submit-btn:disabled { opacity: .6; cursor: wait; }
        .list-heading { justify-content: space-between; }
        .count-badge { background: #eaf5e9; color: #347447; padding: 8px 13px; border-radius: 20px; font-size: 12px; font-weight: 700; }
        .news-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 17px; }
        .news-card { border: 1px solid #e8eee6; border-radius: 16px; padding: 21px; background: #fff; transition: .2s; min-width: 0; }
        .news-card:hover { border-color: #b8d5b9; box-shadow: 0 8px 22px #294b2b0d; transform: translateY(-2px); }
        .news-card-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .news-tag { background: #edf6eb; color: #43804a; padding: 6px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .news-date { color: #99a399; font-size: 11px; }
        .news-card h3 { font-size: 18px; line-height: 1.5; margin: 17px 0 9px; color: #2d4933; overflow-wrap: anywhere; }
        .news-content { font-size: 13px; color: #6e7d70; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; }
        .news-footer { border-top: 1px solid #edf0eb; padding-top: 14px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
        .author { color: #859187; font-size: 12px; display: flex; gap: 7px; align-items: center; }
        .actions { display: flex; gap: 7px; }
        .edit-btn, .delete-btn { padding: 8px 11px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .edit-btn { border: 1px solid #dce9d9; background: #f0f7ed; color: #397346; }
        .delete-btn { border: 1px solid #f3d8d3; background: #fff2ef; color: #b94c3e; }
        .empty-state { text-align: center; padding: 55px 20px; color: #879488; }
        .empty-state div { font-size: 45px; }
        .empty-state h2 { color: #385540; font-size: 20px; margin: 14px 0 7px; }
        .empty-state p { font-size: 13px; }
        .footer { text-align: center; padding: 30px 20px; background: #fff; border-top: 1px solid #e8eee6; color: #819083; }
        .footer span { font-size: 20px; font-weight: 800; color: #347447; }
        .footer p { font-size: 12px; }
        .footer small { font-size: 11px; }
        @media (max-width: 700px) {
          .topbar { height: auto; min-height: 68px; padding: 13px 18px; flex-wrap: wrap; gap: 12px; }
          nav { width: 100%; gap: 18px; overflow-x: auto; padding-bottom: 4px; }
          nav a { white-space: nowrap; font-size: 12px; }
          .container { padding: 25px 15px 45px; }
          .welcome { padding: 27px 23px; border-radius: 18px; }
          .welcome h1 { font-size: 27px; }
          .welcome p { line-height: 1.7; max-width: 260px; }
          .welcome-icon { font-size: 57px; margin: 0; }
          .stats { grid-template-columns: 1fr; gap: 10px; margin: 17px 0 28px; }
          .stat-card { padding: 14px 17px; }
          .toolbar { align-items: flex-start; gap: 12px; flex-wrap: wrap; }
          .form-card, .news-section { padding: 19px 15px; border-radius: 16px; }
          .news-grid { grid-template-columns: 1fr; }
          .news-card { padding: 17px; }
          .news-card-top { align-items: flex-start; flex-direction: column; }
          .form-actions { flex-wrap: wrap; }
        }
      `}</style>
    </main>
  );
}
