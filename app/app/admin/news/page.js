
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
  const [message, setMessage] = useState("");

  // ตรวจสอบสิทธิ์ของผู้ใช้งาน
  const canRead = permissions.includes("news:read");
  const canCreate = permissions.includes("news:create");
  const canUpdate = permissions.includes("news:update");
  const canDelete = permissions.includes("news:delete");

  // โหลดข้อมูลผู้ใช้และข่าว
  async function loadData() {
    try {
      setLoading(true);
      setMessage("");

      // ตรวจสอบข้อมูลผู้ใช้
      const meResponse = await fetch("/api/me", {
        cache: "no-store",
      });

      if (!meResponse.ok) {
        throw new Error("กรุณาเข้าสู่ระบบใหม่");
      }

      const meData = await meResponse.json();

      setRole(meData.user?.role || "");
      setPermissions(meData.permissions || []);

      // โหลดรายการข่าว
      const newsResponse = await fetch("/api/news", {
        cache: "no-store",
      });

      const newsData = await newsResponse.json();

      if (!newsResponse.ok) {
        throw new Error(
          newsData.message || "ไม่สามารถโหลดข่าวได้"
        );
      }

      setNews(newsData.news || []);

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ล้างแบบฟอร์ม
  function resetForm() {
    setTitle("");
    setContent("");
    setEditingId(null);
  }

  // เลือกข่าวเพื่อแก้ไข
  function editNews(item) {
    if (!canUpdate) {
      setMessage("คุณไม่มีสิทธิ์แก้ไขข่าว");
      return;
    }

    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // เพิ่มหรือแก้ไขข่าว
  async function saveNews(event) {
    event.preventDefault();
    setMessage("");

    if (editingId && !canUpdate) {
      setMessage("คุณไม่มีสิทธิ์แก้ไขข่าว");
      return;
    }

    if (!editingId && !canCreate) {
      setMessage("คุณไม่มีสิทธิ์เพิ่มข่าว");
      return;
    }

    try {
      const response = await fetch("/api/news", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          title,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "บันทึกข่าวไม่สำเร็จ"
        );
      }

      setMessage(data.message || "บันทึกข่าวสำเร็จ");

      resetForm();
      await loadData();

    } catch (error) {
      setMessage(error.message);
    }
  }

  // ลบข่าว
  async function deleteNews(id) {
    if (!canDelete) {
      setMessage("คุณไม่มีสิทธิ์ลบข่าว");
      return;
    }

    const confirmed = window.confirm(
      "คุณต้องการลบข่าวนี้ใช่หรือไม่?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/news", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "ลบข่าวไม่สำเร็จ"
        );
      }

      setMessage(data.message || "ลบข่าวสำเร็จ");
      await loadData();

    } catch (error) {
      setMessage(error.message);
    }
  }

  // ระหว่างโหลดข้อมูล
  if (loading) {
    return (
      <main style={{ padding: 30 }}>
        กำลังโหลดข้อมูล...
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "30px auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>News Management</h1>

      <p>ระบบจัดการข่าวสารและประชาสัมพันธ์</p>

      <p>
        <strong>บทบาทปัจจุบัน:</strong>{" "}
        {role || "ไม่ทราบบทบาท"}
      </p>

      <p>
        <Link href="/dashboard">
          กลับหน้าหลัก
        </Link>
        {" | "}
        <Link href="/news">
          ดูหน้าข่าว
        </Link>
      </p>

      <button
        type="button"
        onClick={loadData}
        style={{
          padding: "8px 15px",
          marginBottom: 15,
          cursor: "pointer",
        }}
      >
        รีเฟรชข้อมูล
      </button>

      {message && (
        <p
          style={{
            padding: 12,
            background: "#eef6ff",
            borderRadius: 6,
          }}
        >
          {message}
        </p>
      )}

      {!canRead ? (
        <p>คุณไม่มีสิทธิ์อ่านข่าว</p>
      ) : (
        <>
          {/* แบบฟอร์มเพิ่มและแก้ไขข่าว */}
          {(canCreate || (editingId && canUpdate)) && (
            <section
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 20,
                marginTop: 25,
                marginBottom: 30,
              }}
            >
              <h2>
                {editingId ? "แก้ไขข่าว" : "เพิ่มข่าวใหม่"}
              </h2>

              <form onSubmit={saveNews}>
                <label>หัวข้อข่าว</label>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={255}
                  required
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 12,
                    margin: "8px 0 16px",
                    boxSizing: "border-box",
                  }}
                />

                <label>รายละเอียดข่าว</label>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={6}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: 12,
                    margin: "8px 0 16px",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    marginRight: 10,
                    cursor: "pointer",
                  }}
                >
                  {editingId
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มข่าว"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                  >
                    ยกเลิก
                  </button>
                )}
              </form>
            </section>
          )}

          {/* รายการข่าว */}
          <h2>
            รายการข่าวทั้งหมด ({news.length})
          </h2>

          {news.length === 0 ? (
            <p>ยังไม่มีข่าวสารในระบบ</p>
          ) : (
            news.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 18,
                  marginBottom: 15,
                }}
              >
                <h3>{item.title}</h3>

                <p style={{ whiteSpace: "pre-wrap" }}>
                  {item.content}
                </p>

                <small>
                  ผู้เขียน: {item.author_name || "ไม่ระบุ"}
                  {" | "}
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("th-TH")
                    : ""}
                </small>

                <div style={{ marginTop: 15 }}>
                  {/* แสดงปุ่มแก้ไขเฉพาะผู้มีสิทธิ์ */}
                  {canUpdate && (
                    <button
                      onClick={() => editNews(item)}
                      style={{
                        marginRight: 10,
                        cursor: "pointer",
                      }}
                    >
                      แก้ไข
                    </button>
                  )}

                  {/* แสดงปุ่มลบเฉพาะผู้มีสิทธิ์ */}
                  {canDelete && (
                    <button
                      onClick={() => deleteNews(item.id)}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      ลบข่าว
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </>
      )}
    </main>
  );
}
