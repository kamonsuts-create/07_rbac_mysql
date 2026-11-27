"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";

const emptyForm = {
  name: "",
  category: "other",
  description: "",
  price: "",
  stock: "",
  unit: "กิโลกรัม",
  image_url: "",
  status: "available",
};

export default function DashboardPage() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const can = (permission) => permissions.includes("*") || permissions.includes(permission);
  const canCreate = can("products:create");
  const canUpdate = can("products:update");
  const canDelete = can("products:delete");

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/login");
            return;
          }
          throw new Error(data.message || "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้");
        }

        setCurrentUser(data.user || null);
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      } catch (err) {
        setError(err.message || "ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้");
      } finally {
        setUserLoading(false);
      }
    }

    fetchCurrentUser();
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("google_linked");
    const linkError = params.get("google_link_error");

    if (linked === "1") {
      setMessage("เชื่อมต่อบัญชี Google สำเร็จเรียบร้อยแล้ว");
    } else if (linkError) {
      setError("ไม่สามารถเชื่อมต่อบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดสินค้าได้");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดสินค้า");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openAddForm() {
    if (!canCreate) return;
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function openEditForm(product) {
    if (!canUpdate) return;
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "other",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? product.quantity ?? "",
      unit: product.unit || "กิโลกรัม",
      image_url: product.image_url || "",
      status: product.status || "available",
    });
    setError("");
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (editingId !== null ? !canUpdate : !canCreate) {
      setError("คุณไม่มีสิทธิ์ดำเนินการนี้");
      return;
    }

    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อสินค้า");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        name: form.name.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingId !== null) {
        payload.id = editingId;
      }

      const res = await fetch("/api/products", {
        method: editingId !== null ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถบันทึกสินค้าได้");
      }

      setMessage(data.message || "บันทึกสินค้าสำเร็จเรียบร้อย");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchProducts();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึกสินค้า");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!canDelete) return;

    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${product.name}"?`);
    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถลบสินค้าได้");
      }

      setMessage(data.message || "ลบสินค้าสำเร็จเรียบร้อย");
      await fetchProducts();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการลบสินค้า");
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb]">
        <PlukrakNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#2f8239] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#2e4732]">กำลังโหลดแดชบอร์ดสมาชิกปลูกรัก...</p>
          </div>
        </main>
        <PlukrakFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6 sm:space-y-8">
        
        {/* User Greeting & Status Card */}
        <section className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-[#e2ead8] shadow-[0_8px_28px_rgba(20,60,25,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2f8239] to-[#1a5622] text-white flex items-center justify-center text-3xl font-black shadow-md shrink-0">
              {currentUser?.role === "farmer" ? "🧑‍🌾" : currentUser?.role === "admin" ? "🛡️" : "👤"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#152e1c]">
                  สวัสดี, {currentUser?.fullName || currentUser?.name || "สมาชิกปลูกรัก"}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-[#edf6ea] text-[#1b5e20] text-xs font-black border border-[#cbe1c3]">
                  {currentUser?.role === "farmer"
                    ? "เกษตรกรผู้ขาย"
                    : currentUser?.role === "admin"
                    ? "ผู้ดูแลระบบ"
                    : "สมาชิกผู้บริโภค"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5d6e5a] font-medium mt-1">
                อีเมล: {currentUser?.email || "-"}
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-full bg-[#f4f9f2] hover:bg-[#eaf4e6] text-[#1e4825] font-extrabold text-xs sm:text-sm border border-[#cfdfc8] transition"
            >
              🌾 เลือกซื้อผลผลิต
            </Link>

            {currentUser?.role === "farmer" && (
              <Link
                href="/farmer/products"
                className="px-5 py-2.5 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] text-white font-extrabold text-xs sm:text-sm shadow-sm transition hover:brightness-105"
              >
                🌾 จัดการแผงผลผลิต & บัญชีโอนตรง
              </Link>
            )}

            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-full bg-gradient-to-b from-[#1b5e20] to-[#0f3813] text-white font-extrabold text-xs sm:text-sm shadow-sm transition hover:brightness-105"
              >
                🛡️ เมนูผู้ดูแลระบบ
              </Link>
            )}
          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between">
            <span>✅ {message}</span>
            <button onClick={() => setMessage("")} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Stats Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-3xl p-5 border border-[#e2ead8] shadow-xs">
            <span className="text-3xl block mb-2">📦</span>
            <p className="text-xs font-bold text-[#5d6e5a]">ผลผลิตในระบบทั้งหมด</p>
            <p className="text-2xl font-black text-[#152e1c] mt-0.5">{products.length} รายการ</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#e2ead8] shadow-xs">
            <span className="text-3xl block mb-2">🌿</span>
            <p className="text-xs font-bold text-[#5d6e5a]">มาตรฐานความปลอดภัย</p>
            <p className="text-base sm:text-lg font-black text-[#2f8239] mt-1">GAP & GI ชุมชน 100%</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#e2ead8] shadow-xs">
            <span className="text-3xl block mb-2">🔗</span>
            <p className="text-xs font-bold text-[#5d6e5a]">สถานะบัญชี Google</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs font-bold text-[#152e1c]">
                {currentUser?.googleLinked ? "เชื่อมต่อแล้ว" : "ยังไม่เชื่อมต่อ"}
              </span>
              {!currentUser?.googleLinked && (
                <a
                  href="/api/auth/google?mode=link"
                  className="text-xs font-black text-[#2f8239] hover:underline"
                >
                  + เชื่อมบัญชี
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Product Management Area (if user has permissions) */}
        {canCreate && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#152e1c]">
                  จัดการรายการผลผลิต
                </h2>
                <p className="text-xs sm:text-sm text-[#5d6e5a]">
                  แก้ไขข้อมูล ราคา หรือจำนวนสต็อกสินค้า
                </p>
              </div>

              {!showForm && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
                >
                  + เพิ่มผลผลิตใหม่
                </button>
              )}
            </div>

            {/* Add / Edit Form */}
            {showForm && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#2f8239]/40 shadow-lg">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e2ead8]">
                  <h3 className="text-lg font-black text-[#152e1c]">
                    {editingId ? "✏️ แก้ไขข้อมูลผลผลิต" : "🌱 เพิ่มผลผลิตใหม่เข้าสู่ระบบ"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-xs font-bold text-stone-500 hover:text-stone-800"
                  >
                    ยกเลิก
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2e4732] mb-1">ชื่อผลผลิต</label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="เช่น ผักสลัดคอสอินทรีย์"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2e4732] mb-1">หมวดหมู่</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                    >
                      <option value="veg">ผักสด</option>
                      <option value="fruit">ผลไม้</option>
                      <option value="grain">ข้าวและธัญพืช</option>
                      <option value="processed">สินค้าแปรรูป</option>
                      <option value="other">ทั่วไป</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2e4732] mb-1">ราคา (บาท)</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      required
                      value={form.price}
                      onChange={handleChange}
                      placeholder="เช่น 45"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2e4732] mb-1">จำนวนคงเหลือ</label>
                    <input
                      name="stock"
                      type="number"
                      required
                      value={form.stock}
                      onChange={handleChange}
                      placeholder="เช่น 50"
                      className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#2e4732] mb-1">URL รูปภาพผลผลิต</label>
                    <input
                      name="image_url"
                      value={form.image_url}
                      onChange={handleChange}
                      placeholder="https://..."
                      className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-bold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white text-xs font-bold"
                    >
                      {saving ? "กำลังบันทึก..." : "บันทึกผลผลิต"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        )}

        {/* Products Table Overview */}
        <section className="bg-white rounded-3xl p-6 border border-[#e2ead8] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#e2ead8] mb-4">
            <h2 className="text-lg font-black text-[#152e1c]">
              🌾 ผลผลิตสดใหม่ในระบบ ({products.length} รายการ)
            </h2>
            <Link
              href="/"
              className="text-xs font-bold text-[#2f8239] hover:underline"
            >
              ดูหน้าร้านค้าจริง ➔
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#5d6e5a]">กำลังโหลดรายการผลผลิต...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-[#5d6e5a]">
                    <th className="py-3 px-3">ชื่อผลผลิต</th>
                    <th className="py-3 px-3">หมวดหมู่</th>
                    <th className="py-3 px-3">ราคา</th>
                    <th className="py-3 px-3">คงเหลือ</th>
                    {canUpdate && <th className="py-3 px-3 text-right">จัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-[#fbfdfa]">
                      <td className="py-3 px-3 font-bold text-[#152e1c]">
                        <div className="flex items-center gap-2.5">
                          {p.image_url && (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          )}
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#5d6e5a]">{p.category || "-"}</td>
                      <td className="py-3 px-3 font-black text-[#2f8239]">฿{p.price}</td>
                      <td className="py-3 px-3 text-[#5d6e5a]">{p.stock} {p.unit || "กก."}</td>
                      {canUpdate && (
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(p)}
                            className="px-2.5 py-1 rounded-md bg-[#edf6ea] text-[#1b5e20] text-xs font-bold hover:bg-[#e2f0dd]"
                          >
                            แก้ไข
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(p)}
                              className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                            >
                              ลบ
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      <PlukrakFooter />
    </div>
  );
}
