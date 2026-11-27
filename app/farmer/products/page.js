"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";
import Logo from "@/components/Logo";

const emptyForm = {
  name: "",
  category: "fruit",
  description: "",
  price: "",
  stock: "",
  unit: "กิโลกรัม",
  province: "ปทุมธานี",
  location_type: "หน้าแปลง",
  origin_address: "หมู่ 1 ต.นพรัตน์ อ.หนองเสือ จ.ปทุมธานี 12170 (ริมคลองระบายน้ำที่ 10)",
  harvest_process:
    "1. สุ่มตรวจวิเคราะห์สารตกค้างก่อนเก็บเกี่ยวด้วย Rapid Test (0.00 ppm)\n2. เก็บเกี่ยวรอบเช้ามืด 05:00 - 06:30 น. ในช่วงที่ผลผลิตสดกรอบที่สุด\n3. ทำความสะอาดด้วยระบบน้ำโอโซนบริสุทธิ์เพื่อความปลอดภัย\n4. คัดเกรดพรีเมียม บรรจุลงกล่องควบคุมอุณหภูมิทันทีพร้อมจัดส่งตรงจากหน้างาน",
  image_url: "",
  video_url: "",
  farm_image_url: "",
  cert_image_url: "",
  cert_number: "สช 64100142 (GI) / กษ 03-9001-3829-TH",
  bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
  bank_account_name: "",
  bank_account_number: "",
  promptpay_number: "",
  seller_phone: "",
  status: "available",
};

const statusLabels = {
  available: "พร้อมจำหน่าย",
  sold_out: "สินค้าหมด",
  inactive: "ปิดการขาย",
};

const statusBadgeStyles = {
  available: "badge-3d badge-3d-emerald",
  sold_out: "badge-3d bg-rose-100 text-rose-800 border border-rose-200 shadow-[0_3px_0_#fca5a5]",
  inactive: "badge-3d bg-zinc-100 text-zinc-800 border border-zinc-200 shadow-[0_3px_0_#d1d5db]",
};

const PROVINCES = [
  "ปทุมธานี",
  "นครปฐม",
  "เชียงใหม่",
  "เชียงราย",
  "ร้อยเอ็ด",
  "เพชรบูรณ์",
  "สุราษฎร์ธานี",
  "จันทบุรี",
  "ขอนแก่น",
  "นครราชสีมา",
  "บุรีรัมย์",
  "นนทบุรี",
  "ราชบุรี",
  "กาญจนบุรี",
  "สงขลา",
  "กรุงเทพมหานคร",
];

const LOCATION_TYPES = ["หน้าแปลง", "หน้าสวน", "ตลาดวิสาหกิจชุมชน"];

const BANKS = [
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
  "ธนาคารกสิกรไทย (KBANK)",
  "ธนาคารไทยพาณิชย์ (SCB)",
  "ธนาคารกรุงไทย (KTB)",
  "ธนาคารกรุงเทพ (BBL)",
  "ธนาคารออมสิน (GSB)",
  "ธนาคารทหารไทยธนชาต (TTB)",
  "ธนาคารกรุงศรีอยุธยา (BAY)",
];

