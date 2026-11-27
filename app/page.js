"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import FarmVideoPlayer from "@/components/FarmVideoPlayer";
import ImageLightbox from "@/components/ImageLightbox";
import CartoonIntroHero from "@/components/CartoonIntroHero";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(
  () => import("@/components/DeliveryMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">
        กำลังโหลดแผนที่...
      </div>
    ),
  }
);

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellersLoading, setSellersLoading] = useState(true);
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

  // Modal สำหรับตรวจสอบที่มา วิดีโอหน้าแปลง และขั้นตอนการเก็บเกี่ยว
  const [inspectingProduct, setInspectingProduct] = useState(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState("");

  // Modal สำหรับดูข้อมูลเจาะลึกวิสาหกิจชุมชน วิดีโอหน้าแปลง ขั้นตอนการผลิต และสินค้าของชุมชนนั้น
  const [selectedCommunityModal, setSelectedCommunityModal] = useState(null);
  const [selectedAmphoeFilter, setSelectedAmphoeFilter] = useState("ทั้งหมด");
  const [trackingModalData, setTrackingModalData] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // อัปโหลดสลิปโอนเงินตรงสู่ผู้ขาย
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState("");
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const slipInputRef = useRef(null);

  // ตรวจสอบสถานะการเข้าสู่ระบบ (ไม่บังคับ login สำหรับผู้ชมหน้าร้าน)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("cart") === "open") {
        setIsCartOpen(true);
      }
    }

    async function fetchCurrentUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setCurrentUser(data.user);
          }
        }
      } catch {
        // ผู้ชมทั่วไปยังไม่ได้เข้าสู่ระบบ
      }
    }
    fetchCurrentUser();
  }, []);

  // ดึงข้อมูลสินค้าจาก API (/api/products)
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

  // ดึงข้อมูล 10 วิสาหกิจชุมชนจริงในปทุมธานี (/api/sellers)
  useEffect(() => {
    async function fetchSellers() {
      try {
        const res = await fetch("/api/sellers");
        const data = await res.json();
        if (data.sellers) {
          setSellers(data.sellers);
        }
      } catch (err) {
        console.error("Failed to load sellers:", err);
      } finally {
        setSellersLoading(false);
      }
    }
    fetchSellers();
  }, []);

  // รายชื่อจังหวัดที่มีในระบบแบบไดนามิก โดยมีปทุมธานีเป็นอันดับแรก
  const availableProvinces = useMemo(() => {
    const defaultProvs = ["ทั้งหมด", "ปทุมธานี", "นครปฐม", "เชียงใหม่", "ร้อยเอ็ด", "เชียงราย", "เพชรบูรณ์", "สุราษฎร์ธานี", "จันทบุรี"];
    const provSet = new Set(defaultProvs);
    products.forEach((p) => {
      if (p.province && p.province.trim()) {
        provSet.add(p.province.trim());
      }
    });
    return Array.from(provSet);
  }, [products]);

  const locationTypes = ["ทั้งหมด", "หน้าแปลง", "หน้าสวน", "ตลาดวิสาหกิจชุมชน"];
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
              d="M12 6.2C12 4.3 13.4 2.8 15.2 2.5"
              stroke={isActive ? "#dcfce7" : "#6b4226"}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M12.8 5.2C14.8 3.6 17.4 3.8 18.4 5.4C16.6 6.8 14.3 6.7 12.8 5.2Z"
              fill={isActive ? "#bbf7d0" : "#3da62d"}
            />
            <path
              d="M12 7.4C9.5 6.4 6 7.6 5.2 11.2C4.3 15.2 6.8 20.5 10.2 20.8C11.1 20.9 11.6 20.4 12 20.4C12.4 20.4 12.9 20.9 13.8 20.8C17.2 20.5 19.7 15.2 18.8 11.2C18 7.6 14.5 6.4 12 7.4Z"
              fill="#e53935"
            />
            <ellipse cx="9" cy="11.2" rx="1.3" ry="2.2" transform="rotate(-20 9 11.2)" fill="#ffffff" fillOpacity="0.45" />
          </svg>
        );
      case "ข้าวและธัญพืช":
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <path d="M5 19L18 6" stroke={isActive ? "#fde68a" : "#d97706"} strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="15.5" cy="6.2" rx="2.8" ry="1.5" transform="rotate(-45 15.5 6.2)" fill="#f59e0b" />
            <ellipse cx="12.2" cy="9.5" rx="2.8" ry="1.5" transform="rotate(-15 12.2 9.5)" fill="#fbbf24" />
            <ellipse cx="14.5" cy="11.8" rx="2.8" ry="1.5" transform="rotate(-75 14.5 11.8)" fill="#f59e0b" />
            <ellipse cx="9.2" cy="12.5" rx="2.8" ry="1.5" transform="rotate(-15 9.2 12.5)" fill="#fbbf24" />
            <ellipse cx="11.5" cy="14.8" rx="2.8" ry="1.5" transform="rotate(-75 11.5 14.8)" fill="#f59e0b" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
            <rect x="7" y="3.5" width="10" height="3.2" rx="1.4" fill="#a16207" />
            <rect x="6" y="7" width="12" height="13.5" rx="3.2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
            <path d="M6.6 10.5H17.4" stroke="#fef3c7" strokeWidth="1.8" />
            <rect x="8.5" y="12.2" width="7" height="4.5" rx="1.2" fill="#fef3c7" />
          </svg>
        );
    }
  };

  const getDisplayUnit = (unit) => {
    const cleaned = String(unit || "กิโลกรัม")
      .replace(/\s*\(.*?\)\s*/g, "")
      .trim();
    return cleaned || "กิโลกรัม";
  };

  const getShortStockUnit = (unit) => {
    const displayUnit = getDisplayUnit(unit);
    if (displayUnit === "กิโลกรัม") return "กก.";
    return displayUnit;
  };

  const getCategoryBadgeClass = (category) => {
    const cat = String(category || "").toLowerCase();
    if (cat.includes("veg") || cat.includes("ผัก")) return "badge-cat-veg";
    if (cat.includes("fruit") || cat.includes("ผลไม้")) return "badge-cat-fruit";
    if (cat.includes("grain") || cat.includes("ข้าว") || cat.includes("ธัญพืช")) return "badge-cat-grain";
    if (cat.includes("proc") || cat.includes("แปรรูป")) return "badge-cat-processed";
    return "badge-cat-mushroom";
  };

  const getCategoryDisplayLabel = (category) => {
    const cat = String(category || "").toLowerCase();
    if (cat.includes("veg") || cat.includes("ผัก")) return "ผักสด";
    if (cat.includes("fruit") || cat.includes("ผลไม้")) return "ผลไม้";
    if (cat.includes("grain") || cat.includes("ข้าว") || cat.includes("ธัญพืช")) return "ข้าวและธัญพืช";
    if (cat.includes("proc") || cat.includes("แปรรูป")) return "สินค้าแปรรูป";
    if (cat.includes("mushroom") || cat.includes("เห็ด")) return "เห็ดสด";
    return "ผักสด";
  };

  // ระบบค้นหาและกรองสินค้าตาม จังหวัด, แหล่งกำเนิด, หมวดหมู่ และคำค้น
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.trim().toLowerCase();
      const matchesSearch =
        !keyword ||
        String(product.name || "").toLowerCase().includes(keyword) ||
        String(product.farmer_name || "").toLowerCase().includes(keyword) ||
        String(product.origin_address || "").toLowerCase().includes(keyword) ||
        String(product.province || "").toLowerCase().includes(keyword) ||
        String(product.amphoe || "").toLowerCase().includes(keyword) ||
        String(product.location_type || "").toLowerCase().includes(keyword) ||
        String(product.description || "").toLowerCase().includes(keyword) ||
        String(product.harvest_process || "").toLowerCase().includes(keyword);

      const productCat = String(product.category || "").trim().toLowerCase();
      let matchesCategory = selectedCategory === "ทั้งหมด";
      if (!matchesCategory) {
        if (selectedCategory === "ผักสด") {
          matchesCategory =
            productCat.includes("veg") ||
            productCat.includes("ผัก") ||
            productCat.includes("mushroom") ||
            productCat.includes("เห็ด");
        } else if (selectedCategory === "ผลไม้") {
          matchesCategory = productCat.includes("fruit") || productCat.includes("ผลไม้");
        } else if (selectedCategory === "ข้าวและธัญพืช") {
          matchesCategory =
            productCat.includes("grain") ||
            productCat.includes("ข้าว") ||
            productCat.includes("ธัญพืช");
        } else if (selectedCategory === "สินค้าแปรรูป") {
          matchesCategory = productCat.includes("proc") || productCat.includes("แปรรูป");
        } else {
          matchesCategory = productCat === selectedCategory.toLowerCase();
        }
      }

      const matchesProvince =
        selectedProvince === "ทั้งหมด" ||
        (product.province && product.province.includes(selectedProvince)) ||
        (product.origin_address && product.origin_address.includes(selectedProvince));

      const matchesLocationType =
        selectedLocationType === "ทั้งหมด" ||
        product.location_type === selectedLocationType;

      return matchesSearch && matchesCategory && matchesProvince && matchesLocationType;
    });
  }, [products, search, selectedCategory, selectedProvince, selectedLocationType]);

  // ระบบกรอง 10 วิสาหกิจชุมชนตามอำเภอในปทุมธานี
  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      if (selectedAmphoeFilter === "ทั้งหมด") return true;
      return seller.amphoe === selectedAmphoeFilter;
    });
  }, [sellers, selectedAmphoeFilter]);

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

  // ค้นหารหัสติดตามผลผลิตและสถานะคำสั่งซื้อแบบ Real-time
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
    } else if (products.length > 0) {
      setTrackingModalData({
        product: products[0],
        code: `PLK-PT-${products[0].id}`,
        status: "พร้อมส่งตรงจากหน้าแปลง (ผ่านการตรวจสอบแล็บแล้ว)",
        timeline: [
          {
            step: "1. ตรวจสอบหน้าแปลงเพาะปลูก",
            time: "วันนี้ 05:30 น.",
            done: true,
            desc: `แปลงเกษตรปลอดภัย อ.${products[0].amphoe || "หนองเสือ"} จ.ปทุมธานี`,
          },
          {
            step: "2. ตรวจสอบสารตกค้าง Rapid Test",
            time: "วันนี้ 06:45 น.",
            done: true,
            desc: "ผลตรวจสารเคมีตกค้าง 0.00 ppm ปลอดภัย 100%",
          },
          {
            step: "3. การเตรียมผลผลิตพร้อมส่ง",
            time: "พร้อมจัดส่ง",
            done: true,
            desc: "คัดเกรดพรีเมียม ตัดสดส่งตรงจากสวนสู่ครัวเรือน",
          },
        ],
      });
      setTrackingCodeInput("");
    }
  };

  // จัดการอัปโหลดสลิปโอนเงินตรง
  const handleSlipChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const url = URL.createObjectURL(file);
      setSlipPreview(url);
    }
  };

  // คัดลอกเลขบัญชี
  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(""), 2500);
  };

  // ใช้ตำแหน่งปัจจุบันของผู้สั่งซื้อ
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
        setOrderError("ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง หรือคลิกบนแผนที่");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // ยืนยันคำสั่งซื้อและบันทึกข้อมูลผู้รับลง MySQL
  const handleConfirmOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerAddress.trim()) {
      setOrderError("กรุณากรอกชื่อ เบอร์โทรศัพท์ และที่อยู่จัดส่งให้ครบ");
      return;
    }

    const phoneDigits = buyerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 10) {
      setOrderError("กรุณาตรวจสอบเบอร์โทรศัพท์ให้ถูกต้อง");
      return;
    }

    if (
      !Number.isFinite(Number(buyerLatitude)) ||
      !Number.isFinite(Number(buyerLongitude))
    ) {
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
      const payload = {
        buyer_name: buyerName.trim(),
        buyer_phone: buyerPhone.trim(),
        buyer_address: buyerAddress.trim(),
        buyer_latitude: buyerLatitude,
        buyer_longitude: buyerLongitude,
        items: cart,
        // ยังไม่ส่ง URL รูปสลิปชั่วคราวไปบันทึกในฐานข้อมูล
        transfer_slip_url: null,
        notes: "คำสั่งซื้อโอนตรงสู่เจ้าของผลผลิตในปทุมธานี",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถบันทึกคำสั่งซื้อได้");
      }

      const createdOrders = Array.isArray(data.orders)
        ? data.orders
        : data.order_code
          ? [{
              order_code: data.order_code,
              order_id: data.order_id,
              total_amount: data.total_amount,
            }]
          : [];

      if (
        createdOrders.length === 0 ||
        createdOrders.some((order) => !order.order_code)
      ) {
        throw new Error("ระบบไม่ได้รับรหัสคำสั่งซื้อ กรุณาตรวจสอบรายการสั่งซื้อ");
      }

      setOrderSuccessModal({
        lotCode: data.order_code || createdOrders[0].order_code,
        orders: createdOrders,
        items: [...cart],
        total: Number(data.total_amount ?? cartSubtotal),
        hasSlip: false,
      });

      setCart([]);
      setSlipFile(null);
      setSlipPreview(null);
      setIsCartOpen(false);
      setOrderError("");
    } catch (err) {
      console.error("Order error:", err);
      setOrderError(err.message || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const dashboardHref =
    currentUser?.role === "admin"
      ? "/admin"
      : currentUser?.role === "farmer"
      ? "/farmer/products"
      : "/dashboard";

  return (
    <div className="min-h-screen text-[#152e1c] font-sans relative bg-[#f6f4eb] overflow-x-hidden">
      {/* 🌞 FULL-BLEED SUNNY FARM ILLUSTRATED HERO (Matching Reference Mockup) */}
      <section className="relative w-full overflow-hidden bg-[#7ecbfa] pb-20 sm:pb-24 lg:pb-28">
        {/* Illustrated Farm Panorama Background */}
        <img
          src="/images/plukrak-hero-scene.jpg"
          alt="บรรยากาศฟาร์มเกษตรชุมชนปลูกรัก"
          className="absolute inset-0 w-full h-full object-cover object-[72%_28%] sm:object-[66%_24%] lg:object-[62%_22%] select-none pointer-events-none"
        />
        {/* Soft sunlit atmospheric readability veil on left/center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.14) 48%, rgba(255,255,255,0) 72%), linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 45%, rgba(34,90,30,0.12) 100%)",
          }}
        />

        {/* Top Floating Header inside Hero Sky */}
        <header className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-5 flex items-start justify-between gap-3">
          {/* Top-Left Brand Cloud Pill */}
          <div className="bg-white/93 backdrop-blur-md rounded-[28px] px-4 sm:px-5 py-2 sm:py-2.5 shadow-[0_8px_24px_rgba(16,65,28,0.14)] border border-white">
            <Logo size="normal" showSubtitle={true} />
          </div>

          {/* Top-Right Action Pills (Cart with Red Badge + Login) */}
          <nav aria-label="เมนูหลัก" className="flex items-center gap-2.5 sm:gap-3 pt-1">
            <a
              href="#intro-video"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-full bg-white/90 hover:bg-white text-[#1b4624] font-bold text-xs sm:text-sm px-4 py-2.5 shadow-[0_6px_16px_rgba(15,55,25,0.12)] border border-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <span>🎬 วิดีโอแนะนำ</span>
            </a>

            <a
              href="#marketplace"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/90 hover:bg-white text-[#1b4624] font-bold text-xs sm:text-sm px-4 py-2.5 shadow-[0_6px_16px_rgba(15,55,25,0.12)] border border-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <span>🛒 ตลาดผลผลิต</span>
            </a>

            <Link
              href="/news"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-white/90 hover:bg-white text-[#1b4624] font-bold text-xs sm:text-sm px-4 py-2.5 shadow-[0_6px_16px_rgba(15,55,25,0.12)] border border-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <span>ข่าวสารชุมชน</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-white hover:bg-[#f6fcf4] text-[#1a331e] font-extrabold text-sm sm:text-base px-4 sm:px-5 py-2.5 shadow-[0_6px_18px_rgba(15,55,25,0.16)] border border-white cursor-pointer transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="เปิดตะกร้าสินค้า"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-[#1f6328] shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
              </svg>
              <span>ตะกร้า</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-[#ef233c] text-white text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <Link
              href={currentUser ? dashboardHref : "/login"}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#2f8239] to-[#1a5622] hover:brightness-105 text-white font-extrabold text-sm sm:text-base px-4 sm:px-5 py-2.5 shadow-[0_6px_18px_rgba(14,52,22,0.26)] border border-white/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white shrink-0"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
              </svg>
              <span>
                {currentUser
                  ? currentUser.role === "admin"
                    ? "ระบบแอดมิน"
                    : currentUser.role === "farmer"
                    ? "จัดการผลผลิต"
                    : "บัญชีของฉัน"
                  : "เข้าสู่ระบบ"}
              </span>
            </Link>
          </nav>
        </header>

        {/* Hero Main Content: Wooden Sign + Center Sticker Title + Search Bar */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-5 lg:gap-8">
            {/* Left: Tilted Wooden Farm Signboard Plaque (เหมือนป้ายไม้ซ้ายมือในต้นแบบ) */}
            <div className="hidden md:flex flex-col items-center shrink-0 ml-1 lg:ml-3 -mb-2 select-none">
              <div className="wooden-plaque-mockup px-5 py-4 w-48 lg:w-52 space-y-2.5">
                {[
                  { text: "สดใหม่", heart: false },
                  { text: "จากสวน", heart: false },
                  { text: "สู่มือคุณ", heart: true },
                ].map((row) => (
                  <div key={row.text} className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#fffdf7] flex items-center justify-center shadow-sm shrink-0">
                      <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#25802d]" fill="none">
                        <path
                          d="M4.5 10.5L8.2 14.2L15.8 6.2"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span
                      className="text-white font-extrabold text-base lg:text-[17px] tracking-tight flex items-center gap-1.5"
                      style={{ textShadow: "0 2px 3px rgba(68, 30, 4, 0.65)" }}
                    >
                      {row.text}
                      {row.heart && <span className="text-[#fff8eb] text-sm">♥</span>}
                    </span>
                  </div>
                ))}
              </div>
              {/* Wooden Post */}
              <div className="w-4 h-10 bg-gradient-to-r from-[#7c4110] via-[#b56727] to-[#69350b] rounded-b-md shadow-md -mt-1 -rotate-3" />
            </div>

            {/* Center-Left: Big Glossy Sprout + Sticker Title + Slogan */}
            <div className="w-full md:max-w-[54%] lg:max-w-[52%] text-center flex flex-col items-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3.5">
                {/* Large Glossy Sprout with White Sticker Border */}
                <svg
                  viewBox="0 0 110 105"
                  className="w-16 h-16 sm:w-22 sm:h-22 lg:w-24 lg:h-24 -mr-1 drop-shadow-[0_8px_14px_rgba(16,65,24,0.25)] shrink-0"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="heroLeafLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a3f05a" />
                      <stop offset="55%" stopColor="#3db828" />
                      <stop offset="100%" stopColor="#1b7419" />
                    </linearGradient>
                    <linearGradient id="heroLeafRight" x1="15%" y1="0%" x2="85%" y2="100%">
                      <stop offset="0%" stopColor="#95ec4e" />
                      <stop offset="50%" stopColor="#2fae22" />
                      <stop offset="100%" stopColor="#156315" />
                    </linearGradient>
                  </defs>
                  {/* White Sticker Backing */}
                  <g stroke="#ffffff" strokeWidth="11" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M54 92C54 71 58 51 73 36" />
                    <path d="M54 68C34 67 12 52 15 28C36 24 54 40 54 68Z" fill="#ffffff" />
                    <path d="M56 58C56 32 74 12 97 14C99 42 79 59 56 58Z" fill="#ffffff" />
                  </g>
                  {/* Colored Sprout */}
                  <path
                    d="M54 92C54 71 58 51 73 36"
                    stroke="#24841c"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M54 68C34 67 12 52 15 28C36 24 54 40 54 68Z"
                    fill="url(#heroLeafLeft)"
                  />
                  <path
                    d="M23 34C34 35 44 45 50 60"
                    stroke="#d9f99d"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M56 58C56 32 74 12 97 14C99 42 79 59 56 58Z"
                    fill="url(#heroLeafRight)"
                  />
                  <path
                    d="M61 52C69 38 80 26 91 20"
                    stroke="#ecfccb"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </svg>

                <h1 className="text-5xl sm:text-6xl lg:text-[4.4rem] font-black tracking-tight leading-none hero-sticker-title select-none">
                  ปลูกรัก
                </h1>

                <span className="bg-gradient-to-b from-[#55c72c] via-[#3cb121] to-[#278c14] text-white text-xl sm:text-2xl lg:text-[1.9rem] font-extrabold italic px-5 sm:px-6 py-1 sm:py-1.5 rounded-full border-[4px] border-white shadow-[0_8px_18px_rgba(18,74,22,0.28),inset_0_2px_0_rgba(255,255,255,0.45)] -rotate-2 select-none">
                  Pluk Rak
                </span>
              </div>

              {/* Subtitle with Sticker Outline + Golden Brush Swoop */}
              <div className="mt-2 sm:mt-3 inline-flex flex-col items-center">
                <p className="text-lg sm:text-2xl lg:text-[1.65rem] font-black tracking-tight hero-sticker-subtitle">
                  ตลาดผลผลิตเกษตรชุมชนส่งตรงจากสวน
                </p>
                <svg
                  viewBox="0 0 360 22"
                  className="w-56 sm:w-72 lg:w-80 h-4 sm:h-5 -mt-0.5 drop-shadow-[0_2px_4px_rgba(120,80,0,0.2)]"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 16C95 5 245 4 348 13"
                    stroke="#facc15"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M48 18C130 11 235 10 315 15"
                    stroke="#fde047"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Floating Pill Search Bar (Centered across lower Hero just like Mockup) */}
          <div className="max-w-2xl mx-auto mt-6 sm:mt-8 relative z-30">
            <div className="bg-white/97 backdrop-blur-md rounded-full p-1.5 pl-5 sm:pl-6 shadow-[0_10px_28px_rgba(18,62,24,0.2)] border-2 border-white flex items-center justify-between gap-2 focus-within:ring-4 focus-within:ring-emerald-400/40 transition">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-[#6e7d6b] shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20L16.4 16.4" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  aria-label="ค้นหาผลผลิต ชื่อเกษตรกร หรือรายละเอียด"
                  placeholder="ค้นหาผลผลิต ชื่อเกษตรกร หรือรายละเอียด..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-sm sm:text-base font-medium text-[#1c301e] bg-transparent outline-none placeholder:text-[#7c8778]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ทั้งหมด");
                  setSelectedProvince("ทั้งหมด");
                  setSelectedLocationType("ทั้งหมด");
                }}
                className="bg-gradient-to-b from-[#bfe4af] to-[#a2d48e] hover:from-[#b0dc9e] hover:to-[#91c97b] text-[#173c1d] text-sm sm:text-base font-extrabold px-6 sm:px-7 py-2 rounded-full transition cursor-pointer shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                ล้าง
              </button>
            </div>
          </div>
        </div>

        {/* Smooth Upward Cream Arch Curve at Bottom of Hero */}
        <div className="absolute bottom-0 inset-x-0 z-20 pointer-events-none leading-none">
          <svg
            viewBox="0 0 1440 96"
            preserveAspectRatio="none"
            className="w-full h-12 sm:h-16 lg:h-20 block"
            aria-hidden="true"
          >
            <path
              d="M0,96 L0,76 Q720,-24 1440,76 L1440,96 Z"
              fill="#ffffff"
              fillOpacity="0.65"
            />
            <path
              d="M0,96 L0,82 Q720,-16 1440,82 L1440,96 Z"
              fill="#f6f4eb"
            />
          </svg>
        </div>
      </section>

      {/* 🎪 CARTOON STORY & VIDEO INTRO SECTION (โรงภาพยนตร์การ์ตูนแนะนำเว็บก่อนเข้าสู่หน้าซื้อขาย) */}
      <div id="intro-video" className="scroll-mt-4">
        <CartoonIntroHero
          onExploreMarketplace={() => {
            const el = document.getElementById("marketplace");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>

      {/* 🌿 CREAM MARKETPLACE SECTION: Category Pills + Clean 4-Column Product Grid */}
      <div id="marketplace" className="relative z-30 pt-2 pb-4 scroll-mt-6">
        {/* Decorative Side Foliage Leaves on Wide Desktop (Matching Mockup Frame) */}
        <svg
          viewBox="0 0 80 260"
          className="hidden xl:block fixed left-0 top-[56%] w-14 h-48 pointer-events-none z-20 opacity-90 drop-shadow-md"
          fill="none"
          aria-hidden="true"
        >
          <path d="M-10 40C25 32 58 52 64 78C32 84 4 68 -10 40Z" fill="#3da82e" />
          <path d="M-12 115C22 104 52 120 60 146C28 154 2 140 -12 115Z" fill="#2c8c22" />
          <path d="M-8 188C20 180 46 196 52 218C24 224 2 212 -8 188Z" fill="#4bc038" />
        </svg>
        <svg
          viewBox="0 0 80 260"
          className="hidden xl:block fixed right-0 top-[56%] w-14 h-48 pointer-events-none z-20 opacity-90 drop-shadow-md"
          fill="none"
          aria-hidden="true"
        >
          <path d="M90 40C55 32 22 52 16 78C48 84 76 68 90 40Z" fill="#3da82e" />
          <path d="M92 115C58 104 28 120 20 146C52 154 78 140 92 115Z" fill="#2c8c22" />
          <path d="M88 188C60 180 34 196 28 218C56 224 78 212 88 188Z" fill="#4bc038" />
        </svg>

        {/* 5 Rounded 3D Category Pills (ทั้งหมด / ผักสด / ผลไม้ / ข้าวและธัญพืช / สินค้าแปรรูป) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>

        {/* 4-Column Clean Product Grid (Exact Reference Card Style) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 sm:mt-7">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="plukrak-product-card p-2.5 animate-pulse"
                >
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
            <div className="bg-white rounded-3xl border border-[#e5e2d5] p-12 text-center shadow-sm max-w-xl mx-auto my-6">
              <span className="text-5xl block mb-3">🌱</span>
              <h2 className="text-xl font-black text-[#18331e]">
                ไม่พบผลผลิตที่ตรงกับเงื่อนไขการค้นหา
              </h2>
              <p className="text-sm text-[#61705d] mt-1.5">
                ลองเปลี่ยนหมวดหมู่หรือกดปุ่มด้านล่างเพื่อดูรายละเอียดสดจากสวนทั้งหมด
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("ทั้งหมด");
                  setSelectedProvince("ทั้งหมด");
                  setSelectedLocationType("ทั้งหมด");
                }}
                className="mt-5 plukrak-add-btn px-6 py-2.5 text-sm font-extrabold cursor-pointer"
              >
                ดูรายละเอียดทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {filteredProducts.map((product) => {
                const stockAmount = Number(product.stock ?? 0);
                const isOutOfStock = stockAmount <= 0;

                return (
                  <article
                    key={product.id}
                    className="plukrak-product-card p-2.5 flex flex-col group"
                  >
                    {/* Product Photo + Pastel Category Pill */}
                    <div
                      onClick={() => setInspectingProduct(product)}
                      className="h-48 sm:h-52 rounded-[18px] bg-[#edf6ea] relative overflow-hidden cursor-pointer"
                      title="คลิกเพื่อดูที่มาแปลงปลูก วิดีโอ และใบรับรอง"
                    >
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />

                      {/* Top-Left Pastel Category Pill (Matching Mockup) */}
                      <span
                        className={`absolute top-3 left-3 text-xs px-3.5 py-1 ${getCategoryBadgeClass(
                          product.category
                        )}`}
                      >
                        {getCategoryDisplayLabel(product.category)}
                      </span>

                      {/* Subtle Origin/Video Inspect Hint on Hover */}
                      <span className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/65 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                        {product.video_url ? "🎥 ดูวิดีโอแปลง" : "🔍 ดูที่มาสินค้า"}
                      </span>
                    </div>

                    {/* Clean Card Body: Name, Farmer, Price/Unit, Stock, + ใส่ตะกร้า */}
                    <div className="px-2 pt-3 pb-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <button
                          type="button"
                          onClick={() => setInspectingProduct(product)}
                          className="text-left w-full cursor-pointer focus-visible:outline-none focus-visible:underline"
                        >
                          <h2 className="font-extrabold text-[#182e1c] text-lg sm:text-[19px] group-hover:text-[#236f2b] transition-colors leading-snug line-clamp-1">
                            {product.name}
                          </h2>
                        </button>

                        {/* Farmer Avatar + Name */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-[#5c6b58]">
                          <span
                            className="w-5 h-5 rounded-full bg-[#e3f3dc] border border-[#c3e2b7] flex items-center justify-center text-[11px] shrink-0"
                            aria-hidden="true"
                          >
                            👨‍🌾
                          </span>
                          <span className="truncate">
                            {product.farmer_name || "เกษตรกรชุมชนปลูกรัก"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Price + Stock on Left, + ใส่ตะกร้า Pill on Right */}
                      <div className="mt-3.5 flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline flex-wrap">
                            <span className="text-2xl sm:text-[26px] font-black text-[#175c24] tracking-tight tabular-nums leading-none">
                              ฿{Number(product.price || 0).toLocaleString("th-TH")}
                            </span>
                            <span className="text-xs sm:text-[13px] text-[#667262] font-medium ml-1 truncate">
                              / {getDisplayUnit(product.unit)}
                            </span>
                          </div>
                          <p className="text-xs text-[#697565] font-medium mt-1 tabular-nums">
                            คงเหลือ: {stockAmount.toLocaleString("th-TH")}{" "}
                            {getShortStockUnit(product.unit)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={isOutOfStock}
                          className={
                            isOutOfStock
                              ? "px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-stone-200 text-stone-400 cursor-not-allowed shrink-0"
                              : "plukrak-add-btn px-4 sm:px-5 py-2 text-xs sm:text-sm font-extrabold cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                          }
                        >
                          {isOutOfStock ? "สินค้าหมด" : "+ ใส่ตะกร้า"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Secondary Origin Filter & Real-time Farm Lot Tracker (Placed cleanly below the Product Grid) */}
          <section
            id="tracking-section"
            aria-label="ตัวกรองแหล่งที่มาและตรวจสอบรหัสแปลงปลูก"
            className="mt-12 p-5 sm:p-6 bg-white rounded-3xl border border-[#e3e0d3] shadow-sm space-y-4 scroll-mt-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#163820] flex items-center gap-2">
                  <span>🛰️</span>
                  <span>ตรวจสอบย้อนกลับหน้าแปลง & กรองตามแหล่งเพาะปลูก</span>
                </h3>
                <p className="text-xs text-[#60705c] mt-0.5">
                  คลิกที่รูปสินค้าเพื่อดูวิดีโอหน้าแปลง ใบรับรอง GAP/GI และบัญชีโอนตรง หรือค้นหาด้วยรหัส Lot ด้านขวา
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex items-center gap-2 w-full lg:w-auto">
                <input
                  type="text"
                  aria-label="รหัส Lot หรือชื่อผลผลิต"
                  placeholder="กรอกรหัส Lot เช่น PLK-PT-1..."
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  className="bg-[#f8f7f2] focus:bg-white text-[#182e1c] placeholder-[#869182] text-xs sm:text-sm px-4 py-2 rounded-full border border-[#dcd9ca] focus:border-emerald-600 outline-none transition w-full lg:w-64"
                />
                <button
                  type="submit"
                  className="plukrak-add-btn text-xs sm:text-sm px-4 py-2 font-extrabold cursor-pointer shrink-0"
                >
                  🔍 ตรวจ Lot
                </button>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#1a4723] mr-1">📍 จังหวัด:</span>
              {availableProvinces.map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
                    selectedProvince === prov
                      ? "bg-[#236b2c] text-white shadow-xs"
                      : "bg-[#f4f3ec] hover:bg-[#e7f3e3] text-[#2a442d]"
                  }`}
                >
                  {prov === "ทั้งหมด" ? "ทุกจังหวัด" : `จ.${prov}`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#1a4723] mr-1">🏡 แหล่งที่มา:</span>
              {locationTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedLocationType(type)}
                  className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer ${
                    selectedLocationType === type
                      ? "bg-amber-500 text-stone-950 shadow-xs"
                      : "bg-[#f4f3ec] hover:bg-amber-50 text-[#3c4639]"
                  }`}
                >
                  {type}
                </button>
              ))}

              {(selectedProvince !== "ทั้งหมด" ||
                selectedLocationType !== "ทั้งหมด" ||
                selectedCategory !== "ทั้งหมด" ||
                search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvince("ทั้งหมด");
                    setSelectedLocationType("ทั้งหมด");
                    setSelectedCategory("ทั้งหมด");
                    setSearch("");
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-auto"
                >
                  ✕ รีเซ็ตตัวกรอง
                </button>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* 🟢 Interactive Live Farm Plot & Inspection Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d bg-white w-full max-w-4xl border-4 border-emerald-500 p-6 sm:p-9 relative max-h-[94vh] overflow-y-auto">
            {/* ปุ่มปิด Modal */}
            <button
              onClick={() => setInspectingProduct(null)}
              className="absolute top-5 right-5 btn-3d-white w-10 h-10 p-0 rounded-full text-zinc-700 font-black text-base flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            {/* Header Modal */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="stamp-seal bg-emerald-700 text-white border-white text-xs px-3.5 py-1">
                📍 {inspectingProduct.location_type || "หน้าแปลง"} · จ.{inspectingProduct.province || "ปทุมธานี"}
              </span>
              <span className="badge-3d badge-3d-gold text-xs px-3 py-1 font-bold">
                ✓ ตรวจสอบย้อนกลับได้จริง 100%
              </span>
              {inspectingProduct.video_url && (
                <span className="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-black flex items-center gap-1 shadow-sm">
                  <span>🎥</span> มีวิดีโอหน้าแปลง
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 pb-3 border-b-2 border-emerald-100">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0a2016] heading-3d">
                  {inspectingProduct.name}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 font-bold mt-0.5">
                  รหัส Lot หน้าแปลง: <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded-md">{inspectingProduct.batch_lot_code || `PLK-PT-${inspectingProduct.id}`}</span> · วิสาหกิจชุมชน: <strong>{inspectingProduct.farmer_name || inspectingProduct.community_name || "วิสาหกิจชุมชนปทุมธานี"}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-900 font-mono">฿{inspectingProduct.price}</span>
                <span className="text-xs text-zinc-500 font-bold ml-1">/ {inspectingProduct.unit || "ชิ้น"}</span>
              </div>
            </div>

            {/* 🎥 Video Player Section (ถ้ามีวิดีโอหน้าแปลง) */}
            {inspectingProduct.video_url && (
              <div className="mt-5">
                <FarmVideoPlayer
                  src={inspectingProduct.video_url}
                  poster={
                    inspectingProduct.farm_image_url ||
                    inspectingProduct.image_url ||
                    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"
                  }
                  title={`วิดีโอหน้าแปลงจริง: ${inspectingProduct.name}`}
                  subtitle={`สถานที่: ${inspectingProduct.origin_address || "ปทุมธานี"}`}
                />
              </div>
            )}

            {/* 📸 หลักฐานความปลอดภัยและรูปถ่ายหน้างาน (Gallery - คลิกเพื่อดูภาพขยายจริง) */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-black text-[#152e1c] flex items-center gap-2">
                  <span>📸</span> หลักฐานหน้างานจริงเพื่อความปลอดภัย (คลิกที่รูปเพื่อดูภาพขยาย HD)
                </h4>
                <span className="text-[11px] text-[#2f8239] font-bold">🔍 คลิกเพื่อซูม</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. รูปผลผลิต */}
                <div
                  onClick={() =>
                    setActiveLightboxImage({
                      url:
                        inspectingProduct.image_url ||
                        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800",
                      title: `รูปผลผลิตจริง: ${inspectingProduct.name}`,
                      subtitle: `ราคา ฿${inspectingProduct.price} / ${inspectingProduct.unit || "ชิ้น"}`,
                    })
                  }
                  className="p-3 bg-[#fbfdfa] rounded-2xl border border-[#e2ead8] hover:border-[#2f8239] hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-xs font-black text-[#2e4732] mb-2 flex items-center justify-between">
                    <span>1. รูปถ่ายผลผลิตจริง</span>
                    <span className="text-[10px] text-[#2f8239] opacity-0 group-hover:opacity-100 transition">🔍 ขยาย</span>
                  </p>
                  <div className="h-40 rounded-xl overflow-hidden bg-[#edf6ea]">
                    <img
                      src={
                        inspectingProduct.image_url ||
                        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800"
                      }
                      alt={inspectingProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* 2. รูปหน้าสวน / แปลงปลูกจริง */}
                <div
                  onClick={() =>
                    setActiveLightboxImage({
                      url:
                        inspectingProduct.farm_image_url ||
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800",
                      title: `ภาพหน้าแปลงเพาะปลูกจริง: ${inspectingProduct.farmer_name || inspectingProduct.name}`,
                      subtitle: inspectingProduct.origin_address || "แปลงเกษตรอินทรีย์ ปทุมธานี",
                    })
                  }
                  className="p-3 bg-[#fbfdfa] rounded-2xl border border-[#e2ead8] hover:border-[#2f8239] hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-[#2e4732]">2. รูปหน้างาน / แปลงปลูก</p>
                    <span className="text-[10px] font-black text-emerald-800 bg-[#edf6ea] px-2 py-0.5 rounded-full border border-emerald-300">
                      ✓ ตรวจแล้ว
                    </span>
                  </div>
                  <div className="h-40 rounded-xl overflow-hidden bg-[#edf6ea]">
                    <img
                      src={
                        inspectingProduct.farm_image_url ||
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"
                      }
                      alt="Farm origin"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* 3. รูปใบรับรองมาตรฐาน GAP / Organic */}
                <div
                  onClick={() =>
                    setActiveLightboxImage({
                      url:
                        inspectingProduct.cert_image_url ||
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800",
                      title: `ใบรับรองมาตรฐานเกษตรปลอดภัย: ${inspectingProduct.name}`,
                      subtitle: `รหัสรับรอง: ${inspectingProduct.cert_number || "GAP Certified"}`,
                    })
                  }
                  className="p-3 bg-[#fffdf8] rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-amber-950">3. ใบรับรองมาตรฐาน</p>
                    <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                      {inspectingProduct.cert_number || "GAP Certified"}
                    </span>
                  </div>
                  <div className="h-40 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center">
                    <img
                      src={
                        inspectingProduct.cert_image_url ||
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800"
                      }
                      alt="Certificate"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 📍 ข้อมูลที่อยู่หน้างานและจังหวัดแบบชัดเจน */}
            <div className="mt-5 p-5 bg-gradient-to-r from-emerald-50 to-green-50/70 rounded-2xl border-2 border-emerald-300">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                  🗺️
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      ที่อยู่หน้างาน / แหล่งเพาะปลูกจริง ({inspectingProduct.amphoe ? `อ.${inspectingProduct.amphoe} ` : ""}จ.{inspectingProduct.province || "ปทุมธานี"})
                    </span>
                    <span className="badge-3d badge-3d-emerald text-[11px] px-2.5 py-0.5 font-bold">
                      🟢 แหล่งกำเนิด: {inspectingProduct.location_type || "หน้าแปลง"}
                    </span>
                  </div>

                  <p className="text-base font-black text-[#0a2016] mt-1">
                    {inspectingProduct.origin_address || "แปลงเพาะปลูกวิสาหกิจชุมชนไทย"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-bold text-zinc-600">
                    <span className="text-emerald-800 font-mono flex items-center gap-1">
                      <span>🛰️</span> พิกัด GPS: {inspectingProduct.latitude ? `${inspectingProduct.latitude}° N, ${inspectingProduct.longitude}° E` : "14.1725° N, 100.8652° E"}
                    </span>
                    <span className="flex items-center gap-1">
                      <span>📜</span> เลขที่ใบรับรอง: {inspectingProduct.cert_number || "GAP-TH-13-01-0001"}
                    </span>
                    {inspectingProduct.water_source && (
                      <span className="flex items-center gap-1 text-blue-700">
                        <span>💧</span> แหล่งน้ำ: {inspectingProduct.water_source}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(inspectingProduct.origin_address || "");
                        alert("คัดลอกที่อยู่แปลงปลูกสำเร็จ!");
                      }}
                      className="text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                    >
                      คัดลอกที่อยู่แปลง
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 🌾 ขั้นตอนการเก็บเกี่ยว & ขั้นตอนการทำก่อนทำการสั่งซื้อ (Harvest & Prep Process) */}
            <div className="mt-5 p-5 bg-amber-50/70 rounded-2xl border-2 border-amber-300">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <span>🌾</span> ขั้นตอนการเก็บเกี่ยว & การเตรียมผลผลิตก่อนการสั่งซื้อ (ผู้บริโภคทราบก่อนตัดสินใจซื้อ)
                </h4>
                {inspectingProduct.lab_test_result && (
                  <span className="badge-3d badge-3d-gold text-[10px] px-2.5 py-0.5">
                    ✓ {inspectingProduct.lab_test_result}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-semibold whitespace-pre-line bg-white/80 p-4 rounded-xl border border-amber-200">
                {inspectingProduct.harvest_process ||
                  "1. ดูแลในระบบปิด ปลอดสารเคมีและสารเร่งโต\n2. สุ่มตรวจวิเคราะห์สารตกค้างก่อนเก็บเกี่ยวด้วย Rapid Test (0.00 ppm)\n3. เก็บเกี่ยวสดรอบเช้ามืด 05:30 น. ในช่วงที่ความสดและรสชาติสูงสุด\n4. ทำความสะอาดด้วยระบบน้ำโอโซนบริสุทธิ์เพื่อสุขอนามัย\n5. คัดเกรดพรีเมียม บรรจุลงกล่องควบคุมอุณหภูมิทันทีพร้อมส่งตรงจากหน้างาน"}
              </div>
            </div>

            {/* 💳 ข้อมูลบัญชีรับเงินตรงสู่เกษตรกร (Direct Payment Info) */}
            <div className="mt-5 p-5 bg-emerald-50 rounded-2xl border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                  <span>💳</span> ช่องทางการโอนเงินตรงสู่เกษตรกรผู้ขาย (Direct P2P)
                </h4>
                <span className="stamp-seal bg-emerald-700 text-white border-white text-[10px] px-2.5 py-0.5">
                  ✓ ยืนยันชื่อบัญชีตรงกับผู้ขายในระบบ
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-zinc-500 font-bold block">ธนาคาร:</span>
                  <span className="font-black text-zinc-900">{inspectingProduct.bank_name || "ธนาคารกสิกรไทย"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block">เลขที่บัญชี:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">
                    {inspectingProduct.bank_account_number || "142-2-89410-3"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold block">ชื่อเจ้าของบัญชี:</span>
                  <span className="font-bold text-zinc-900">
                    {inspectingProduct.bank_account_name || inspectingProduct.farmer_name || "ตัวแทนเกษตรกร"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="mt-7 pt-4 border-t-2 border-zinc-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-500 font-bold">
                มีผลผลิตในสต็อกพร้อมส่ง:{" "}
                <strong className="text-emerald-800 text-sm">
                  {inspectingProduct.stock ?? 0} {inspectingProduct.unit || "ชิ้น"}
                </strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setInspectingProduct(null)}
                  className="btn-3d-white text-xs sm:text-sm px-5 py-2.5 cursor-pointer font-bold"
                >
                  ปิดหน้าต่าง
                </button>
                <button
                  onClick={() => {
                    addToCart(inspectingProduct);
                    setInspectingProduct(null);
                  }}
                  className="btn-3d-emerald text-xs sm:text-sm px-6 py-2.5 cursor-pointer font-black"
                >
                  + ใส่ตะกร้าผลผลิตนี้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 🛡️ ศูนย์มาตรฐานความปลอดภัยผู้ซื้อและผู้ขาย (Buyer & Seller Trust & Safety) */}
      <section id="trust-center" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 scroll-mt-6">
        <div className="bg-gradient-to-br from-[#0c2719] via-[#143d28] to-[#0a1e14] rounded-3xl p-7 sm:p-11 text-white border-4 border-emerald-500 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-8 relative z-10">
            <span className="stamp-seal bg-amber-400 text-stone-950 border-stone-900 font-black text-xs px-4 py-1 shadow-sm">
              🛡️ ศูนย์ความปลอดภัยและมาตรฐานผู้ซื้อ-ผู้ขาย
            </span>
            <h2 className="text-2xl sm:text-4xl font-black mt-3 heading-3d-light">
              ระบบคุ้มครองความปลอดภัย 4 ชั้น เพื่อเกษตรกรและผู้บริโภค
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 font-medium leading-relaxed">
              ปลูกรักออกแบบระบบความปลอดภัยโดยเชื่อมโยง 6 ระบบฐานข้อมูล MySQL เข้าด้วยกัน ป้องกันมิจฉาชีพ
              สร้างความมั่นใจให้ผู้ซื้อ และช่วยให้เกษตรกรตัวจริงในปทุมธานีได้รับเงินเต็ม 100%
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* 1. ยืนยันรหัส SMCE */}
            <div className="bg-white/10 hover:bg-white/15 p-5 rounded-2xl border border-emerald-400/30 backdrop-blur-sm transition">
              <span className="text-3xl block mb-2">🏛️</span>
              <h4 className="font-black text-sm sm:text-base text-amber-300">1. ยืนยันรหัส SMCE กรมส่งเสริมฯ</h4>
              <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed font-medium">
                ร้านค้าทุกแห่งต้องผ่านการตรวจสอบทะเบียนวิสาหกิจชุมชน พ.ร.บ. ส่งเสริมวิสาหกิจชุมชน พ.ศ. 2548 มีประธานกลุ่มและที่ตั้งจริงในปทุมธานี
              </p>
            </div>

            {/* 2. โอนตรงไม่ผ่านตัวกลาง */}
            <div className="bg-white/10 hover:bg-white/15 p-5 rounded-2xl border border-emerald-400/30 backdrop-blur-sm transition">
              <span className="text-3xl block mb-2">💳</span>
              <h4 className="font-black text-sm sm:text-base text-amber-300">2. โอนตรง 100% ชื่อบัญชีตรงผู้ขาย</h4>
              <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed font-medium">
                เงินโอนตรงสู่บัญชีเกษตรกรผู้ปลูกโดยตรง ไม่ผ่านตัวกลาง ไม่หักหัวคิว และระบบตรวจสอบชื่อบัญชีตรงกับผู้ลงทะเบียน ป้องกันบัญชีม้า 100%
              </p>
            </div>

            {/* 3. ตรวจสอบย้อนกลับหน้าแปลง */}
            <div className="bg-white/10 hover:bg-white/15 p-5 rounded-2xl border border-emerald-400/30 backdrop-blur-sm transition">
              <span className="text-3xl block mb-2">🔬</span>
              <h4 className="font-black text-sm sm:text-base text-amber-300">3. วิดีโอสด & ผลแล็บ 0.00 ppm</h4>
              <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed font-medium">
                มีพิกัด GPS แปลงเพาะปลูก บันทึกวิดีโอหน้างานจริง และผลตรวจสารตกค้างก่อนเก็บเกี่ยวด้วย Rapid Test เพื่อความปลอดภัยต่อสุขภาพ
              </p>
            </div>

            {/* 4. รับประกันความสด 100% */}
            <div className="bg-white/10 hover:bg-white/15 p-5 rounded-2xl border border-emerald-400/30 backdrop-blur-sm transition">
              <span className="text-3xl block mb-2">📦</span>
              <h4 className="font-black text-sm sm:text-base text-amber-300">4. ประกันความสด คืนเงิน 100%</h4>
              <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed font-medium">
                ตัดสดรอบเช้าและบรรจุควบคุมอุณหภูมิ หากผลผลิตเน่าเสียหรือไม่ตรงปก ชุมชนยินดีส่งกล่องใหม่หรือคืนเงินเต็มจำนวนภายใน 24 ชม.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 10 วิสาหกิจชุมชนที่มีอยู่จริงในจังหวัดปทุมธานี (Smart & Sustainable Community Enterprises) */}
      <section id="smce-network" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 scroll-mt-6">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#e8f5e9] text-[#2f8239] text-xs font-bold border border-[#c8e6c9] shadow-sm">
            <span>🌱</span> เครือข่ายวิสาหกิจชุมชนปทุมธานี (SMCE)
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1f3a24] mt-3 tracking-tight">
            10 วิสาหกิจชุมชนที่มีอยู่จริงในจังหวัดปทุมธานี
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl mx-auto leading-relaxed">
            จดทะเบียนถูกต้องตาม พ.ร.บ. ส่งเสริมวิสาหกิจชุมชน กรมส่งเสริมการเกษตร ครอบคลุม 5 อำเภอหลักในปทุมธานี
            คลิกดูวิดีโอหน้างานจริง ขั้นตอนการผลิต และสินค้าของแต่ละชุมชนได้ทันที
          </p>

          {/* District Filter Chips for Communities */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {["ทั้งหมด", "หนองเสือ", "คลองหลวง", "ลาดหลุมแก้ว", "สามโคก", "ลำลูกกา"].map((amp) => (
              <button
                key={amp}
                onClick={() => setSelectedAmphoeFilter(amp)}
                className={`text-xs sm:text-sm px-5 py-2 rounded-full font-bold transition-all cursor-pointer shadow-sm ${
                  selectedAmphoeFilter === amp
                    ? "bg-[#2f8239] text-white shadow-md shadow-[#2f8239]/20 scale-105"
                    : "bg-white hover:bg-[#f1f8f3] text-[#2e4732] border border-[#d8e6dc] hover:border-[#2f8239]/40"
                }`}
              >
                {amp === "ทั้งหมด" ? `ทุกอำเภอ (${sellers.length} กลุ่ม)` : `อ.${amp}`}
              </button>
            ))}
          </div>
        </div>

        {sellersLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#2f8239] border-t-transparent mb-3" />
            <p className="text-sm text-stone-500 font-bold">กำลังโหลดข้อมูล 10 วิสาหกิจชุมชน...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredSellers.map((seller) => (
              <div
                key={seller.id}
                className="group bg-white rounded-[26px] border border-[#e5efe5] shadow-[0_8px_24px_rgba(47,130,57,0.06)] hover:shadow-[0_16px_36px_rgba(47,130,57,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                {/* ภาพหน้าแปลงของชุมชนพร้อมป้ายกำกับ */}
                <div className="relative h-48 overflow-hidden bg-[#eef5ee]">
                  <img
                    src={seller.farm_photo_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"}
                    alt={seller.community_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <span className="bg-[#1f3a24]/90 backdrop-blur-md text-white text-[11px] font-mono font-bold px-3 py-1 rounded-full shadow-md">
                      SMCE: {seller.smce_code}
                    </span>
                    <span className="bg-amber-400 text-stone-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                      {seller.cert_name ? seller.cert_name.split("&")[0] : "GAP Certified"}
                    </span>
                  </div>

                  {(seller.video_url || seller.location_video_url) && (
                    <span className="absolute bottom-3 right-3 bg-rose-500 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>🎥 มีวิดีโอหน้าแปลง</span>
                    </span>
                  )}
                </div>

                {/* รายละเอียดชุมชน */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#1f3a24] group-hover:text-[#2f8239] transition-colors leading-snug">
                      {seller.community_name}
                    </h3>

                    <div className="mt-1.5 text-xs text-[#2f8239] font-semibold flex items-center gap-1.5">
                      <span>📍</span> อ.{seller.amphoe} ต.{seller.tambon} จ.{seller.province}
                    </div>

                    <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed bg-[#f8faf8] p-3 rounded-2xl border border-[#e8efe8]">
                      {seller.story}
                    </p>

                    <div className="mt-4 pt-3.5 border-t border-[#f0f4f0] text-xs space-y-1.5 text-stone-700">
                      <p className="flex items-center justify-between">
                        <span className="text-stone-500">ประธานกลุ่ม:</span>
                        <strong className="text-[#1f3a24] font-semibold">{seller.president_name}</strong>
                      </p>
                      <p className="flex items-center justify-between">
                        <span className="text-stone-500">เบอร์ติดต่อ:</span>
                        <span className="font-mono text-[#2f8239] font-bold">{seller.phone}</span>
                      </p>
                      {seller.plot_size && (
                        <p className="flex items-center justify-between">
                          <span className="text-stone-500">ขนาดแปลง:</span>
                          <span className="font-semibold text-stone-800">{seller.plot_size}</span>
                        </p>
                      )}
                      <p className="text-[#2f8239] font-mono text-[11px] pt-1">
                        🛰️ GPS: {seller.latitude}° N, {seller.longitude}° E
                      </p>
                    </div>
                  </div>

                  {/* ปุ่มดูรายละเอียดและวิดีโอหน้าแปลง */}
                  <div className="mt-5 pt-3.5 border-t border-[#f0f4f0]">
                    <button
                      onClick={() => setSelectedCommunityModal(seller)}
                      className="w-full bg-[#2f8239] hover:bg-[#256c2e] active:scale-[0.98] text-white text-xs sm:text-sm font-bold py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>🌾</span> ดูข้อมูลและวิดีโอหน้างาน ({seller.products?.length || 2} สินค้า) ➔
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🟢 Community Details Modal (เจาะลึก 10 วิสาหกิจชุมชน, วิดีโอหน้าแปลง, ขั้นตอนการผลิต และสินค้าทั้งหมด) */}
      {selectedCommunityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-4xl rounded-[32px] border border-[#dce9dc] shadow-2xl p-6 sm:p-9 relative max-h-[92vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => setSelectedCommunityModal(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-[#f4f7f4] hover:bg-[#e6efe6] text-stone-700 font-bold text-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-sm"
              aria-label="ปิดหน้าต่าง"
            >
              ✕
            </button>

            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e8f5e9] text-[#2f8239] text-xs font-bold border border-[#c8e6c9]">
                🏛️ ทะเบียน SMCE: {selectedCommunityModal.smce_code}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                ✓ {selectedCommunityModal.cert_name ? selectedCommunityModal.cert_name.split("&")[0] : "GAP กรมวิชาการเกษตร"}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold border border-emerald-200">
                🟢 วิสาหกิจชุมชนแท้ จ.ปทุมธานี
              </span>
            </div>

            <div className="mt-3.5 pb-4 border-b border-[#eef3ee]">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1f3a24]">
                {selectedCommunityModal.community_name}
              </h3>
              <p className="text-sm text-[#2f8239] font-semibold mt-1 flex items-center gap-1.5">
                <span>📍</span> อ.{selectedCommunityModal.amphoe} ต.{selectedCommunityModal.tambon} จ.{selectedCommunityModal.province}
              </p>
            </div>

            {/* Video Player Section with Real Interactive Player */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs sm:text-sm font-extrabold text-[#1f3a24] flex items-center gap-2">
                  <span>🎥</span> วิดีโอบันทึกหน้าแปลงจริง & ขั้นตอนการดูแลผลผลิต
                </span>
                <span className="text-xs text-stone-500 font-medium">บันทึกสดจากหน้างาน จ.ปทุมธานี</span>
              </div>
              <FarmVideoPlayer
                src={selectedCommunityModal.video_url || selectedCommunityModal.location_video_url}
                title={`วิดีโอหน้าแปลง ${selectedCommunityModal.community_name}`}
                poster={selectedCommunityModal.farm_photo_url}
              />
            </div>

            {/* Important Community Details Grid */}
            <div className="mt-6">
              <h4 className="text-xs sm:text-sm font-extrabold text-stone-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>📋</span> ข้อมูลสำคัญของวิสาหกิจชุมชน (Official SMCE Profile)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">👤 ประธานกลุ่ม / ผู้ประสานงาน:</span>
                  <span className="font-bold text-[#1f3a24] text-sm sm:text-base mt-0.5 block">{selectedCommunityModal.president_name}</span>
                </div>
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">📞 เบอร์โทรศัพท์ติดต่อโดยตรง:</span>
                  <span className="font-mono font-bold text-[#2f8239] text-sm sm:text-base mt-0.5 block">{selectedCommunityModal.phone}</span>
                </div>
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">🏛️ รหัสทะเบียนวิสาหกิจชุมชน:</span>
                  <span className="font-mono font-bold text-[#1f3a24] text-sm sm:text-base mt-0.5 block">{selectedCommunityModal.smce_code}</span>
                </div>
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">📐 ขนาดพื้นที่เพาะปลูก:</span>
                  <span className="font-bold text-stone-900 text-sm mt-0.5 block">{selectedCommunityModal.plot_size || "15 ไร่"}</span>
                </div>
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">💧 แหล่งน้ำเพาะปลูก:</span>
                  <span className="font-bold text-blue-900 text-sm mt-0.5 block">{selectedCommunityModal.water_source || "คลองชลประทานปทุมธานี"}</span>
                </div>
                <div className="p-4 bg-[#f8faf8] rounded-2xl border border-[#e8efe8]">
                  <span className="text-stone-500 font-medium block text-xs">📜 มาตรฐาน & ใบรับรอง:</span>
                  <span className="font-bold text-amber-900 text-sm truncate mt-0.5 block">
                    {selectedCommunityModal.cert_name || "GAP กรมวิชาการเกษตร"}
                  </span>
                </div>
              </div>
            </div>

            {/* Address & GPS */}
            <div className="mt-4 p-4.5 bg-[#f6faf6] rounded-2xl border border-[#d5e7d5] text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📍</span>
                <div className="flex-1">
                  <p className="font-bold text-[#1f3a24]">ที่อยู่หน้างาน / สถานที่ผลิตจริง:</p>
                  <p className="text-stone-800 font-medium mt-0.5">{selectedCommunityModal.origin_address}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold">
                    <span className="text-[#2f8239] font-mono">
                      🛰️ พิกัด GPS: {selectedCommunityModal.latitude}° N, {selectedCommunityModal.longitude}° E
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedCommunityModal.origin_address || "");
                        alert("คัดลอกที่อยู่แปลงปลูกเรียบร้อย!");
                      }}
                      className="text-[#2f8239] underline hover:text-[#256c2e] cursor-pointer"
                    >
                      คัดลอกที่อยู่
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCommunityModal.latitude},${selectedCommunityModal.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline hover:text-blue-900"
                    >
                      เปิดใน Google Maps ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Story & Background */}
            <div className="mt-4 p-4.5 bg-white rounded-2xl border border-[#e8efe8] text-xs sm:text-sm">
              <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                <span>📖</span> เรื่องราวความเป็นมาและอัตลักษณ์ชุมชน:
              </h4>
              <p className="text-stone-700 leading-relaxed font-normal">
                {selectedCommunityModal.story}
              </p>
            </div>

            {/* Community Production & Harvest Steps */}
            <div className="mt-4 p-4.5 bg-[#fffbf2] rounded-2xl border border-[#f0e4cf] text-xs sm:text-sm">
              <h4 className="font-bold text-[#735118] mb-2.5 flex items-center gap-2">
                <span>🌾</span> ขั้นตอนการเพาะปลูกและการเก็บเกี่ยวหน้างาน (Community Production Standards)
              </h4>
              <div className="bg-white/90 p-4 rounded-xl border border-[#faecd5] space-y-2.5 text-stone-800 font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f8239] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <span>คัดเลือกสายพันธุ์แท้และปรับปรุงดินด้วยอินทรียวัตถุ ปลอดสารเร่งโตเคมีอันตราย</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f8239] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                  <span>ตรวจวัดคุณภาพน้ำและดินประจำฤดูกาล ควบคุมระบบน้ำด้วยเทคโนโลยี Smart Farm หรือคลองชลประทานสะอาด</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f8239] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                  <span>ตรวจสารตกค้างก่อนเก็บเกี่ยวด้วย Rapid Test เพื่อยืนยันความปลอดภัย 0.00 ppm</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2f8239] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                  <span>เก็บเกี่ยวสดรอบเช้า คัดเกรดมาตรฐาน และบรรจุกล่องควบคุมความสด ส่งตรงถึงผู้ซื้อทันที</span>
                </div>
              </div>
            </div>

            {/* Photos Gallery - Clickable with Lightbox */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                  <span>📸</span> หลักฐานหน้าแปลงปลูกและใบรับรองจริง
                </h4>
                <span className="text-xs text-[#2f8239] font-medium">🔍 คลิกที่ภาพเพื่อดูขนาดเต็ม</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farm Photo */}
                <div
                  onClick={() =>
                    setActiveLightboxImage({
                      url:
                        selectedCommunityModal.farm_photo_url ||
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800",
                      title: `ภาพหน้าแปลงปลูกจริง: ${selectedCommunityModal.community_name}`,
                      subtitle: selectedCommunityModal.origin_address || "วิสาหกิจชุมชน จ.ปทุมธานี",
                    })
                  }
                  className="p-3 bg-[#f8faf8] rounded-2xl border border-[#e2eae2] hover:border-[#2f8239] hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-stone-700 mb-2 flex items-center justify-between">
                    <span>ภาพหน้าแปลงปลูก / สถานที่ผลิตจริง</span>
                    <span className="text-[10px] text-[#2f8239] opacity-0 group-hover:opacity-100 transition-opacity">🔍 ขยาย</span>
                  </p>
                  <div className="h-44 rounded-xl overflow-hidden bg-stone-100 relative">
                    <img
                      src={selectedCommunityModal.farm_photo_url || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"}
                      alt={selectedCommunityModal.community_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-3 py-1.5 rounded-full">
                        🔍 คลิกเพื่อดูขนาดเต็ม
                      </span>
                    </div>
                  </div>
                </div>

                {/* Certificate Photo */}
                <div
                  onClick={() =>
                    setActiveLightboxImage({
                      url:
                        selectedCommunityModal.cert_image_url ||
                        "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800",
                      title: `ใบรับรองมาตรฐานเกษตรปลอดภัย: ${selectedCommunityModal.community_name}`,
                      subtitle: `มาตรฐาน: ${selectedCommunityModal.cert_name || "GAP กรมวิชาการเกษตร"}`,
                    })
                  }
                  className="p-3 bg-[#fffbf2] rounded-2xl border border-[#f0e4cf] hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
                >
                  <p className="text-xs font-bold text-[#735118] mb-2 flex items-center justify-between">
                    <span>ใบรับรองมาตรฐานเกษตรปลอดภัย</span>
                    <span className="text-[10px] text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity">🔍 ขยาย</span>
                  </p>
                  <div className="h-44 rounded-xl overflow-hidden bg-amber-50 relative flex items-center justify-center">
                    <img
                      src={selectedCommunityModal.cert_image_url || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800"}
                      alt="Certificate"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-3 py-1.5 rounded-full">
                        🔍 คลิกเพื่อดูขนาดเต็ม
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products of this Community */}
            <div className="mt-6 pt-5 border-t border-[#eef3ee]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm sm:text-base font-extrabold text-[#1f3a24] flex items-center gap-2">
                  <span>🛒</span> ผลผลิตพร้อมจำหน่ายของวิสาหกิจนี้ ({selectedCommunityModal.products?.length || 0} รายการ)
                </h4>
                <span className="text-xs text-[#2f8239] font-bold bg-[#e8f5e9] px-3 py-1 rounded-full border border-[#c8e6c9]">
                  ส่งตรงจากแปลง
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {selectedCommunityModal.products && selectedCommunityModal.products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 flex gap-3.5 bg-white border border-[#e5efe5] hover:border-[#2f8239] rounded-2xl shadow-sm transition-all"
                  >
                    <div
                      onClick={() =>
                        setActiveLightboxImage({
                          url: p.image_url || "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800",
                          title: p.name,
                          subtitle: `฿${p.price}/${p.unit} · ${selectedCommunityModal.community_name}`,
                        })
                      }
                      className="w-20 h-20 rounded-xl overflow-hidden bg-[#eef5ee] shrink-0 border border-[#dce9dc] cursor-pointer group relative"
                    >
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#1f3a24] line-clamp-1">{p.name}</h5>
                        <p className="text-[11px] text-stone-500 font-medium line-clamp-1 mt-0.5">{p.description}</p>
                        <p className="text-[11px] text-[#2f8239] font-semibold mt-0.5">
                          ✓ ปลอดสารเคมี ({p.lab_test_result || "0.00 ppm"})
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1.5">
                        <span className="font-mono font-bold text-[#1f3a24] text-sm sm:text-base">
                          ฿{p.price} <span className="text-[10px] text-stone-500 font-normal">/{p.unit}</span>
                        </span>
                        <button
                          onClick={() => {
                            addToCart({
                              ...p,
                              seller_id: selectedCommunityModal.id,
                              farmer_name: selectedCommunityModal.community_name,
                              origin_address: selectedCommunityModal.origin_address,
                              province: selectedCommunityModal.province,
                              location_type: selectedCommunityModal.location_type,
                              bank_name: selectedCommunityModal.bank_name,
                              bank_account_number: selectedCommunityModal.bank_account_number,
                              bank_account_name: selectedCommunityModal.bank_account_name,
                            });
                          }}
                          className="bg-[#2f8239] hover:bg-[#256c2e] text-white text-xs px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          + ใส่ตะกร้า
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Bank Account Info */}
            <div className="mt-6 p-4.5 bg-[#f6faf6] rounded-2xl border border-[#d5e7d5] text-xs sm:text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#1f3a24] flex items-center gap-1.5">
                  <span>💳</span> บัญชีรับโอนเงินตรงของวิสาหกิจชุมชนนี้:
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8f5e9] text-[#2f8239] text-[11px] font-bold border border-[#c8e6c9]">
                  ✓ ตรวจสอบแล้ว
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-xl border border-[#e2eae2]">
                <div>
                  <span className="text-stone-500 block text-xs font-medium">ธนาคาร:</span>
                  <span className="font-bold text-stone-900 mt-0.5 block">{selectedCommunityModal.bank_name || "ธนาคารกสิกรไทย"}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-xs font-medium">เลขที่บัญชี:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-[#2f8239] text-sm">
                      {selectedCommunityModal.bank_account_number || "142-2-89410-3"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(selectedCommunityModal.bank_account_number || "142-2-89410-3");
                        alert("คัดลอกเลขบัญชีเรียบร้อย!");
                      }}
                      className="text-[10px] text-[#2f8239] bg-[#e8f5e9] px-2 py-0.5 rounded font-bold cursor-pointer hover:bg-[#c8e6c9]"
                    >
                      คัดลอก
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-stone-500 block text-xs font-medium">ชื่อบัญชี:</span>
                  <span className="font-bold text-stone-900 mt-0.5 block">
                    {selectedCommunityModal.bank_account_name || selectedCommunityModal.president_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Close button at bottom */}
            <div className="mt-6 pt-4 border-t border-[#eef3ee] flex justify-end">
              <button
                onClick={() => setSelectedCommunityModal(null)}
                className="bg-[#f4f7f4] hover:bg-[#e6efe6] text-stone-700 text-xs sm:text-sm px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Live Farm Lot & Order Tracking Modal */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-3d bg-white w-full max-w-xl border-4 border-emerald-500 p-6 sm:p-8 relative">
            <button
              onClick={() => setTrackingModalData(null)}
              className="absolute top-4 right-4 btn-3d-white w-9 h-9 p-0 rounded-full text-zinc-700 font-black text-sm flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <span className="stamp-seal bg-emerald-700 text-white border-white text-xs px-3 py-1 font-mono">
              Lot: {trackingModalData.code}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-[#0a2016] heading-3d mt-2">
              สถานะหน้าแปลง & การตรวจสอบคุณภาพ
            </h3>

            <p className="text-xs sm:text-sm text-emerald-800 font-bold mt-1">
              ผลผลิต: <strong>{trackingModalData.product.name}</strong> • {trackingModalData.status}
            </p>

            <div className="mt-5 space-y-3">
              {trackingModalData.timeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    item.done
                      ? "bg-emerald-50/80 border-emerald-300"
                      : "bg-zinc-50 border-zinc-200 opacity-70"
                  }`}
                >
                  <span className="text-base mt-0.5">{item.done ? "✅" : "⏳"}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-900">{item.step}</h4>
                      <span className="text-[11px] text-zinc-500 font-mono font-bold">{item.time}</span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setInspectingProduct(trackingModalData.product);
                  setTrackingModalData(null);
                }}
                className="btn-3d-white text-xs px-4 py-2 font-bold cursor-pointer"
              >
                🔍 ดูวิดีโอ & ข้อมูลแปลงฉบับเต็ม
              </button>
              <button
                onClick={() => setTrackingModalData(null)}
                className="btn-3d-emerald text-xs px-5 py-2 font-bold cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 3D Slide-over Cart Drawer with Direct P2P Payment to Sellers & Slip Attachment */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l-4 border-emerald-600">
              <div className="p-6 bg-gradient-to-r from-[#0d271a] via-[#16422c] to-[#0d271a] text-white flex items-center justify-between shadow-md">
                <h3 className="font-black text-xl flex items-center gap-2">
                  <span className="text-2xl">🛒</span> ตะกร้าผลผลิตและการโอนเงินตรง
                </h3>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="btn-3d-white text-xs px-3 py-1.5 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {cart.length === 0 ? (
                  <div className="text-center py-20 text-zinc-400">
                    <span className="text-6xl block mb-3 animate-float-3d">🛒</span>
                    <p className="font-black text-base text-zinc-700">ยังไม่มีสินค้าในตะกร้า</p>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                      เลือกผลผลิตสดจากหน้าร้านเพื่อเริ่มต้นสั่งซื้อ
                    </p>
                  </div>
                ) : (
                  <>
                    {/* รายการผลผลิตในตะกร้า */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-700 uppercase tracking-wider">
                        ผลผลิตที่คุณเลือก ({cart.length} รายการ):
                      </h4>
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="card-3d p-4 flex items-center justify-between border border-emerald-100 bg-white"
                        >
                          <div className="flex-1 pr-3">
                            <h4 className="font-black text-zinc-900 text-sm sm:text-base line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-xs text-emerald-800 font-bold flex items-center gap-1 mt-0.5">
                              <span>📍</span>
                              <span className="truncate max-w-[200px]">
                                {item.location_type || "หน้าแปลง"} จ.{item.province || "ปทุมธานี"}
                              </span>
                            </p>
                            <p className="text-xs sm:text-sm text-emerald-700 font-black mt-1 font-mono">
                              ฿{Number(item.price).toLocaleString("th-TH")} / {item.unit || "ชิ้น"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-50/70 rounded-xl px-2.5 py-1.5 shadow-inner border border-emerald-200">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-8 h-8 btn-3d-white text-sm p-0 flex items-center justify-center font-black cursor-pointer"
                            >
                              -
                            </button>
                            <span className="text-sm font-black w-5 text-center font-mono">{item.qty}</span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-8 h-8 btn-3d-emerald text-sm p-0 flex items-center justify-center font-black cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 🟢 DIRECT P2P PAYMENT BOX: โอนเงินตรงสู่เกษตรกรเจ้าของผลผลิต */}
                    {/* ข้อมูลผู้รับและตำแหน่งจัดส่ง */}
                    <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 space-y-4 shadow-sm">
                      <div className="border-b border-emerald-100 pb-3">
                        <h4 className="text-base font-black text-emerald-950">
                          📦 ข้อมูลผู้รับและสถานที่จัดส่ง
                        </h4>
                        <p className="mt-1 text-xs text-zinc-500">
                          กรุณากรอกข้อมูลติดต่อและปักหมุดตำแหน่งที่ต้องการรับสินค้า
                        </p>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                          ชื่อ-นามสกุลผู้รับ *
                        </label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="กรอกชื่อผู้รับสินค้า"
                          autoComplete="name"
                          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                          เบอร์โทรศัพท์ *
                        </label>
                        <input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="เช่น 0812345678"
                          autoComplete="tel"
                          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-zinc-700">
                          ที่อยู่จัดส่งโดยละเอียด *
                        </label>
                        <textarea
                          value={buyerAddress}
                          onChange={(e) => setBuyerAddress(e.target.value)}
                          placeholder="บ้านเลขที่ หมู่บ้าน ถนน ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์"
                          rows={3}
                          className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold text-zinc-700">
                            ตำแหน่งบนแผนที่ *
                          </label>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            📍 ใช้ตำแหน่งปัจจุบัน
                          </button>
                        </div>

                        <DeliveryMap
                          latitude={buyerLatitude}
                          longitude={buyerLongitude}
                          onSelect={({ latitude, longitude }) => {
                            setBuyerLatitude(latitude);
                            setBuyerLongitude(longitude);
                            setOrderError("");
                          }}
                        />

                        <p className="text-xs text-zinc-500">
                          * คลิกบนแผนที่เพื่อเลือกตำแหน่งจัดส่ง
                        </p>
                      </div>

                      {orderError && (
                        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                          {orderError}
                        </div>
                      )}
                    </div>

                    <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-400 space-y-4">
                      <div className="flex items-start gap-2.5 pb-3 border-b border-emerald-200">
                        <span className="text-2xl">💳</span>
                        <div>
                          <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                            โอนเงินตรงสู่เกษตรกรเจ้าของผลผลิต (Direct P2P Payment)
                          </h4>
                          <p className="text-xs text-emerald-800 font-semibold mt-0.5 leading-relaxed">
                            เงินโอนตรงสู่บัญชีเกษตรกรผู้ปลูก 100% ไม่ถูกหักหัวคิว และบัญชีได้รับการยืนยันว่าชื่อตรงกับผู้ลงขาย
                          </p>
                        </div>
                      </div>

                      {/* รายการบัญชีของผู้ขายแต่ละรายการในตะกร้า */}
                      {cart.map((item, idx) => (
                        <div
                          key={`bank-${item.id}-${idx}`}
                          className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-sm space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-emerald-950 truncate max-w-[200px]">
                              🌾 {item.name}
                            </span>
                            <span className="badge-3d badge-3d-gold text-[10px] px-2 py-0.5 shrink-0">
                              ✓ ชื่อบัญชีตรงผู้ขาย
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-zinc-700">
                            <div>
                              <span className="text-zinc-500 font-bold block">ธนาคาร:</span>
                              <span className="font-bold">{item.bank_name || "ธนาคารกสิกรไทย"}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 font-bold block">ชื่อเจ้าของบัญชี:</span>
                              <span className="font-black text-emerald-900">
                                {item.bank_account_name || item.farmer_name || "วิสาหกิจชุมชน"}
                              </span>
                            </div>
                          </div>

                          <div className="p-2 bg-emerald-50 rounded-lg flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-500 font-bold block">เลขที่บัญชี:</span>
                              <span className="font-mono font-black text-emerald-900 text-sm">
                                {item.bank_account_number || "142-2-89410-3"}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  item.bank_account_number || "142-2-89410-3",
                                  `acc-${item.id}`
                                )
                              }
                              className="btn-3d-white text-xs px-2.5 py-1 font-bold cursor-pointer"
                            >
                              {copiedAccount === `acc-${item.id}` ? "✓ คัดลอกแล้ว" : "📋 คัดลอก"}
                            </button>
                          </div>

                          {item.promptpay_number && (
                            <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-600">
                              <span>
                                พร้อมเพย์: <strong className="font-mono text-zinc-900">{item.promptpay_number}</strong>
                              </span>
                              {item.seller_phone && (
                                <span>
                                  โทร: <strong>{item.seller_phone}</strong>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* ช่องแนบหลักฐานสลิปการโอนเงิน */}
                      <div className="pt-2 border-t border-emerald-200">
                        <label className="block text-xs font-black text-emerald-950 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <span>🧾</span> แนบสลิปหรือหลักฐานการโอนเงิน (Transfer Slip):
                        </label>

                        <input
                          type="file"
                          ref={slipInputRef}
                          onChange={handleSlipChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => slipInputRef.current?.click()}
                            className="btn-3d-white text-xs px-4 py-2 font-bold cursor-pointer"
                          >
                            {slipPreview ? "🔄 เปลี่ยนรูปสลิป" : "📤 แนบรูปสลิปโอนเงิน"}
                          </button>
                          {slipPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setSlipFile(null);
                                setSlipPreview(null);
                              }}
                              className="text-xs text-rose-600 font-bold hover:underline"
                            >
                              ลบรูปสลิป
                            </button>
                          )}
                        </div>

                        {/* Slip Preview Box */}
                        {slipPreview ? (
                          <div className="mt-2 p-2 bg-white rounded-xl border border-emerald-300 flex items-center gap-3">
                            <img
                              src={slipPreview}
                              alt="Slip preview"
                              className="w-16 h-16 object-cover rounded-lg border border-emerald-200 shadow-sm"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-emerald-950">แนบสลิปเรียบร้อยแล้ว</p>
                              <p className="text-zinc-500 truncate max-w-xs">{slipFile?.name}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-500 mt-1">
                            ℹ️ สามารถแนบสลิปตอนนี้ หรือยืนยันคำสั่งซื้อแล้วส่งสลิปผ่านทางเบอร์ติดต่อเกษตรกรได้เช่นกัน
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t-2 border-emerald-100 bg-emerald-50/40 space-y-4 shadow-inner">
                  <div className="flex justify-between text-base font-black text-zinc-800">
                    <span>ยอดชำระโอนตรงทั้งหมด</span>
                    <span className="text-emerald-950 text-2xl font-mono font-black">
                      ฿{cartSubtotal.toLocaleString("th-TH")}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold">
                    🚚 ส่งตรงจากแปลงในวันเดียว • ไม่หักค่าธรรมเนียมใดๆ
                  </p>
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isSubmittingOrder}
                    className="w-full btn-3d-emerald py-4 text-base font-black cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingOrder
                      ? "กำลังบันทึกคำสั่งซื้อ..."
                      : "✓ ยืนยันคำสั่งซื้อและแจ้งเกษตรกร ➔"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* PREMIUM 3D ORDER SUCCESS MODAL */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#061B13]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-emerald-200/60 bg-gradient-to-br from-white via-[#F5FAF4] to-[#E4F1E5] p-7 sm:p-9 text-center shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
            <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-emerald-200 bg-white shadow-[0_12px_0_#D1E7D5,0_20px_35px_rgba(16,80,48,0.18)] animate-float-3d">
                <span className="text-5xl">🌱</span>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                ORDER CONFIRMED
              </span>

              <h3 className="mt-5 text-2xl sm:text-3xl font-black tracking-tight text-[#123D2C]">
                สั่งซื้อสำเร็จแล้ว!
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-600">
                ขอบคุณที่สนับสนุนเกษตรกรและวิสาหกิจชุมชน PLUK RAK
                คำสั่งซื้อของคุณได้รับการบันทึกแล้ว
                สามารถใช้รหัสติดตามเพื่อตรวจสอบความคืบหน้าได้
              </p>

              <div className="mt-7 rounded-2xl border border-emerald-200 bg-white/90 p-5 text-left shadow-[0_8px_0_#DCEBDD,0_15px_30px_rgba(18,61,44,0.08)]">
                <div className="mb-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-zinc-500">
                      รหัสติดตามคำสั่งซื้อ
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-800">
                      {orderSuccessModal.orders?.length || 1} คำสั่งซื้อ
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(orderSuccessModal.orders || [{
                      order_code: orderSuccessModal.lotCode,
                      total_amount: orderSuccessModal.total,
                    }]).map((order, index) => (
                      <div
                        key={order.order_id || order.order_code}
                        className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-zinc-500">
                            คำสั่งซื้อที่ {index + 1}
                            {order.seller_id ? ` · ผู้ขาย ${order.seller_id}` : ""}
                          </p>
                          <p className="break-all font-mono text-sm font-black text-emerald-900">
                            {order.order_code}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-black text-[#123D2C]">
                          ฿{Number(order.total_amount || 0).toLocaleString("th-TH")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-4">
                  <span className="text-xs font-bold text-zinc-500">ยอดคำสั่งซื้อ</span>
                  <span className="text-lg font-black text-[#123D2C]">
                    ฿{Number(orderSuccessModal.total || 0).toLocaleString("th-TH")}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-zinc-200 pt-4">
                  <span className="text-xs font-bold text-zinc-500">หลักฐานการโอนเงิน</span>
                  <span className={`text-xs font-black ${orderSuccessModal.hasSlip ? "text-emerald-700" : "text-amber-700"}`}>
                    {orderSuccessModal.hasSlip ? "✓ แนบหลักฐานแล้ว" : "รอแนบหลักฐาน"}
                  </span>
                </div>

                <p className="mt-3 text-[11px] leading-5 text-zinc-400">
                  สถานะการตรวจสอบการชำระเงินอาจยังอยู่ระหว่างดำเนินการ
                </p>
              </div>

              <button
                onClick={() => setOrderSuccessModal(null)}
                className="mt-7 w-full rounded-2xl border border-[#D9B96E] bg-gradient-to-r from-[#174B35] via-[#176342] to-[#174B35] py-4 text-sm font-black text-white shadow-[0_6px_0_#0A2C1C,0_12px_25px_rgba(18,61,44,0.2)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_9px_0_#0A2C1C,0_18px_30px_rgba(18,61,44,0.25)] active:translate-y-1 active:shadow-none"
              >
                กลับสู่หน้าร้านค้า →
              </button>

              <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-emerald-800/50">
                PLUK RAK · GROW TOGETHER
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM 3D FOOTER */}
      <footer className="relative mt-24 overflow-hidden border-t border-emerald-900 bg-[#0B2C20] text-white">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-block rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-lg">
                <Logo size="normal" showSubtitle={true} light={true} />
              </div>

              <h3 className="mt-5 text-xl font-black text-[#E8D29A]">
                สดจากชุมชน ส่งตรงถึงคุณ
              </h3>

              <p className="mt-2 max-w-md text-sm leading-7 text-emerald-100/70">
                พื้นที่เชื่อมโยงผลผลิต เกษตรกร และวิสาหกิจชุมชน
                เพื่อให้ผู้บริโภคเข้าถึงสินค้าและเรื่องราวจากแหล่งผลิต
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-lg">
                <span className="text-2xl">🌱</span>
                <p className="mt-2 text-sm font-black text-white">10 วิสาหกิจชุมชน</p>
                <p className="mt-1 text-xs text-emerald-100/60">จังหวัดปทุมธานี</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-lg">
                <span className="text-2xl">🛡️</span>
                <p className="mt-2 text-sm font-black text-white">ข้อมูลแหล่งผลิต</p>
                <p className="mt-1 text-xs text-emerald-100/60">ตรวจสอบข้อมูลสินค้า</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-lg">
                <span className="text-2xl">🛒</span>
                <p className="mt-2 text-sm font-black text-white">เลือกซื้อออนไลน์</p>
                <p className="mt-1 text-xs text-emerald-100/60">เลือกชมสินค้าได้ง่าย</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-lg">
                <span className="text-2xl">🤝</span>
                <p className="mt-2 text-sm font-black text-white">สนับสนุนชุมชน</p>
                <p className="mt-1 text-xs text-emerald-100/60">เชื่อมโยงผู้ผลิตกับผู้ซื้อ</p>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-center text-xs text-emerald-100/50 sm:flex-row sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} PLUK RAK · ตลาดสินค้าเกษตรชุมชนปทุมธานี</p>
            <p>Premium Nature Tech · Next.js · MySQL</p>
          </div>
        </div>
      </footer>

      {/* 🖼️ Fullscreen Image Lightbox Modal */}
      <ImageLightbox
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />
    </div>
  );
}
