"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";

const ROLES = [
  { code: "admin", name: "Admin (ผู้ดูแลระบบ)", badgeColor: "bg-purple-100 text-purple-800 border-purple-200" },
  { code: "farmer", name: "Farmer (เกษตรกร)", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { code: "staff", name: "Staff (เจ้าหน้าที่)", badgeColor: "bg-blue-100 text-blue-800 border-blue-200" },
  { code: "user", name: "User (ผู้ใช้งานทั่วไป)", badgeColor: "bg-stone-100 text-stone-700 border-stone-200" },
];

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    roleCode: "user",
  });

  // Edit Modal State
  const [editForm, setEditForm] = useState({
    userId: null,
    fullName: "",
    email: "",
    roleCode: "user",
    isActive: true,
    newPassword: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      const meData = await meRes.json();

      if (!meRes.ok) {
        router.replace("/login");
        return;
      }

      const permissions = meData.permissions || [];
      const allowed =
        permissions.includes("*") ||
        permissions.includes("user:manage");

      if (!allowed) {
        setError("บัญชีนี้ไม่มีสิทธิ์จัดการสมาชิก");
        return;
      }

      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดรายชื่อสมาชิกได้");
      }

      const list = data.users || [];
      setUsers(list);

      const roleMap = {};
      list.forEach((user) => {
        roleMap[user.id] = user.role_code;
      });
      setSelectedRoles(roleMap);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // สร้างสมาชิกใหม่
  async function handleCreate(event) {
    event.preventDefault();
    setSavingId("create");
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "เพิ่มสมาชิกไม่สำเร็จ");
      }

      setSuccess("เพิ่มสมาชิกใหม่เรียบร้อยแล้ว");
      setShowCreateModal(false);
      setCreateForm({
        fullName: "",
        email: "",
        password: "",
        roleCode: "user",
      });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // เปลี่ยนบทบาทแบบด่วนในตาราง
  async function handleQuickRoleChange(userId) {
    const roleCode = selectedRoles[userId];
    if (!roleCode) return;

    setSavingId(userId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, roleCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "เปลี่ยนบทบาทไม่สำเร็จ");
      }

      setSuccess(`เปลี่ยนบทบาทสมาชิก ID ${userId} เป็น "${roleCode}" เรียบร้อยแล้ว`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // เปิด Modal แก้ไขข้อมูลสมาชิกแบบเต็ม
  function openEditModal(user) {
    setEditingUser(user);
    setEditForm({
      userId: user.id,
      fullName: user.full_name || "",
      email: user.email || "",
      roleCode: user.role_code || "user",
      isActive: Boolean(user.is_active),
      newPassword: "",
    });
    setError("");
    setSuccess("");
  }

  // บันทึกการแก้ไขข้อมูลจาก Modal
  async function handleSaveEdit(e) {
    e.preventDefault();
    setSavingId("modal-save");
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "อัปเดตข้อมูลผู้ใช้ไม่สำเร็จ");
      }

      setSuccess("อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว");
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // ปิดใช้งานสมาชิก
  async function handleDelete(userId, name) {
    const confirmed = window.confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบบัญชี "${name || userId}" โดยเก็บข้อมูลเดิมไว้?`);
    if (!confirmed) return;

    setSavingId(userId);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ลบสมาชิกไม่สำเร็จ");
      }

      setSuccess(data.message || "ลบสมาชิกเรียบร้อยแล้ว");
      if (editingUser?.id === userId) {
        setEditingUser(null);
      }
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  // กรองผู้ใช้งาน
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = search.toLowerCase().trim();
      const matchKeyword =
        !keyword ||
        String(user.full_name || "").toLowerCase().includes(keyword) ||
        String(user.email || "").toLowerCase().includes(keyword) ||
        String(user.role_code || "").toLowerCase().includes(keyword) ||
        String(user.role_name || "").toLowerCase().includes(keyword);

      const matchRole =
        selectedRoleFilter === "all" || user.role_code === selectedRoleFilter;

      return matchKeyword && matchRole;
    });
  }, [users, search, selectedRoleFilter]);

  // สรุปจำนวนแต่ละบทบาท
  const roleCounts = useMemo(() => {
    const counts = { all: users.length, admin: 0, farmer: 0, staff: 0, user: 0 };
    users.forEach((u) => {
      if (counts[u.role_code] !== undefined) {
        counts[u.role_code] += 1;
      }
    });
    return counts;
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb]">
        <PlukrakNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#2f8239] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#2e4732]">กำลังโหลดข้อมูลระบบจัดการสมาชิก...</p>
          </div>
        </main>
        <PlukrakFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-[#152e1c]">
      <PlukrakNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6">
        
        {/* Navigation Breadcrumb & Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2ead8]">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <Link href="/admin" className="text-[#2f8239] hover:underline">
                ← กลับสู่ศูนย์ควบคุมผู้ดูแล
              </Link>
              <span className="text-stone-300">/</span>
              <span className="text-[#5d6e5a]">จัดการสมาชิก (RBAC Management)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#152e1c] mt-1.5">
              ระบบจัดการสมาชิกและสิทธิ์การใช้งาน
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>+</span>
            <span>เพิ่มสมาชิกใหม่</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </span>
            <button onClick={() => setError("")} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2">
              <span>✅</span>
              <span>{success}</span>
            </span>
            <button onClick={() => setSuccess("")} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: `ทั้งหมด (${roleCounts.all})` },
            { key: "admin", label: `🛡️ แอดมิน (${roleCounts.admin})` },
            { key: "farmer", label: `🧑‍🌾 เกษตรกร (${roleCounts.farmer})` },
            { key: "staff", label: `🧑‍💼 เจ้าหน้าที่ (${roleCounts.staff})` },
            { key: "user", label: `👤 สมาชิกทั่วไป (${roleCounts.user})` },
          ].map((tab) => {
            const isActive = selectedRoleFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedRoleFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold transition cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-[#1e5a32] text-white shadow-sm"
                    : "bg-white text-[#1f4c27] border border-[#dce8d0] hover:bg-[#f6fcf4]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-2 px-4 border border-[#e2ead8] flex items-center gap-3 shadow-xs">
          <span className="text-[#5d6e5a] text-lg">🔍</span>
          <input
            type="search"
            placeholder="ค้นหาชื่อ-นามสกุล, อีเมล, หรือบทบาทผู้ใช้งาน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium outline-none bg-transparent placeholder:text-stone-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-bold text-stone-400 hover:text-stone-700"
            >
              ล้าง
            </button>
          )}
        </div>

        {/* Users Table */}
        <section className="bg-white rounded-[26px] p-6 border border-[#e2ead8] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#e2ead8] mb-4">
            <h2 className="text-lg font-black text-[#152e1c]">
              รายชื่อสมาชิก ({filteredUsers.length} รายการ)
            </h2>
            <span className="text-xs text-[#5d6e5a] font-medium">
              คลิกปุ่ม &quot;⚙️ จัดการ&quot; เพื่อแก้ไขข้อมูล รีเซ็ตรหัสผ่าน หรือเปลี่ยนสถานะ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-[#5d6e5a] font-bold">
                  <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3">อีเมล</th>
                  <th className="py-3 px-3">บทบาทปัจจุบัน</th>
                  <th className="py-3 px-3">ปรับเปลี่ยนบทบาทด่วน</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500 font-bold">
                      ไม่พบข้อมูลสมาชิกที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isDirty = selectedRoles[u.id] && selectedRoles[u.id] !== u.role_code;
                    const roleInfo = ROLES.find((r) => r.code === u.role_code) || ROLES[3];
                    const isSaving = savingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#fbfdfa] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-[#152e1c]">{u.full_name}</div>
                          <div className="text-[11px] text-stone-400 font-mono">ID: #{u.id}</div>
                        </td>

                        <td className="py-3.5 px-3 font-mono text-[#5d6e5a]">{u.email}</td>

                        <td className="py-3.5 px-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${roleInfo.badgeColor}`}>
                            {u.role_name || u.role_code}
                          </span>
                        </td>

                        {/* Quick Role Change with Save button */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRoles[u.id] || u.role_code}
                              onChange={(e) =>
                                setSelectedRoles({ ...selectedRoles, [u.id]: e.target.value })
                              }
                              className="h-9 px-3 text-xs rounded-xl border border-[#d2dec8] bg-[#fbfdf9] font-bold text-[#1b5e20] outline-none focus:border-[#2f8239] cursor-pointer"
                            >
                              {ROLES.map((r) => (
                                <option key={r.code} value={r.code}>
                                  {r.name}
                                </option>
                              ))}
                            </select>

                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => handleQuickRoleChange(u.id)}
                                disabled={isSaving}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#2f8239] to-[#1a5622] text-white text-xs font-black hover:brightness-105 transition shadow-xs cursor-pointer flex items-center gap-1 shrink-0 animate-in fade-in"
                              >
                                {isSaving ? "กำลังบันทึก..." : "💾 บันทึก"}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status (Active / Inactive) */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {u.is_active ? "ปกติ" : "ระงับ"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="px-3 py-1.5 rounded-lg bg-[#edf6ea] hover:bg-[#deeed7] text-[#1b5e20] font-black text-xs transition cursor-pointer"
                              title="แก้ไขข้อมูลอย่างละเอียด"
                            >
                              ⚙️ จัดการ
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(u.id, u.full_name)}
                              disabled={isSaving}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs transition cursor-pointer"
                              title="ปิดใช้งานสมาชิก"
                            >
                              {isSaving ? "..." : "🔒 ปิดใช้งาน"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* 🟢 Comprehensive User Management Modal (จัดการสมาชิกครบวงจร) */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2ead8] space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2ead8]">
              <div>
                <h3 className="text-xl font-black text-[#152e1c]">
                  ⚙️ จัดการข้อมูลสมาชิก #{editingUser.id}
                </h3>
                <p className="text-xs text-[#5d6e5a] mt-0.5">
                  แก้ไขข้อมูล ปรับสิทธิ์ รีเซ็ตรหัสผ่าน หรือลบบัญชี
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">ชื่อ-นามสกุล</label>
                <input
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">อีเมลผู้ใช้งาน</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2e4732] mb-1">บทบาท (Role)</label>
                  <select
                    value={editForm.roleCode}
                    onChange={(e) => setEditForm({ ...editForm, roleCode: e.target.value })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                  >
                    {ROLES.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2e4732] mb-1">สถานะการใช้งาน</label>
                  <select
                    value={editForm.isActive ? "1" : "0"}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === "1" })}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                  >
                    <option value="1">ปกติ (Active)</option>
                    <option value="0">ระงับการใช้งาน (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Reset Password */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1.5">
                <label className="block text-xs font-black text-amber-900">
                  🔑 รีเซ็ตรหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
                </label>
                <input
                  type="password"
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-amber-300 bg-white outline-none focus:border-amber-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#e2ead8] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDelete(editingUser.id, editingUser.full_name)}
                  className="px-4 py-2 rounded-full text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
                >
                  🗑️ ปิดใช้งานบัญชี
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-bold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={savingId === "modal-save"}
                    className="px-6 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white text-xs font-black shadow-sm"
                  >
                    {savingId === "modal-save" ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 Create User Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#e2ead8] space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2ead8]">
              <div>
                <h3 className="text-xl font-black text-[#152e1c]">➕ เพิ่มสมาชิกใหม่เข้าระบบ</h3>
                <p className="text-xs text-[#5d6e5a] mt-0.5">สร้างบัญชีผู้ใช้งานใหม่พร้อมกำหนดบทบาท</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">ชื่อ-นามสกุล</label>
                <input
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  required
                  placeholder="กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full h-11 px-4 text-sm rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2e4732] mb-1">บทบาท (Role)</label>
                <select
                  value={createForm.roleCode}
                  onChange={(e) => setCreateForm({ ...createForm, roleCode: e.target.value })}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-[#d2dec8] bg-[#fbfdf9] outline-none focus:border-[#2f8239]"
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#e2ead8] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingId === "create"}
                  className="px-6 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#236b28] text-white text-xs font-black shadow-sm"
                >
                  {savingId === "create" ? "กำลังบันทึก..." : "+ สร้างสมาชิก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PlukrakFooter />
    </div>
  );
}