export default function FarmerProductsPage() {
  const router = useRouter();

  // File Input Refs
  const productImageRef = useRef(null);
  const farmImageRef = useRef(null);
  const certImageRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // File Upload Handler (อัปโหลดรูปสินค้า, รูปหน้าสวน, รูปใบรับรอง)
  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      setForm((prev) => ({ ...prev, [fieldName]: data.image_url }));
      setMessage("อัปโหลดรูปภาพสำเร็จเรียบร้อย");
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

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
          throw new Error(data.message || "ตรวจสอบผู้ใช้ไม่สำเร็จ");
        }

        if (data.user?.role !== "farmer" && data.user?.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        setCurrentUser(data.user || null);
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);

        // ตั้งค่าชื่อบัญชีเริ่มต้นเป็นชื่อเกษตรกรเพื่อความถูกต้อง
        if (data.user?.fullName) {
          setForm((prev) => ({
            ...prev,
            bank_account_name: prev.bank_account_name || data.user.fullName,
          }));
        }
      } catch (err) {
        setError(err.message || "ตรวจสอบสิทธิ์ไม่สำเร็จ");
      } finally {
        setUserLoading(false);
      }
    }

    fetchCurrentUser();
  }, [router]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "โหลดสินค้าไม่สำเร็จ");
      }

      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดผลผลิต");
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
    setForm({
      ...emptyForm,
      bank_account_name: currentUser?.fullName || "",
      seller_phone: currentUser?.phone || "",
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(product) {
    if (!canUpdate) return;
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      category: product.category || "vegetable",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? product.quantity ?? "",
      unit: product.unit || "กิโลกรัม",
      province: product.province || "นครปฐม",
      location_type: product.location_type || "หน้าแปลง",
      origin_address:
        product.origin_address ||
        "แปลงเพาะปลูกที่ 04 วิสาหกิจชุมชน ต.คลองใหม่ อ.สามพราน จ.นครปฐม 73110",
      harvest_process:
        product.harvest_process ||
        "1. สุ่มตรวจวิเคราะห์สารตกค้างก่อนเก็บเกี่ยว (0.00 ppm)\n2. เก็บเกี่ยวรอบเช้ามืด 05:30 - 07:00 น.\n3. ทำความสะอาดด้วยระบบน้ำโอโซนปลอดภัย\n4. คัดเกรดพรีเมียม บรรจุลงกล่องควบคุมอุณหภูมิทันที",
      image_url: product.image_url || "",
      video_url: product.video_url || "",
      farm_image_url: product.farm_image_url || "",
      cert_image_url: product.cert_image_url || "",
      cert_number: product.cert_number || "GAP-TH-73-04-98210",
      bank_name: product.bank_name || "ธนาคารกสิกรไทย (KBANK)",
      bank_account_name: product.bank_account_name || currentUser?.fullName || "",
      bank_account_number: product.bank_account_number || "",
      promptpay_number: product.promptpay_number || "",
      seller_phone: product.seller_phone || "",
      status: product.status || "available",
    });
    setError("");
    setMessage("");
    setShowForm(true);
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

    if (form.price === "" || Number(form.price) < 0 || !Number.isFinite(Number(form.price))) {
      setError("กรุณากรอกราคาที่ถูกต้อง");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0 || !Number.isFinite(Number(form.stock))) {
      setError("กรุณากรอกจำนวนสินค้าที่ถูกต้อง");
      return;
    }

    if (!form.bank_account_name.trim()) {
      setError("กรุณาระบุชื่อเจ้าของบัญชีธนาคาร (ต้องตรงกับชื่อผู้ลงขาย)");
      return;
    }

    if (!form.bank_account_number.trim()) {
      setError("กรุณาระบุเลขที่บัญชีธนาคารเพื่อรับเงินโอนโดยตรง");
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

      setMessage(data.message || "บันทึกข้อมูลผลผลิตและข้อมูลหน้างานสำเร็จ");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchProducts();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!canDelete) return;

    const confirmed = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผลผลิต "${product.name}"?`);
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
        throw new Error(data.message || "ไม่สามารถลบผลผลิตได้");
      }

      setMessage(data.message || "ลบผลผลิตเรียบร้อยแล้ว");
      await fetchProducts();
    } catch (err) {
      setError(err.message || "เกิดข้อผิดพลาดในการลบ");
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Quick Preset Helper
  const applyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      ...preset,
      bank_account_name: currentUser?.fullName || preset.bank_account_name || "",
    }));
  };

  if (userLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf8f2]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-700 font-black text-sm">กำลังเชื่อมต่อข้อมูลเกษตรกรและแปลงปลูก...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f6f4eb] text-zinc-900 font-sans">
      <PlukrakNavbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-md shadow-rose-900/5 animate-in fade-in">
            <span className="text-rose-600 text-xl leading-none mt-0.5">⚠️</span>
            <div className="font-bold flex-1">{error}</div>
            <button
              onClick={() => setError("")}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-md shadow-emerald-900/5 animate-in fade-in">
            <span className="text-emerald-600 text-xl leading-none mt-0.5">✅</span>
            <div className="font-bold flex-1">{message}</div>
            <button
              onClick={() => setMessage("")}
              className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="stamp-seal bg-emerald-700 text-white border-white text-xs px-3 py-0.5">
                👨‍🌾 บัญชีเกษตรกรผู้ลงขาย
              </span>
              <span className="text-xs text-zinc-500 font-bold">
                (ยืนยันชื่อบัญชีตรงกับผู้ขายแล้ว)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 heading-3d tracking-tight mt-1.5">
              จัดการผลผลิต วิดีโอหน้าแปลง และบัญชีรับเงินโดยตรง
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">
              เกษตรกร: <strong className="text-emerald-800">{currentUser?.fullName || "คุณ"}</strong> · ผลผลิตในสวนทั้งหมด {products.length} รายการ
            </p>
          </div>

          {canCreate && (
            <button
              onClick={openAddForm}
              className="btn-3d-emerald text-sm sm:text-base px-6 py-3 font-black cursor-pointer shadow-md"
            >
              <span>🌱</span>
              <span>+ ลงทะเบียนผลผลิตใหม่</span>
            </button>
          )}
        </div>

        {/* Notice Info Card */}
        <div className="mb-8 p-5 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 rounded-2xl border-2 border-emerald-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
              🛡️
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                ระบบโอนเงินตรงสู่เจ้าของผลผลิต (Direct P2P & Consumer Safety)
              </h4>
              <p className="text-xs text-emerald-900 font-semibold mt-0.5 leading-relaxed">
                ผู้บริโภคสามารถตรวจสอบที่มาหน้าแปลง ดูวิดีโอการเพาะปลูก และโอนเงินตรงเข้าบัญชีของคุณโดยไม่ผ่านตัวกลาง
                โปรดตรวจสอบให้แน่ใจว่า<strong>ชื่อบัญชีธนาคารตรงกับชื่อ-นามสกุลจริงของผู้ลงขาย</strong>เพื่อความปลอดภัยและความน่าเชื่อถือสูงสุด
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-3d badge-3d-emerald text-xs px-3 py-1 font-bold">
              ✓ ไม่หักค่าธรรมเนียม
            </span>
            <span className="badge-3d badge-3d-gold text-xs px-3 py-1 font-bold">
              ✓ ยืนยันตัวตนเกษตรกร
            </span>
          </div>
        </div>

        {/* 3D Add/Edit Product Full Form */}
        {showForm && ((editingId === null && canCreate) || (editingId !== null && canUpdate)) && (
          <section className="mb-10 card-3d-static p-7 sm:p-9 border-4 border-emerald-300 bg-white shadow-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-100 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-float-3d">
                  {editingId !== null ? "✏️" : "🌱"}
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 heading-3d">
                    {editingId !== null
                      ? `แก้ไขข้อมูลผลผลิต: ${form.name || "ผลผลิต"}`
                      : "ลงทะเบียนผลผลิตใหม่พร้อมหลักฐานหน้างานและบัญชีรับเงิน"}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                    กรอกข้อมูลหน้างาน ที่อยู่แปลงปลูก วิดีโอ ใบรับรอง และขั้นตอนการทำเพื่อความโปร่งใส
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="btn-3d-white text-xs px-3.5 py-1.5 font-bold cursor-pointer"
              >
                ✕ ปิดฟอร์ม
              </button>
            </div>

            {/* Quick Templates for Fast Data Entry */}
            <div className="mb-7 p-4 bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block mb-2">
                ⚡ หรือคลิกเลือกแม่แบบผลผลิตตัวอย่าง (กรอกข้อมูลสมบูรณ์แบบอัตโนมัติ):
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: "กล้วยหอมทองปทุมธานีแท้ GI หวีพรีเมียม (Pathumthani Golden Banana)",
                      category: "fruit",
                      price: "85",
                      stock: "60",
                      unit: "หวี (1.8-2.2 กก.)",
                      province: "ปทุมธานี",
                      location_type: "หน้าแปลง",
                      origin_address: "หมู่ 1 ต.นพรัตน์ อ.หนองเสือ จ.ปทุมธานี 12170 (ริมคลองระบายน้ำที่ 10 ฝั่งตะวันออก)",
                      harvest_process:
                        "1. ตรวจวัดระดับความแก่จัดของผลกล้วย 80-85% บนต้น\n2. ตัดสดรอบเช้าตรู่ 05:30 น. ป้องกันความร้อนสะสม\n3. ล้างทำความสะอาดด้วยระบบน้ำไหลวนลดคราบยาง\n4. ตัดแต่งหวี คัดเกรดพรีเมียม สวมตาข่ายโฟมกันกระแทกส่งตรงจากแปลง",
                      image_url:
                        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80",
                      video_url:
                        "https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-in-a-greenhouse-with-fresh-crops-42618-large.mp4",
                      farm_image_url:
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
                      cert_image_url:
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
                      cert_number: "สช 64100142 (GI) / กษ 03-9001-3829-TH",
                      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
                      bank_account_number: "020-1-98421-4",
                      promptpay_number: "0818179418",
                      seller_phone: "081-817-9418",
                      description: "กล้วยหอมทองแท้ GI ปทุมธานี ผลใหญ่ยาว เปลือกบาง ผิวนวล เนื้อแน่น หวานหอมตามธรรมชาติ",
                    })
                  }
                  className="bg-white hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 text-xs px-3.5 py-2 rounded-xl font-black transition shadow-xs cursor-pointer"
                >
                  🍌 กล้วยหอมทองแท้ GI (หนองเสือ ปทุมธานี)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: "ใบเตยหอมสดคัดเกรดพรีเมียม (Fresh Pandan Leaves)",
                      category: "vegetable",
                      price: "40",
                      stock: "150",
                      unit: "กิโลกรัม",
                      province: "ปทุมธานี",
                      location_type: "หน้าแปลง",
                      origin_address: "หมู่ 9 ต.คลองสาม อ.คลองหลวง จ.ปทุมธานี 12120",
                      harvest_process:
                        "1. ตัดยอดใบเตยช่วงเวลา 05:00 น. ก่อนโดนแดดแรง\n2. ล้างทำความสะอาดด้วยระบบน้ำโอโซนบริสุทธิ์ 3 ขั้นตอน\n3. ผึ่งสะเด็ดน้ำ คัดขนาดใบ มัดกำด้วยตอกธรรมชาติ\n4. บรรจุถุงระบายอากาศเพื่อคงความสดและกลิ่นหอม",
                      image_url:
                        "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800&auto=format&fit=crop&q=80",
                      video_url:
                        "https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-in-a-greenhouse-with-fresh-crops-42618-large.mp4",
                      farm_image_url:
                        "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=800&auto=format&fit=crop&q=80",
                      cert_image_url:
                        "https://images.unsplash.com/photo-1554415707-9e49fe832873?w=800&auto=format&fit=crop&q=80",
                      cert_number: "GAP-TH-13-02-49102",
                      bank_name: "ธนาคารกสิกรไทย (KBANK)",
                      bank_account_number: "412-2-58910-3",
                      promptpay_number: "0865549123",
                      seller_phone: "086-554-9123",
                      description: "ใบเตยหอมสดตัดใหม่เช้าตรู่จากแปลงร่องสวนคลองสาม ใบใหญ่ เขียวสด กลิ่นหอมฟุ้ง ปลอดสารเคมี",
                    })
                  }
                  className="bg-white hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 text-xs px-3.5 py-2 rounded-xl font-black transition shadow-xs cursor-pointer"
                >
                  🌿 เตยหอมคลองสาม (คลองหลวง ปทุมธานี)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: "น้ำพริกแกงเผ็ดโบราณสูตรพ่อกำนัน (Traditional Red Curry Paste)",
                      category: "processed",
                      price: "65",
                      stock: "90",
                      unit: "กระปุก (500 กรัม)",
                      province: "ปทุมธานี",
                      location_type: "ตลาดวิสาหกิจชุมชน",
                      origin_address: "หมู่ 4 ต.คูขวาง อ.ลาดหลุมแก้ว จ.ปทุมธานี 12140",
                      harvest_process:
                        "1. เก็บเกี่ยวสมุนไพรสด (พริก ข่า ตะไคร้ หอม กระเทียม) จากแปลงสมาชิก\n2. ล้างทำความสะอาด ขูดคัดแยกสิ่งปนเปื้อน\n3. โขลกและบดด้วยเครื่องบดหินความเร็วต่ำรักษาความหอมของน้ำมันหอมระเหย\n4. บรรจุสุญญากาศและพาสเจอไรซ์เพื่อความปลอดภัย",
                      image_url:
                        "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80",
                      video_url: null,
                      farm_image_url:
                        "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=800&auto=format&fit=crop&q=80",
                      cert_image_url:
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
                      cert_number: "อย. 13-2-02159-2-0003 / มผช. 28/2555",
                      bank_name: "ธนาคารกรุงไทย (KTB)",
                      bank_account_number: "132-0-45891-2",
                      promptpay_number: "0819124589",
                      seller_phone: "081-912-4589",
                      description: "พริกแกงเผ็ดสูตรมอญโบราณลาดหลุมแก้ว สมุนไพรสดโขลกมือ ไม่ใส่ผงชูรสและสารกันบูด OTOP 5 ดาว",
                    })
                  }
                  className="bg-white hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 text-xs px-3.5 py-2 rounded-xl font-black transition shadow-xs cursor-pointer"
                >
                  🌶️ พริกแกงพ่อกำนัน (ลาดหลุมแก้ว ปทุมธานี)
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyPreset({
                      name: "ข้าวหอมปทุมธานี 1 แท้ GI คัดพิเศษ (Pathumthani Fragrant Rice 1)",
                      category: "grain",
                      price: "180",
                      stock: "100",
                      unit: "ถุงสุญญากาศ (5 กก.)",
                      province: "ปทุมธานี",
                      location_type: "ตลาดวิสาหกิจชุมชน",
                      origin_address: "หมู่ 2 ต.บึงกาสาม อ.หนองเสือ จ.ปทุมธานี 12170",
                      harvest_process:
                        "1. เกี่ยวในระยะพลับพลึงที่รวงข้าวสุกเต็มที่ 85%\n2. ลดความชื้นด้วยลมร้อนอุณหภูมิต่ำกว่า 42°C ให้ความชื้นเหลือไม่เกิน 14%\n3. สีสดด้วยลูกยางกะเทาะเปลือก ไม่ขัดขาวจนสูญเสียวิตามิน\n4. บรรจุถุงสุญญากาศ Food Grade พร้อมซองดูดออกซิเจน คงความหอมได้นาน 1 ปี",
                      image_url:
                        "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
                      video_url: null,
                      farm_image_url:
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80",
                      cert_image_url:
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
                      cert_number: "สช 61100098 (GI) / กษ 03-4401-2891",
                      bank_name: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)",
                      bank_account_number: "020-2-34981-0",
                      promptpay_number: "0817028934",
                      seller_phone: "081-702-8934",
                      description: "ข้าวหอมปทุมธานี 1 แท้ GI เมล็ดเรียวยาว ขาวนวล หุงสุกนุ่มเหนียวและมีกลิ่นหอมละมุน",
                    })
                  }
                  className="bg-white hover:bg-emerald-100 text-emerald-950 border-2 border-emerald-300 text-xs px-3.5 py-2 rounded-xl font-black transition shadow-xs cursor-pointer"
                >
                  🌾 ข้าวหอมปทุม 1 GI (หนองเสือ ปทุมธานี)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 1: ข้อมูลผลผลิตและราคา */}
              <div className="p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <span className="text-xl">🥦</span>
                  <h4 className="font-black text-zinc-900 text-base heading-3d">
                    ส่วนที่ 1: ข้อมูลผลผลิตและราคาจำหน่าย
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ชื่อผลผลิต <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="เช่น เมลอนมัสค์ญี่ปุ่นคราวน์พรีเมียม (Crown Musk Melon)"
                      className="input-3d h-11 px-3.5 text-sm w-full font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      หมวดหมู่ผลผลิต
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="input-3d h-11 px-3.5 text-sm cursor-pointer w-full font-bold"
                    >
                      <option value="vegetable">ผักสดอินทรีย์</option>
                      <option value="fruit">ผลไม้คัดเกรด</option>
                      <option value="grain">ข้าวและธัญพืช</option>
                      <option value="processed">สินค้าแปรรูปธรรมชาติ</option>
                      <option value="mushroom">เห็ดเพื่อสุขภาพ</option>
                      <option value="other">อื่น ๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ราคาต่อหน่วย (บาท) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      placeholder="0.00"
                      className="input-3d h-11 px-3.5 text-sm w-full font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      จำนวนผลผลิตพร้อมจำหน่าย <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.stock}
                      onChange={handleChange}
                      required
                      placeholder="0"
                      className="input-3d h-11 px-3.5 text-sm w-full font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      หน่วยนับผลผลิต
                    </label>
                    <input
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      placeholder="เช่น กิโลกรัม, ลูก, ตะกร้า, ถุง (5 กก.)"
                      className="input-3d h-11 px-3.5 text-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      สถานะการจำหน่าย
                    </label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="input-3d h-11 px-3.5 text-sm cursor-pointer w-full font-bold"
                    >
                      <option value="available">พร้อมจำหน่าย</option>
                      <option value="sold_out">สินค้าหมดชั่วคราว</option>
                      <option value="inactive">ปิดการขาย</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      รายละเอียดทั่วไปและจุดเด่นของผลผลิต
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={2}
                      placeholder="เช่น ปลูกด้วยวิถีอินทรีย์ ไม่ใช้สารเคมี รสหวานกรอบธรรมชาติ..."
                      className="input-3d p-3.5 text-sm resize-y w-full font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: แหล่งกำเนิดและที่อยู่หน้างาน (Origin Location) */}
              <div className="p-5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                  <span className="text-xl">📍</span>
                  <h4 className="font-black text-emerald-950 text-base heading-3d">
                    ส่วนที่ 2: แหล่งกำเนิด ที่อยู่หน้างาน และจังหวัด (สำหรับให้ผู้บริโภคเลือกดูและติดตาม)
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      จังหวัดที่ตั้งผลผลิต <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        className="input-3d h-11 px-3.5 text-sm cursor-pointer w-full font-bold"
                      >
                        {PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ประเภทแหล่งที่มาหน้างาน <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="location_type"
                      value={form.location_type}
                      onChange={handleChange}
                      className="input-3d h-11 px-3.5 text-sm cursor-pointer w-full font-bold"
                    >
                      <option value="หน้าแปลง">🌱 หน้าแปลง (ตัดสดจากแปลงเพาะปลูก)</option>
                      <option value="หน้าสวน">🏡 หน้าสวน (เก็บสดจากสวนเกษตรกร)</option>
                      <option value="ตลาดวิสาหกิจชุมชน">🏪 ตลาดวิสาหกิจชุมชน (คัดสรรจากกลุ่มชุมชน)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ที่อยู่หน้างาน / แปลงเพาะปลูกแบบละเอียด (ระบุตำบล อำเภอ จังหวัด รหัสไปรษณีย์)
                    </label>
                    <input
                      name="origin_address"
                      value={form.origin_address}
                      onChange={handleChange}
                      placeholder="เช่น แปลงที่ 04 วิสาหกิจชุมชน ต.คลองใหม่ อ.สามพราน จ.นครปฐม 73110"
                      className="input-3d h-12 px-4 text-sm font-bold w-full"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      ℹ️ ข้อมูลที่อยู่นี้จะปรากฏบนหน้าร้านค้าและบัตรติดตามผลผลิต เพื่อให้ผู้บริโภคสามารถตรวจสอบย้อนกลับได้จริง
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: สื่อมัลติมีเดียหน้างาน (รูปภาพและวิดีโอ) */}
              <div className="p-5 bg-zinc-50 rounded-2xl border-2 border-zinc-200 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <span className="text-xl">📸</span>
                  <h4 className="font-black text-zinc-900 text-base heading-3d">
                    ส่วนที่ 3: สื่อมัลติมีเดียหน้างาน (รูปภาพผลผลิต รูปหน้าสวน และวิดีโอหน้าแปลง)
                  </h4>
                </div>

                {/* 3.1 รูปผลผลิตหลัก */}
                <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                      1. รูปภาพผลผลิตหลัก
                    </label>
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={productImageRef}
                    onChange={(e) => handleFileUpload(e, "image_url")}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => productImageRef.current?.click()}
                      disabled={uploadingField === "image_url"}
                      className="btn-3d-emerald text-xs px-4 py-2.5 font-bold cursor-pointer"
                    >
                      {uploadingField === "image_url" ? "กำลังอัปโหลดรูป..." : "📤 อัปโหลดรูปผลผลิตจากอุปกรณ์"}
                    </button>
                    <span className="text-xs text-zinc-400">หรือวางลิงก์ URL ด้านล่าง</span>
                  </div>

                  {form.image_url && (
                    <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <img
                        src={form.image_url}
                        alt="Product preview"
                        className="w-16 h-16 object-cover rounded-lg border border-emerald-300 shadow-sm"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-950">เลือกรูปผลผลิตหลักแล้ว</p>
                        <p className="text-zinc-500 font-mono truncate max-w-sm">{form.image_url}</p>
                      </div>
                    </div>
                  )}

                  <input
                    name="image_url"
                    type="url"
                    value={form.image_url}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/... หรือ URL รูปภาพผลผลิต"
                    className="input-3d h-10 px-3 text-xs text-zinc-600 font-mono w-full"
                  />
                </div>

                {/* 3.2 รูปภาพหน้าสวน / หน้าแปลงจริง */}
                <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                      2. รูปภาพหน้าสวน / หน้าแปลงเพาะปลูกจริง (หรือตลาดวิสาหกิจชุมชน)
                    </label>
                    {form.farm_image_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, farm_image_url: "" }))}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        ลบรูป
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={farmImageRef}
                    onChange={(e) => handleFileUpload(e, "farm_image_url")}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => farmImageRef.current?.click()}
                      disabled={uploadingField === "farm_image_url"}
                      className="btn-3d-white text-xs px-4 py-2.5 font-bold cursor-pointer"
                    >
                      {uploadingField === "farm_image_url" ? "กำลังอัปโหลดรูป..." : "🏡 อัปโหลดรูปหน้าสวน/หน้าแปลง"}
                    </button>
                    <span className="text-xs text-zinc-400">สร้างความมั่นใจให้ผู้บริโภคว่ามีแปลงปลูกจริง</span>
                  </div>

                  {form.farm_image_url && (
                    <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                      <img
                        src={form.farm_image_url}
                        alt="Farm preview"
                        className="w-16 h-16 object-cover rounded-lg border border-emerald-300 shadow-sm"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-950">เลือกรูปถ่ายหน้าแปลง/สวนแล้ว</p>
                        <p className="text-zinc-500 font-mono truncate max-w-sm">{form.farm_image_url}</p>
                      </div>
                    </div>
                  )}

                  <input
                    name="farm_image_url"
                    type="url"
                    value={form.farm_image_url}
                    onChange={handleChange}
                    placeholder="https://... URL รูปภาพหน้าสวนหรือแปลงเพาะปลูกจริง"
                    className="input-3d h-10 px-3 text-xs text-zinc-600 font-mono w-full"
                  />
                </div>

                {/* 3.3 วิดีโอหน้าแปลง / กระบวนการปลูก */}
                <div className="p-4 bg-white rounded-xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎥</span> 3. ลิงก์วิดีโอหน้าแปลง / กระบวนการเก็บเกี่ยวหน้างาน (MP4 Video URL)
                    </label>
                    {form.video_url && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, video_url: "" }))}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        ลบวิดีโอ
                      </button>
                    )}
                  </div>

                  <input
                    name="video_url"
                    type="url"
                    value={form.video_url}
                    onChange={handleChange}
                    placeholder="https://assets.mixkit.co/... หรือ ลิงก์ไฟล์วิดีโอ MP4 หน้างาน"
                    className="input-3d h-11 px-3 text-xs text-zinc-700 font-mono w-full font-bold"
                  />

                  {form.video_url ? (
                    <div className="mt-3 p-3 bg-zinc-900 rounded-2xl border-2 border-emerald-400 text-white">
                      <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                        <span>▶️</span> ตัวอย่างวิดีโอหน้าแปลงที่ผู้บริโภคจะเห็น:
                      </p>
                      <div className="relative rounded-xl overflow-hidden bg-black max-h-60 flex items-center justify-center">
                        <video
                          src={form.video_url}
                          controls
                          className="w-full max-h-60 object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      💡 ใส่ URL ไฟล์วิดีโอ MP4 เช่น วิดีโอเดินตรวจแปลง ตัดแต่งกิ่ง หรือเก็บเกี่ยวผลผลิต เพื่อให้ลูกค้ากดดูได้ทันที
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION 4: ความปลอดภัยของผู้บริโภค & หลักฐานใบรับรอง */}
              <div className="p-5 bg-amber-50/60 rounded-2xl border-2 border-amber-200 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
                  <span className="text-xl">📜</span>
                  <h4 className="font-black text-amber-950 text-base heading-3d">
                    ส่วนที่ 4: หลักฐานความปลอดภัยของผู้บริโภค & ใบรับรองมาตรฐาน (GAP / Organic)
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      เลขที่ใบรับรองมาตรฐาน / รหัสแปลงรับรอง
                    </label>
                    <input
                      name="cert_number"
                      value={form.cert_number}
                      onChange={handleChange}
                      placeholder="เช่น GAP-TH-73-04-98210 หรือ กษ 03-9001-3829-TH"
                      className="input-3d h-11 px-3.5 text-sm w-full font-mono font-bold"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      ระบุหมายเลขใบรับรอง GAP, Organic Thailand หรือใบรับรองกลุ่มวิสาหกิจชุมชน
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      รูปถ่ายใบรับรองมาตรฐาน / หนังสือสำคัญ
                    </label>

                    <input
                      type="file"
                      ref={certImageRef}
                      onChange={(e) => handleFileUpload(e, "cert_image_url")}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => certImageRef.current?.click()}
                        disabled={uploadingField === "cert_image_url"}
                        className="btn-3d-white text-xs px-4 py-2.5 font-bold cursor-pointer"
                      >
                        {uploadingField === "cert_image_url" ? "กำลังอัปโหลด..." : "📜 แนบรูปใบรับรอง"}
                      </button>

                      {form.cert_image_url && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, cert_image_url: "" }))}
                          className="text-xs text-rose-600 font-bold hover:underline"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>

                    {form.cert_image_url && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-amber-100/50 rounded-xl border border-amber-300">
                        <img
                          src={form.cert_image_url}
                          alt="Cert preview"
                          className="w-12 h-12 object-cover rounded-lg border border-amber-300 shadow-sm"
                        />
                        <span className="text-xs font-bold text-amber-950 truncate max-w-xs">
                          แนบรูปใบรับรองแล้ว
                        </span>
                      </div>
                    )}

                    <input
                      name="cert_image_url"
                      type="url"
                      value={form.cert_image_url}
                      onChange={handleChange}
                      placeholder="หรือวาง URL รูปใบรับรอง (https://...)"
                      className="input-3d h-10 px-3 text-xs text-zinc-600 font-mono w-full mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: ขั้นตอนการเก็บเกี่ยวและการทำก่อนสั่งซื้อ (Harvest & Prep Process) */}
              <div className="p-5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-300 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                  <span className="text-xl">🌾</span>
                  <h4 className="font-black text-emerald-950 text-base heading-3d">
                    ส่วนที่ 5: ขั้นตอนการเก็บเกี่ยว & ขั้นตอนการทำก่อนทำการสั่งซื้อ (แสดงให้ผู้บริโภคทราบ)
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    อธิบายขั้นตอนการเก็บเกี่ยว การคัดแยก และการเตรียมสินค้าก่อนจัดส่ง
                  </label>
                  <textarea
                    name="harvest_process"
                    value={form.harvest_process}
                    onChange={handleChange}
                    rows={4}
                    placeholder="เช่น 1. ตรวจสอบความสุก 2. ตัดสดรอบเช้าตรู่ 3. ล้างทำความสะอาดด้วยระบบน้ำโอโซน 4. บรรจุกล่องรักษาความสด..."
                    className="input-3d p-4 text-sm resize-y w-full font-medium leading-relaxed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    ℹ️ อธิบายให้ผู้บริโภคมั่นใจก่อนตัดสินใจสั่งซื้อว่าผลผลิตได้รับการดูแลและเก็บเกี่ยวอย่างถูกสุขอนามัย
                  </p>
                </div>
              </div>

              {/* SECTION 6: ช่องทางการโอนเงินตรงสู่เจ้าของสินค้า (Direct P2P Payment) */}
              <div className="p-6 bg-gradient-to-r from-emerald-100/80 via-green-50 to-emerald-100/80 rounded-2xl border-3 border-emerald-500 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">💳</span>
                    <div>
                      <h4 className="font-black text-emerald-950 text-base sm:text-lg heading-3d">
                        ส่วนที่ 6: ช่องทางรับเงินโอนตรงสู่เกษตรกรเจ้าของผลผลิต (Direct Payment)
                      </h4>
                      <p className="text-xs text-emerald-900 font-bold">
                        ผู้ซื้อจะโอนเงินเข้าบัญชีนี้โดยตรง 100% ไม่ถูกหักหัวคิว
                      </p>
                    </div>
                  </div>
                  <span className="stamp-seal bg-emerald-700 text-white border-white text-xs px-3 py-1 font-black">
                    ✓ ปลอดภัย & โปร่งใส
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    ข้อกำหนดความปลอดภัย: <strong>ชื่อบัญชีธนาคารต้องตรงกับชื่อจริงของผู้ลงขาย</strong> เพื่อสร้างความมั่นใจสูงสุดให้แก่ผู้ซื้อ
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ธนาคารผู้รับเงิน <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="bank_name"
                      value={form.bank_name}
                      onChange={handleChange}
                      className="input-3d h-11 px-3.5 text-sm cursor-pointer w-full font-bold"
                    >
                      {BANKS.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      เลขที่บัญชีธนาคาร <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="bank_account_number"
                      value={form.bank_account_number}
                      onChange={handleChange}
                      required
                      placeholder="เช่น 142-2-89410-3"
                      className="input-3d h-11 px-3.5 text-sm font-mono font-bold w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      ชื่อเจ้าของบัญชี (ต้องตรงกับชื่อผู้ขาย) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      name="bank_account_name"
                      value={form.bank_account_name}
                      onChange={handleChange}
                      required
                      placeholder="เช่น นายวิชัย วงศ์สุวรรณ"
                      className="input-3d h-11 px-3.5 text-sm font-bold w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      หมายเลขพร้อมเพย์ (PromptPay ID)
                    </label>
                    <input
                      name="promptpay_number"
                      value={form.promptpay_number}
                      onChange={handleChange}
                      placeholder="เช่น 0819823451 หรือเลขบัตร ปชช."
                      className="input-3d h-11 px-3.5 text-sm font-mono font-bold w-full"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      เบอร์โทรศัพท์ติดต่อหน้าแปลง / เกษตรกร
                    </label>
                    <input
                      name="seller_phone"
                      value={form.seller_phone}
                      onChange={handleChange}
                      placeholder="เช่น 081-982-3451 (ลุงวิชัย สวนสามพราน)"
                      className="input-3d h-11 px-3.5 text-sm font-bold w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="btn-3d-white text-xs sm:text-sm px-6 py-3 font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-3d-emerald text-xs sm:text-sm px-8 py-3 font-black cursor-pointer shadow-lg"
                >
                  {saving
                    ? "กำลังบันทึกข้อมูล..."
                    : editingId !== null
                    ? "✓ บันทึกการแก้ไขผลผลิต"
                    : "🌱 ยืนยันลงทะเบียนผลผลิตใหม่"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* 3D Product Table List */}
        <div className="card-3d-static overflow-hidden p-0 border-2 border-emerald-100 bg-white">
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b-2 border-emerald-100 flex items-center justify-between">
            <h3 className="font-black text-lg text-emerald-950 heading-3d">
              🌾 รายการผลผลิตและสถานะการตรวจสอบย้อนกลับ ({products.length} ชนิด)
            </h3>
            <span className="text-xs text-zinc-500 font-bold">
              คลิกปุ่ม “แก้ไข” เพื่ออัปเดตรูป วิดีโอ หรือขั้นตอนการทำได้ตลอดเวลา
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-zinc-600 font-bold text-sm">กำลังโหลดข้อมูลแปลงผลผลิต...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <span className="text-6xl block mb-3 animate-float-3d">👨‍🌾</span>
              <p className="font-black text-zinc-800 text-lg heading-3d">ยังไม่มีผลผลิตในรายการของคุณ</p>
              <p className="text-zinc-500 text-xs mt-1">
                คลิกปุ่ม “+ ลงทะเบียนผลผลิตใหม่” เพื่อเริ่มนำผลผลิตขึ้นตลาดปลูกรัก
              </p>
              <button
                onClick={openAddForm}
                className="btn-3d-emerald text-xs px-5 py-2.5 mt-4"
              >
                + ลงทะเบียนผลผลิตรายการแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-emerald-50/70 text-emerald-950 border-b-2 border-emerald-100 text-xs font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">ผลผลิต & ที่อยู่หน้างาน</th>
                    <th className="px-5 py-4">แหล่งที่มา & จังหวัด</th>
                    <th className="px-5 py-4">สื่อ & หลักฐาน</th>
                    <th className="px-5 py-4">ราคาต่อหน่วย</th>
                    <th className="px-5 py-4">คงเหลือ</th>
                    <th className="px-5 py-4">บัญชีรับเงินโอนตรง</th>
                    <th className="px-5 py-4">สถานะ</th>
                    {(canUpdate || canDelete) && <th className="px-5 py-4 text-right">จัดการ</th>}
                  </tr>
                </thead>

                <tbody className="divide-y-2 divide-emerald-50/80">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-bold shadow-md border-2 border-white shrink-0">
                              🥬
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 leading-snug">{item.name}</p>
                            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5 truncate max-w-xs">
                              <span>📍</span>
                              <span className="truncate">{item.origin_address || "แปลงเพาะปลูกวิสาหกิจชุมชนไทย"}</span>
                            </p>
                            {item.harvest_process && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1 max-w-xs font-medium mt-0.5">
                                🌾 {item.harvest_process}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="stamp-seal bg-emerald-700 text-white border-white text-[10px] px-2 py-0.5">
                            {item.location_type || "หน้าแปลง"}
                          </span>
                          <span className="text-xs font-bold text-zinc-700">
                            จ.{item.province || "นครปฐม"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 items-start text-xs font-bold">
                          {item.video_url ? (
                            <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <span>🎥</span> มีวิดีโอหน้าแปลง
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">ไม่มีวิดีโอ</span>
                          )}
                          {item.cert_number ? (
                            <span className="text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <span>📜</span> {item.cert_number}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-black text-emerald-900 text-base whitespace-nowrap">
                        ฿{Number(item.price).toLocaleString("th-TH")}
                      </td>

                      <td className="px-5 py-4 text-zinc-700 font-bold whitespace-nowrap">
                        {item.stock ?? item.quantity ?? 0} {item.unit || "กิโลกรัม"}
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="text-zinc-800 font-bold">
                          {item.bank_name || "กสิกรไทย"}
                        </div>
                        <div className="font-mono text-zinc-600 font-semibold">
                          {item.bank_account_number || "ระบุเลขบัญชี"}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-bold truncate max-w-[140px]">
                          ✓ {item.bank_account_name || currentUser?.fullName || "ชื่อตรงกับผู้ขาย"}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-3 py-1 ${
                            statusBadgeStyles[item.status] || statusBadgeStyles.available
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>
                      </td>

                      {(canUpdate || canDelete) && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() => openEditForm(item)}
                                className="btn-3d-white text-xs px-3 py-1 font-bold cursor-pointer"
                              >
                                ✏️ แก้ไข
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="btn-3d-rose text-xs px-3 py-1 font-bold cursor-pointer"
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <PlukrakFooter />
    </div>
  );
}
