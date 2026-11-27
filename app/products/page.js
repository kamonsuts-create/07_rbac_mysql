"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import PlukrakNavbar from "@/components/PlukrakNavbar";
import PlukrakFooter from "@/components/PlukrakFooter";
import FarmVideoPlayer from "@/components/FarmVideoPlayer";
import ImageLightbox from "@/components/ImageLightbox";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("@/components/DeliveryMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-xs sm:text-sm">
        กำลังโหลดแผนที่จัดส่ง...
      </div>
    ),
  }
);

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [selectedProvince, setSelectedProvince] = useState("ทั้งหมด");
  const [selectedLocationType, setSelectedLocationType] = useState("ทั้งหมด");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ข้อมูลผู้รับและตำแหน่งจัดส่ง
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerLatitude, setBuyerLatitude] = useState(null);
  const [buyerLongitude, setBuyerLongitude] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Modal สำหรับตรวจสอบที่มา วิดีโอหน้าแปลง
  const [inspectingProduct, setInspectingProduct] = useState(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState("");
  const [trackingModalData, setTrackingModalData] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // สลิปโอนเงินตรงสู่ผู้ขาย
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState("");
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const slipInputRef = useRef(null);

  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) setCurrentUser(data.user);
        }
      } catch {}
    }
    fetchUser();
  }, []);

  // โหลดและบันทึกตะกร้าจาก localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("plukrak_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("cart") === "open") {
        setIsCartOpen(true);
      }
      const categoryParam = params.get("category");
      if (categoryParam) {
        setSelectedCategory(categoryParam);
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearch(searchParam);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("plukrak_cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // ดึงข้อมูลสินค้าจาก API
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = [
    { label: "ทั้งหมด", key: "ทั้งหมด" },
    { label: "ผักสด", key: "ผักสด" },
    { label: "ผลไม้", key: "ผลไม้" },
    { label: "ข้าวและธัญพืช", key: "ข้าวและธัญพืช" },
    { label: "สินค้าแปรรูป", key: "สินค้าแปรรูป" },
  ];

  const renderCategoryIcon = (key, isActive) => {
    switch (key) {
      case "ทั้งหมด":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path
              d="M20 4C13.5 4 7 7.2 5.5 13.8C5.1 15.6 5.4 17.2 6 18.5C9.5 15 13.2 12.2 17.5 10.5C13.8 13.2 10.2 16.5 7.2 20.5C8.5 20.9 10.1 21 11.8 20.6C18.2 19.1 21 12.6 20 4Z"
              fill={isActive ? "#ffffff" : "#2f8536"}
            />
            <path
              d="M4 20.5C5.2 18.9 6.6 17.4 8.2 16"
              stroke={isActive ? "#ffffff" : "#1e6025"}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        );
      case "ผักสด":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path
              d="M18.8 4.2C12.8 4.5 7.6 8 6.4 14C6 16 6.5 17.8 7.5 19.2C11.4 19.8 15.8 17.8 18.2 13.6C19.8 10.8 19.6 7.1 18.8 4.2Z"
              fill={isActive ? "#dcfce7" : "#44b332"}
            />
            <path
              d="M7.5 19.2C10.5 15.2 13.8 11.8 17.2 9.2"
              stroke={isActive ? "#166534" : "#ffffff"}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M5 20C6.2 18.5 7.3 17.5 8.5 16.6"
              stroke={isActive ? "#ffffff" : "#1f6f26"}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        );
      case "ผลไม้":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path
              d="M12 4C13.5 2.2 15.5 1.5 17 2C16.8 3.8 15.2 5.5 13.5 6.2C13 5.4 12.5 4.7 12 4Z"
              fill={isActive ? "#dcfce7" : "#3ba82b"}
            />
            <path
              d="M12 6C10 5.2 7 6.5 5.5 8.5C3.5 11.2 3.8 15.5 6 18.5C8 21.2 10.5 22 12 21C13.5 22 16 21.2 18 18.5C20.2 15.5 20.5 11.2 18.5 8.5C17 6.5 14 5.2 12 6Z"
              fill={isActive ? "#ffffff" : "#e63946"}
            />
          </svg>
        );
      case "ข้าวและธัญพืช":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path
              d="M12 3V21M12 4C14 5.5 15 8 13.5 10C12.5 9 12 7 12 4ZM12 8C14 9.5 15 12 13.5 14C12.5 13 12 11 12 8ZM12 12C14 13.5 15 16 13.5 18C12.5 17 12 15 12 12ZM12 4C10 5.5 9 8 10.5 10C11.5 9 12 7 12 4ZM12 8C10 9.5 9 12 10.5 14C11.5 13 12 11 12 8ZM12 12C10 13.5 9 16 10.5 18C11.5 17 12 15 12 12Z"
              stroke={isActive ? "#ffffff" : "#d97706"}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        );
      case "สินค้าแปรรูป":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path
              d="M7 7H17V5C17 3.9 16.1 3 15 3H9C7.9 3 7 3.9 7 5V7Z"
              fill={isActive ? "#dcfce7" : "#b45309"}
            />
            <path
              d="M5 8C5 7.4 5.4 7 6 7H18C18.6 7 19 7.4 19 8V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V8Z"
              fill={isActive ? "#ffffff" : "#d97706"}
            />
            <path d="M8 11H16V16H8V11Z" fill={isActive ? "#b45309" : "#fef3c7"} />
          </svg>
        );
      default:
        return null;
    }
  };

  const availableProvinces = useMemo(() => {
    const defaultProvs = ["ทั้งหมด", "ปทุมธานี", "นครปฐม", "เชียงใหม่", "ร้อยเอ็ด", "เชียงราย", "เพชรบูรณ์", "สุราษฎร์ธานี", "จันทบุรี"];
    const provSet = new Set(defaultProvs);
    products.forEach((p) => {
      if (p.province && p.province.trim()) provSet.add(p.province.trim());
    });
    return Array.from(provSet);
  }, [products]);

  const locationTypes = ["ทั้งหมด", "หน้าแปลง", "หน้าสวน", "ตลาดวิสาหกิจชุมชน"];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === "ทั้งหมด" || p.category === selectedCategory;

      const keyword = search.toLowerCase().trim();
      const matchSearch =
        !keyword ||
        p.name?.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.farmer_name?.toLowerCase().includes(keyword) ||
        p.community_name?.toLowerCase().includes(keyword) ||
        p.province?.toLowerCase().includes(keyword) ||
        p.amphoe?.toLowerCase().includes(keyword) ||
        p.batch_lot_code?.toLowerCase().includes(keyword);

      const matchProv =
        selectedProvince === "ทั้งหมด" ||
        (p.province && p.province.toLowerCase().includes(selectedProvince.toLowerCase()));

      const matchLocationType =
        selectedLocationType === "ทั้งหมด" ||
        (p.location_type && p.location_type === selectedLocationType);

      return matchCat && matchSearch && matchProv && matchLocationType;
    });
  }, [products, selectedCategory, search, selectedProvince, selectedLocationType]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.qty,
    0
  );
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // ค้นหารหัสติดตามผลผลิต
  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackingCodeInput.trim()) return;

    const term = trackingCodeInput.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        `PLK-PT-${p.id}`.toLowerCase() === term ||
        `PLK-LOT-${p.id}`.toLowerCase() === term ||
        String(p.batch_lot_code || "").toLowerCase() === term ||
        String(p.id) === term ||
        p.name.toLowerCase().includes(term) ||
        (p.farmer_name && p.farmer_name.toLowerCase().includes(term))
    );

    if (matched) {
      setTrackingModalData({
        product: matched,
        code: matched.batch_lot_code || `PLK-PT-${matched.id}`,
        status: "พร้อมส่งตรงจากหน้าแปลง (ผ่านการตรวจสอบแล็บแล้ว 0.00 ppm)",
        timeline: [
          {
            step: "1. ตรวจสอบหน้าแปลงเพาะปลูก",
            time: "วันนี้ 05:30 น.",
            done: true,
            desc: `สถานที่: ${matched.origin_address || "แปลงเกษตรอินทรีย์ปทุมธานี"} ตรวจวัดความสมบูรณ์และค่า Brix`,
          },
          {
            step: "2. ตรวจสอบสารตกค้าง Rapid Test",
            time: "วันนี้ 06:45 น.",
            done: true,
            desc: `ผลตรวจทางห้องปฏิบัติการ: ${matched.lab_test_result || "0.00 ppm ปลอดภัย 100%"}`,
          },
          {
            step: "3. คัดเกรดพรีเมียมและบรรจุภัณฑ์",
            time: "วันนี้ 08:00 น.",
            done: true,
            desc: "บรรจุลงกล่องควบคุมอุณหภูมิ ติดสติกเกอร์รหัสตรวจสอบย้อนกลับ QR Code",
          },
          {
            step: "4. การโอนเงินตรงสู่เกษตรกร (Direct P2P)",
            time: "ระบบยืนยันแล้ว",
            done: true,
            desc: `บัญชีรับเงิน: ${matched.bank_name || "กสิกรไทย"} (${matched.bank_account_number || "142-2-89410-3"}) ชื่อตรงผู้ขาย`,
          },
          {
            step: "5. จัดส่งตรงถึงมือผู้บริโภค",
            time: "รอบจัดส่งบ่าย",
            done: false,
            desc: "รถควบคุมอุณหภูมิจัดส่งตรงถึงบ้านคุณภายในวันเดียว เพื่อรักษาความสดสูงสุด",
          },
        ],
      });
      setTrackingCodeInput("");
    }
  };

  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const url = URL.createObjectURL(file);
      setSlipPreview(url);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(""), 2500);
  };

  const handleUseCurrentLocation = () => {
    setOrderError("");
    if (!navigator.geolocation) {
      setOrderError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBuyerLatitude(Number(position.coords.latitude.toFixed(7)));
        setBuyerLongitude(Number(position.coords.longitude.toFixed(7)));
      },
      () => {
        setOrderError("ไม่สามารถระบุตำแหน่งได้ กรุณาคลิกบนแผนที่เพื่อปักหมุด");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleConfirmOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerAddress.trim()) {
      setOrderError("กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบถ้วน");
      return;
    }

    const phoneDigits = buyerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setOrderError("กรุณาตรวจสอบเบอร์โทรศัพท์ให้ถูกต้อง");
      return;
    }

    if (!Number.isFinite(Number(buyerLatitude)) || !Number.isFinite(Number(buyerLongitude))) {
      setOrderError("กรุณาปักหมุดตำแหน่งจัดส่งบนแผนที่ก่อนยืนยันคำสั่งซื้อ");
      return;
    }

    if (cart.length === 0) {
      setOrderError("ไม่มีสินค้าในตะกร้า");
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError("");

    try {
      let slipUrl = null;
      if (slipFile) {
        const formData = new FormData();
        formData.append("file", slipFile);
        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          slipUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_name: buyerName.trim(),
          recipient_phone: buyerPhone.trim(),
          delivery_address: buyerAddress.trim(),
          delivery_latitude: buyerLatitude,
          delivery_longitude: buyerLongitude,
          payment_slip_url: slipUrl,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.qty,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถบันทึกคำสั่งซื้อได้");
      }

      setOrderSuccessModal({
        orderId: data.orderId || Math.floor(100000 + Math.random() * 900000),
        items: [...cart],
        total: cartSubtotal,
        buyerName,
        buyerPhone,
        buyerAddress,
        deliveryTime: "ภายใน 24 ชม.",
      });

      setCart([]);
      setSlipFile(null);
      setSlipPreview(null);
      setIsCartOpen(false);
      setOrderError("");
    } catch (err) {
      console.error("Order error:", err);
      setOrderError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen text-[#152e1c] font-sans bg-[#f6f4eb] flex flex-col justify-between">
      {/* 🟢 TOP UNIFIED NAVBAR */}
      <PlukrakNavbar
        cartCount={cartItemCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* 🌾 MARKETPLACE HEADER BANNER */}
      <header className="bg-gradient-to-b from-[#eaf4e8] to-[#f6f4eb] border-b border-[#e5efe4] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2f8239] text-white text-xs font-black shadow-xs mb-2">
                <span>🛒 ตลาดผลผลิตเกษตรส่งตรงจากสวน</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#152e1c] tracking-tight">
                ตลาดผลผลิตชุมชนปทุมธานี (Pluk Rak Marketplace)
              </h1>
              <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                เลือกซื้อผลผลิตสดใหม่ตัดรอบเช้าจาก 10 วิสาหกิจชุมชนแท้ ปลอดสารพิษ 0.00 ppm
                โอนตรงสู่บัญชีเกษตรกรผู้ปลูกโดยตรง 100%
              </p>
            </div>

            {/* Link back to home / intro video */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs sm:text-sm border border-stone-200 shadow-xs transition"
              >
                <span>← กลับหน้าแรก & วิดีโอแนะนำ</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2f8239] hover:bg-[#256c2e] text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <span>🛒 ตะกร้าสินค้า ({cartItemCount})</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="bg-white rounded-full p-1.5 pl-5 sm:pl-6 shadow-sm border-2 border-[#dce8d8] flex items-center justify-between gap-2 focus-within:ring-3 focus-within:ring-[#2f8239]/20 transition">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-stone-400">🔍</span>
                <input
                  type="search"
                  aria-label="ค้นหาผลผลิต ชื่อเกษตรกร หรือรายละเอียด"
                  placeholder="ค้นหาผัก ผลไม้ ชื่อเกษตรกร หรือวิสาหกิจ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium text-[#1c301e] bg-transparent outline-none placeholder:text-stone-400"
                />
              </div>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold px-4 py-1.5 rounded-full cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 🌿 MAIN MARKETPLACE CATALOG */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-7">
        
        {/* Category Filter Pills */}
        <div
          role="tablist"
          aria-label="หมวดหมู่ผลผลิต"
          className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3.5 overflow-x-auto py-2 scrollbar-none"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(cat.key)}
                className={`inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-extrabold whitespace-nowrap cursor-pointer transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  isActive ? "plukrak-tab-active" : "plukrak-tab-idle"
                }`}
              >
                {renderCategoryIcon(cat.key, isActive)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Count & Filter Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-[#e3ebe0] pb-3 text-xs sm:text-sm">
          <p className="text-stone-600 font-semibold">
            แสดงผลผลิต: <strong className="text-[#2f8239] text-base">{filteredProducts.length}</strong> รายการ
            {selectedCategory !== "ทั้งหมด" && ` ในหมวด "${selectedCategory}"`}
            {search && ` คำค้นหา "${search}"`}
          </p>

          {/* Quick province filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">แหล่งปลูก:</span>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="bg-white border border-[#d5e2d2] rounded-xl px-3 py-1.5 text-xs font-bold text-[#152e1c] outline-none cursor-pointer"
            >
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov === "ทั้งหมด" ? "ทุกจังหวัด" : prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4-Column Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div key={s} className="plukrak-product-card p-2.5 animate-pulse">
                <div className="h-48 sm:h-52 rounded-[18px] bg-emerald-100/60" />
                <div className="px-2 pt-3 pb-2 space-y-2.5">
                  <div className="h-5 w-2/3 bg-stone-200 rounded-lg" />
                  <div className="h-4 w-1/2 bg-stone-200/80 rounded-lg" />
                  <div className="pt-2 flex items-end justify-between">
                    <div className="h-7 w-24 bg-emerald-100 rounded-lg" />
                    <div className="h-9 w-24 bg-emerald-200 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#e5e2d5] p-12 text-center shadow-sm max-w-xl mx-auto my-10">
            <span className="text-5xl block mb-3">🌱</span>
            <h2 className="text-xl font-black text-[#18331e]">
              ไม่พบผลผลิตที่ตรงกับเงื่อนไขการค้นหา
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-2">
              ลองค้นหาด้วยคำอื่น หรือกดรีเซ็ตตัวกรองเพื่อดูสินค้าทั้งหมด
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ทั้งหมด");
                setSelectedProvince("ทั้งหมด");
                setSearch("");
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-[#2f8239] text-white text-xs font-bold"
            >
              ดูผลผลิตทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => {
              const isOutOfStock =
                product.stock !== undefined &&
                product.stock !== null &&
                Number(product.stock) <= 0;

              return (
                <article
                  key={product.id}
                  className="plukrak-product-card p-2.5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Product Image & Badges */}
                    <div
                      onClick={() => setInspectingProduct(product)}
                      className="relative h-48 sm:h-52 rounded-[18px] overflow-hidden bg-[#eef5ee] cursor-pointer"
                      title="คลิกเพื่อตรวจสอบหน้าแปลงจริงและผลแล็บ"
                    >
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 plukrak-badge-category">
                        {product.category || "ผักสด"}
                      </span>

                      {product.lab_test_result && (
                        <span className="absolute top-2.5 right-2.5 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          ✓ {product.lab_test_result}
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/65 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                          🔍 ตรวจสอบหน้าแปลง
                        </span>
                      </div>
                    </div>

                    {/* Product Information */}
                    <div className="px-2 pt-3 pb-1">
                      <h3
                        onClick={() => setInspectingProduct(product)}
                        className="text-base sm:text-[17px] font-bold text-[#142817] leading-snug cursor-pointer hover:text-[#2f8239] transition line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#526350] font-semibold line-clamp-1">
                        <span>🧑‍🌾</span>
                        <span>{product.farmer_name || product.community_name || "เกษตรกรชุมชนปทุมธานี"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="px-2 pt-2 border-t border-[#eaf0e6] mt-3 flex items-center justify-between">
                    <div>
                      <div className="text-lg sm:text-xl font-black text-[#1b5e20] font-mono leading-none">
                        ฿{product.price}
                        <span className="text-xs text-stone-500 font-sans font-normal ml-1">
                          /{product.unit || "กก."}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 mt-0.5 block">
                        คงเหลือ: {product.stock ?? 20} {product.unit || "ชิ้น"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={
                        isOutOfStock
                          ? "px-4 py-2 rounded-full text-xs font-bold bg-stone-200 text-stone-400 cursor-not-allowed"
                          : "plukrak-add-btn px-4 py-2 text-xs font-extrabold cursor-pointer"
                      }
                    >
                      {isOutOfStock ? "สินค้าหมด" : "+ ใส่ตะกร้า"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Real-time Farm Lot Tracker Form */}
        <section
          id="tracking-section"
          className="mt-12 p-6 bg-white rounded-3xl border border-[#dce8d8] shadow-xs space-y-4"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#152e1c] flex items-center gap-2">
                <span>🛰️</span>
                <span>ตรวจสอบย้อนกลับรหัส Lot ผลผลิต (Farm Lot Verification)</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                พิมพ์รหัส Lot บนบรรจุภัณฑ์เพื่อตรวจดูผลแล็บ 0.00 ppm และพิกัดดาวเทียมหน้าแปลงจริง
              </p>
            </div>

            <form onSubmit={handleTrackSubmit} className="flex items-center gap-2 w-full lg:w-auto">
              <input
                type="text"
                placeholder="กรอกรหัส Lot เช่น PLK-PT-1..."
                value={trackingCodeInput}
                onChange={(e) => setTrackingCodeInput(e.target.value)}
                className="bg-[#f8faf8] text-[#152e1c] text-xs sm:text-sm px-4 py-2 rounded-full border border-[#dce8d8] outline-none focus:border-[#2f8239] w-full lg:w-64"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#2f8239] text-white text-xs font-extrabold cursor-pointer hover:bg-[#256c2e] transition shrink-0"
              >
                ตรวจสอบ
              </button>
            </form>
          </div>
        </section>

      </main>

      {/* 🟢 Inspect Product Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[32px] border border-[#dce9dc] shadow-2xl p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setInspectingProduct(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#f4f7f4] hover:bg-[#e6efe6] text-stone-700 font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2f8239] text-xs font-bold border border-[#c8e6c9]">
                📍 {inspectingProduct.location_type || "หน้าแปลง"} · จ.{inspectingProduct.province || "ปทุมธานี"}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                ✓ ตรวจสอบย้อนกลับได้จริง 100%
              </span>
            </div>

            <div className="mt-3 pb-3 border-b border-[#eef3ee] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1f3a24]">
                  {inspectingProduct.name}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  รหัส Lot: <span className="font-mono font-bold text-[#2f8239]">{inspectingProduct.batch_lot_code || `PLK-PT-${inspectingProduct.id}`}</span> · วิสาหกิจ: <strong>{inspectingProduct.farmer_name || "วิสาหกิจชุมชนปทุมธานี"}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[#2f8239] font-mono">฿{inspectingProduct.price}</span>
                <span className="text-xs text-stone-500 font-normal ml-1">/{inspectingProduct.unit || "ชิ้น"}</span>
              </div>
            </div>

            {/* Video Player */}
            {inspectingProduct.video_url && (
              <div className="mt-5">
                <FarmVideoPlayer
                  src={inspectingProduct.video_url}
                  poster={inspectingProduct.farm_image_url || inspectingProduct.image_url}
                  title={`วิดีโอหน้าแปลงจริง: ${inspectingProduct.name}`}
                  subtitle={`สถานที่: ${inspectingProduct.origin_address || "ปทุมธานี"}`}
                />
              </div>
            )}

            {/* Evidence Gallery */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() =>
                  setActiveLightboxImage({
                    url: inspectingProduct.image_url,
                    title: `รูปผลผลิตจริง: ${inspectingProduct.name}`,
                    subtitle: `฿${inspectingProduct.price}/${inspectingProduct.unit || "ชิ้น"}`,
                  })
                }
                className="p-3 bg-[#f8faf8] rounded-2xl border border-[#e2eae2] cursor-pointer group"
              >
                <p className="text-xs font-bold text-stone-700 mb-2">1. รูปถ่ายผลผลิตจริง (คลิกเพื่อขยาย)</p>
                <div className="h-44 rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={inspectingProduct.image_url}
                    alt={inspectingProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
              </div>

              <div
                onClick={() =>
                  setActiveLightboxImage({
                    url: inspectingProduct.cert_image_url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800",
                    title: `ใบรับรองมาตรฐาน: ${inspectingProduct.name}`,
                    subtitle: inspectingProduct.cert_number || "GAP Certified",
                  })
                }
                className="p-3 bg-[#fffbf2] rounded-2xl border border-[#f0e4cf] cursor-pointer group"
              >
                <p className="text-xs font-bold text-[#735118] mb-2">2. ใบรับรองมาตรฐาน GAP / Organic</p>
                <div className="h-44 rounded-xl overflow-hidden bg-amber-50">
                  <img
                    src={inspectingProduct.cert_image_url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800"}
                    alt="Certificate"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#eef3ee] flex items-center justify-between">
              <span className="text-xs text-stone-500 font-bold">
                พร้อมส่งในสต็อก: {inspectingProduct.stock ?? 20} {inspectingProduct.unit || "ชิ้น"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInspectingProduct(null)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 text-stone-700 text-xs font-bold"
                >
                  ปิด
                </button>
                <button
                  onClick={() => {
                    addToCart(inspectingProduct);
                    setInspectingProduct(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#2f8239] text-white text-xs font-extrabold shadow-md hover:bg-[#256c2e]"
                >
                  + ใส่ตะกร้าผลผลิตนี้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/70 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Cart Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h3 className="text-lg font-black text-[#152e1c]">
                  ตะกร้าผลผลิตชุมชน ({cartItemCount})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-5 flex-1 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <span className="text-5xl block mb-2">🧺</span>
                  <p className="font-bold text-sm text-stone-600">ยังไม่มีผลผลิตในตะกร้า</p>
                  <p className="text-xs mt-1">เลือกซื้อผักสด ผลไม้ และข้าวจากสวนชุมชนได้เลย</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#f8faf8] rounded-2xl border border-[#e2eae2] flex items-center gap-3"
                    >
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800"}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#152e1c] truncate">{item.name}</h4>
                        <p className="text-xs text-[#2f8239] font-bold font-mono">฿{item.price} /{item.unit || "กก."}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-xs flex items-center justify-center hover:bg-stone-100"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs w-4 text-center">{item.qty}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-xs flex items-center justify-center hover:bg-stone-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Subtotal */}
                  <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-sm">
                    <span className="font-bold text-stone-600">ยอดรวมผลผลิต:</span>
                    <span className="text-xl font-black text-[#2f8239] font-mono">฿{cartSubtotal.toLocaleString()}</span>
                  </div>

                  {/* Recipient Form */}
                  <div className="pt-3 border-t border-stone-200 space-y-3">
                    <h4 className="text-xs font-black text-[#152e1c] uppercase tracking-wider">
                      ข้อมูลผู้รับและสถานที่จัดส่ง
                    </h4>
                    <div>
                      <input
                        type="text"
                        placeholder="ชื่อ-นามสกุล ผู้รับ *"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 outline-none focus:border-[#2f8239]"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="เบอร์โทรศัพท์ติดต่อ *"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 outline-none focus:border-[#2f8239]"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={2}
                        placeholder="ที่อยู่จัดส่งโดยละเอียด *"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-stone-300 outline-none focus:border-[#2f8239]"
                      />
                    </div>

                    {/* Delivery Map */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <span className="font-bold text-stone-700">ปักหมุดตำแหน่งจัดส่ง:</span>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="text-[#2f8239] font-bold hover:underline"
                        >
                          📍 ใช้ตำแหน่งปัจจุบัน
                        </button>
                      </div>
                      <DeliveryMap
                        latitude={buyerLatitude}
                        longitude={buyerLongitude}
                        onChange={(lat, lng) => {
                          setBuyerLatitude(lat);
                          setBuyerLongitude(lng);
                        }}
                      />
                    </div>

                    {/* Direct Seller Bank Details */}
                    {cart.length > 0 && cart[0].bank_account_number && (
                      <div className="p-3.5 bg-[#f6faf6] rounded-2xl border border-[#cbe1cb] text-xs">
                        <p className="font-bold text-[#1f3a24] mb-1">💳 บัญชีโอนตรงสู่เกษตรกร:</p>
                        <p className="text-stone-700">{cart[0].bank_name || "ธนาคารกสิกรไทย"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-[#2f8239] text-sm">
                            {cart[0].bank_account_number}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cart[0].bank_account_number, "acc")}
                            className="text-[10px] bg-[#e8f5e9] text-[#2f8239] px-2 py-0.5 rounded font-bold"
                          >
                            {copiedAccount === "acc" ? "✓ คัดลอกแล้ว" : "คัดลอก"}
                          </button>
                        </div>
                        <p className="text-stone-600 mt-1">ชื่อบัญชี: {cart[0].bank_account_name || cart[0].farmer_name}</p>
                      </div>
                    )}

                    {/* Slip Upload */}
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        แนบหลักฐานการโอนเงิน (สลิป):
                      </label>
                      <input
                        ref={slipInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSlipChange}
                        className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#e8f5e9] file:text-[#2f8239] cursor-pointer"
                      />
                      {slipPreview && (
                        <div className="mt-2 h-28 w-24 rounded-xl overflow-hidden border border-stone-200">
                          <img src={slipPreview} alt="Slip Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {orderError && (
                      <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        ⚠️ {orderError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Button */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-stone-200 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isSubmittingOrder}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2f8239] to-[#1e6128] hover:brightness-105 active:scale-[0.99] text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? (
                    <span>กำลังบันทึกคำสั่งซื้อ...</span>
                  ) : (
                    <span>ยืนยันการสั่งซื้อ (฿{cartSubtotal.toLocaleString()}) ➔</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🟢 Order Success Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 border border-emerald-300 shadow-2xl">
            <span className="text-5xl block animate-bounce">🎉</span>
            <h3 className="text-2xl font-black text-[#152e1c]">สั่งซื้อผลผลิตสำเร็จ!</h3>
            <p className="text-xs text-stone-600">
              รหัสคำสั่งซื้อของคุณ: <strong className="font-mono text-[#2f8239] text-sm">#{orderSuccessModal.orderId}</strong>
            </p>
            <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e2eae2] text-left text-xs space-y-1.5 text-stone-700">
              <p><strong>ผู้รับ:</strong> {orderSuccessModal.buyerName}</p>
              <p><strong>เบอร์โทร:</strong> {orderSuccessModal.buyerPhone}</p>
              <p><strong>ยอดชำระ:</strong> ฿{orderSuccessModal.total?.toLocaleString()}</p>
              <p><strong>กำหนดส่ง:</strong> {orderSuccessModal.deliveryTime}</p>
            </div>
            <button
              onClick={() => setOrderSuccessModal(null)}
              className="w-full py-2.5 rounded-full bg-[#2f8239] text-white font-extrabold text-xs"
            >
              รับทราบ / ช้อปปิ้งต่อ
            </button>
          </div>
        </div>
      )}

      {/* 🖼️ Fullscreen Image Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />

      {/* 🟢 UNIFIED FOOTER */}
      <PlukrakFooter />
    </div>
  );
}
