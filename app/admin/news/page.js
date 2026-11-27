"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";

export default function AdminNewsPage() {
  const router = useRouter();
  const [news, setNews] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const canRead = permissions.includes("*") || permissions.includes("news:read");
  const canCreate = permissions.includes("*") || permissions.includes("news:create");
  const canUpdate = permissions.includes("*") || permissions.includes("news:update");
  const canDelete = permissions.includes("*") || permissions.includes("news:delete");

  async function loadData() {
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const meResponse = await fetch("/api/me", { cache: "no-store" });
      if (!meResponse.ok) {
        router.replace("/login");
        return;
      }

      const meData = await meResponse.json();
      setRole(meData.user?.role || "");
      setUserName(meData.user?.fullName || "");
      setPermissions(meData.permissions || []);

      const newsResponse = await fetch("/api/news", { cache: "no-store" });
      const newsData = await newsResponse.json();

      if (!newsResponse.ok) {
        throw new Error(newsData.message || "ไม่สามารถโหลดข้อมูลข่าวได้");
      }

      setNews(newsData.news || []);
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
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
      setMessage({ text: "คุณไม่มีสิทธิ์แก้ไขข่าวสาร", type: "error" });
      return;
    }
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setMessage({ text: "", type: "" });
    window.scrollTo({ top: 120, behavior: "smooth" });
  }

  async function saveNews(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage({ text: "กรุณากรอกหัวข้อและเนื้อหาข่าว", type: "error" });
      return;
    }

    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const method = editingId ? "PATCH" : "POST";
      const response = await fetch("/api/news", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "บันทึกข่าวไม่สำเร็จ");
      }

      setMessage({
        text: editingId ? "แก้ไขข่าวสารสำเร็จแล้ว" : "เพิ่มข่าวสารใหม่เรียบร้อยแล้ว",
        type: "success",
      });

      resetForm();
      await loadData();
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteNews(id) {
    if (!canDelete) {
      setMessage({ text: "คุณไม่มีสิทธิ์ลบข่าวสาร", type: "error" });
      return;
    }

    const confirmed = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?");
    if (!confirmed) return;

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

      setMessage({ text: "ลบข่าวสารเรียบร้อยแล้ว", type: "success" });
      await loadData();
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb]">
        <PlukrakNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#2f8239] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#2e4732]">กำลังโหลดข้อมูลข่าวสาร...</p>
          </div>
        </main>
        <PlukrakFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e2ead8]">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
            <Link href="/admin" className="text-[#2f8239] hover:underline">
              ← กลับสู่ศูนย์ควบคุมผู้ดูแล
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[#5d6e5a]">จัดการข่าวสารและบทความ</span>
          </div>

          <Link
            href="/news"
            target="_blank"
            className="text-xs font-bold text-[#2f8239] hover:underline flex items-center gap-1"
          >
            <span>ดูหน้าข่าวจริง</span>
            <span>↗</span>
          </Link>
        </div>

        {/* Status Message */}
        {message.text && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-center justify-between font-bold ${
              message.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <span>{message.type === "error" ? "⚠️" : "✅"} {message.text}</span>
            <button onClick={() => setMessage({ text: "", type: "" })} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Create / Edit Form */}
        {(canCreate || canUpdate) && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2ead8] shadow-xs">
            <h2 className="text-lg sm:text-xl font-black text-[#152e1c] mb-4 pb-3 border-b border-[#e2ead8]">
              {editingId ? "✏️ แก้ไขบทความข่าวสาร" : "📰 เผยแพร่ข่าวสารประชาสัมพันธ์ใหม่"}
            </h2>

            <form onSubmit={saveNews} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">
                  หัวข้อข่าวสาร
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เริ่มรอบเก็บเกี่ยวกล้วยหอมทอง GI สวนปทุมธานี..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">
                  เนื้อหาข่าวสาร
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="รายละเอียดข่าวสาร ขั้นตอน หรือองค์ความรู้..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239] focus:bg-white resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-bold"
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white text-xs font-bold shadow-sm"
                >
                  {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "+ โพสต์ข่าวสาร"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* News List Table */}
        <section className="bg-white rounded-3xl p-6 border border-[#e2ead8] shadow-xs">
          <h2 className="text-lg font-black text-[#152e1c] mb-4 pb-3 border-b border-[#e2ead8]">
            รายการข่าวสารทั้งหมด ({news.length} ข่าว)
          </h2>

          {news.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5d6e5a]">ยังไม่มีข่าวสารในระบบ</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {news.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <h3 className="font-bold text-[#152e1c] text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs text-[#5d6e5a] line-clamp-2">{item.content}</p>
                    <p className="text-[11px] text-stone-400">
                      สร้างเมื่อ: {new Date(item.created_at).toLocaleString("th-TH")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => editNews(item)}
                        className="px-3 py-1.5 rounded-lg bg-[#edf6ea] text-[#1b5e20] text-xs font-bold hover:bg-[#e2f0dd]"
                      >
                        แก้ไข
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteNews(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                      >
                        ลบ
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <PlukrakFooter />
    </div>
  );
}
