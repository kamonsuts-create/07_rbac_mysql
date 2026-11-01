
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const categories = [
  { name: "ทั้งหมด", emoji: "🧺" },
  { name: "ผักสด", emoji: "🥬" },
  { name: "ผลไม้", emoji: "🍊" },
  { name: "ข้าวและธัญพืช", emoji: "🌾" },
  { name: "สินค้าแปรรูป", emoji: "🫙" },
];

const benefits = [
  {
    icon: "🌱",
    title: "จากสวนโดยตรง",
    detail: "เลือกซื้อจากเกษตรกร",
  },
  {
    icon: "🤝",
    title: "สนับสนุนชุมชน",
    detail: "ช่วยสร้างรายได้ให้ชาวบ้าน",
  },
  {
    icon: "🧺",
    title: "ผลผลิตสดใหม่",
    detail: "เลือกสินค้าจากชุมชน",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "ไม่สามารถโหลดสินค้าได้");
        }

        if (active) {
          setProducts(
            Array.isArray(data.products) ? data.products : []
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดสินค้า");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // ค้นหาสินค้าจากชื่อ เกษตรกร และรายละเอียด
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        String(product.name || "").toLowerCase().includes(keyword) ||
        String(product.farmer_name || "").toLowerCase().includes(keyword) ||
        String(product.description || "").toLowerCase().includes(keyword);

      // อ่านหมวดหมู่สินค้าจากฐานข้อมูล
      const productCategory = String(
        product.category || product.category_name || ""
      ).trim();

      // กรองหมวดหมู่
      const matchesCategory =
        category === "ทั้งหมด" ||
        productCategory === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("th-TH", {
      maximumFractionDigits: 2,
    });
  };

  return (
    <main>
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-icon">🌱</span>
            <span>
              ปลูกรัก
              <small>ตลาดผลผลิตจากชุมชน</small>
            </span>
          </Link>

          <nav className="nav">
            <Link href="/" className="active">หน้าแรก</Link>
            <a href="#products">เลือกซื้อผลผลิต</a>
            <a href="#about">เกี่ยวกับเรา</a>
          </nav>

          <div className="header-actions">
            <Link href="/login" className="login-btn">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="register-btn">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="eyebrow">
              <span>✦</span> ตลาดชุมชนออนไลน์
            </div>

            <h1>
              ผลผลิตดี ๆ จากชาวสวน
              <br />
              <span>ส่งตรงถึงมือคุณ</span>
            </h1>

            <p>
              เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง
              เลือกซื้อผัก ผลไม้ และผลผลิตสดใหม่
              จากชาวบ้านด้วยความใส่ใจ
            </p>

            <div className="hero-actions">
              <a href="#products" className="primary-btn">
                เลือกชมผลผลิต <span>→</span>
              </a>
              <Link href="/register" className="secondary-btn">
                ร่วมเป็นส่วนหนึ่งกับเรา
              </Link>
            </div>

            <div className="hero-note">
              💚 ซื้อจากเกษตรกรโดยตรง ช่วยสร้างรายได้ให้ชุมชน
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-sun"></div>
            <div className="hero-land land-one"></div>
            <div className="hero-land land-two"></div>

            <div className="hero-produce">
              <div className="big-produce">🥬 🍅 🥕</div>
              <div className="produce-caption">
                สดจากสวน ส่งต่อด้วยรัก
              </div>
            </div>

            <div className="float-item float-one">🍊</div>
            <div className="float-item float-two">🌿</div>
            <div className="float-item float-three">🍌</div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits">
        <div className="benefits-inner">
          {benefits.map((item) => (
            <div className="benefit-item" key={item.title}>
              <span className="benefit-icon">{item.icon}</span>
              <div>
                <b>{item.title}</b>
                <small>{item.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" id="products">
        <div className="section-heading">
          <div>
            <div className="eyebrow">เลือกสิ่งดี ๆ จากชุมชน</div>
            <h2>เลือกซื้อผลผลิต</h2>
            <p>พบกับผลผลิตจากเกษตรกรและชาวสวนในชุมชน</p>
          </div>

          <Link href="/login" className="view-all">
            จัดการสินค้า →
          </Link>
        </div>

        {/* SEARCH */}
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า หรือชื่อเกษตรกร..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="ล้างคำค้นหา"
            >
              ✕
            </button>
          )}
        </div>

        {/* CATEGORIES */}
        <div className="category-list">
          {categories.map((item) => (
            <button
              key={item.name}
              type="button"
              className={
                category === item.name
                  ? "category active-category"
                  : "category"
              }
              onClick={() => setCategory(item.name)}
            >
              <span>{item.emoji}</span>
              {item.name}
            </button>
          ))}
        </div>

        {/* PRODUCT LIST */}
        {loading ? (
          <div className="message-box">
            <div className="loader"></div>
            <p>กำลังโหลดผลผลิตจากชุมชน...</p>
          </div>
        ) : error ? (
          <div className="message-box error-message">
            <span>⚠️</span>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              ลองอีกครั้ง
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="message-box">
            <span className="empty-icon">🧺</span>
            <h3>
              {search || category !== "ทั้งหมด"
                ? "ไม่พบสินค้าที่ตรงกับเงื่อนไข"
                : "ยังไม่มีสินค้าในขณะนี้"}
            </h3>
            <p>
              {search || category !== "ทั้งหมด"
                ? "ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น"
                : "เกษตรกรสามารถเข้าสู่ระบบเพื่อเพิ่มสินค้าได้"}
            </p>
            <Link href="/login" className="primary-btn">
              เข้าสู่ระบบเกษตรกร
            </Link>
          </div>
        ) : (
          <>
            <div className="result-count">
              พบสินค้า {filteredProducts.length} รายการ
            </div>

            <div className="product-grid">
              {filteredProducts.map((item) => (
                <article className="product-card" key={item.id}>
                  <div className="product-picture">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="product-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-image">🌱</div>
                    )}

                    <span className="product-tag">
                      สดจากสวน
                    </span>
                  </div>

                  <div className="product-info">
                    <h3>{item.name}</h3>

                    <p className="farmer">
                      👨‍🌾 {item.farmer_name || "เกษตรกรชุมชน"}
                    </p>

                    {item.description && (
                      <p className="description">
                        {item.description}
                      </p>
                    )}

                    <div className="stock">
                      มีสินค้า {Number(item.quantity || 0).toLocaleString("th-TH")}{" "}
                      {item.unit}
                    </div>

                    <div className="product-bottom">
                      <p>
                        <b>฿{formatPrice(item.price)}</b>
                        <small> / {item.unit}</small>
                      </p>

                      <Link href="/login" className="reserve-btn">
                        สอบถามสินค้า
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* FARMER BANNER */}
      <section className="farmer-banner" id="about">
        <div className="farmer-illustration">👩‍🌾</div>

        <div className="farmer-text">
          <div className="eyebrow">เติบโตไปด้วยกัน</div>
          <h2>คุณคือส่วนสำคัญของชุมชน</h2>
          <p>
            เป็นเกษตรกรก็ลงขายผลผลิตได้
            เป็นลูกค้าก็เลือกซื้อของดีจากชุมชนได้
          </p>
        </div>

        <Link href="/register" className="farmer-btn">
          สมัครเข้าร่วมปลูกรัก →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">🌱 ปลูกรัก</div>
        <p>เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง</p>

        <div className="footer-links">
          <Link href="/">หน้าแรก</Link>
          <a href="#products">เลือกซื้อผลผลิต</a>
          <Link href="/login">เข้าสู่ระบบ</Link>
          <Link href="/register">สมัครสมาชิก</Link>
        </div>

        <small>© 2026 ปลูกรัก · ตลาดผลผลิตจากชุมชน</small>
      </footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #fafbf7;
          color: #294333;
          font-family: Arial, sans-serif;
        }

        a {
          text-decoration: none;
        }

        button,
        input {
          font: inherit;
        }

        .header {
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 2px 12px #29433308;
        }

        .header-inner {
          max-width: 1250px;
          min-height: 82px;
          margin: auto;
          padding: 0 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #315b40;
          font-size: 25px;
          font-weight: 800;
          white-space: nowrap;
        }

        .brand-icon {
          font-size: 35px;
        }

        .brand small {
          display: block;
          font-size: 10px;
          font-weight: 400;
          color: #829183;
          margin-top: 3px;
        }

        .nav {
          display: flex;
          gap: 30px;
        }

        .nav a {
          color: #526558;
          font-size: 14px;
        }

        .nav a:hover,
        .nav .active {
          color: #477b51;
          font-weight: 700;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .login-btn {
          color: #477b51;
          font-size: 14px;
          font-weight: 600;
        }

        .register-btn,
        .primary-btn {
          display: inline-block;
          background: #477b51;
          color: white;
          padding: 13px 22px;
          border-radius: 9px;
          font-weight: 600;
          font-size: 14px;
        }

        .register-btn:hover,
        .primary-btn:hover,
        .reserve-btn:hover,
        .farmer-btn:hover {
          background: #315e3b;
        }

        .hero {
          background: #edf3e9;
          overflow: hidden;
        }

        .hero-inner {
          max-width: 1250px;
          min-height: 465px;
          padding: 55px 45px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 35px;
        }

        .hero-content {
          max-width: 570px;
        }

        .eyebrow {
          color: #70936c;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .5px;
          margin-bottom: 15px;
        }

        .hero-content h1 {
          font-size: clamp(34px, 4.5vw, 55px);
          line-height: 1.35;
          margin: 0 0 18px;
          color: #294b35;
        }

        .hero-content h1 span {
          color: #6b9564;
        }

        .hero-content > p {
          color: #657568;
          line-height: 1.9;
          max-width: 490px;
          font-size: 15px;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .primary-btn span {
          margin-left: 12px;
        }

        .secondary-btn {
          display: inline-block;
          color: #477b51;
          border: 1px solid #91aa91;
          padding: 12px 19px;
          border-radius: 9px;
          font-size: 14px;
        }

        .hero-note {
          color: #66836a;
          font-size: 12px;
          margin-top: 25px;
        }

        .hero-visual {
          width: 45%;
          max-width: 480px;
          height: 330px;
          position: relative;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .hero-sun {
          position: absolute;
          width: 270px;
          height: 270px;
          border-radius: 50%;
          background: #dce8cf;
        }

        .hero-land {
          position: absolute;
          width: 420px;
          height: 110px;
          border-radius: 50%;
          bottom: 5px;
        }

        .land-one {
          background: #c5d9b7;
          transform: rotate(-8deg);
        }

        .land-two {
          background: #b3cda7;
          transform: rotate(8deg) translateY(20px);
        }

        .hero-produce {
          z-index: 2;
          background: white;
          border-radius: 28px;
          padding: 36px 25px;
          box-shadow: 0 20px 50px #526d3a20;
          transform: rotate(-5deg);
          text-align: center;
        }

        .big-produce {
          font-size: 65px;
          white-space: nowrap;
        }

        .produce-caption {
          color: #527452;
          font-weight: 700;
          margin-top: 15px;
        }

        .float-item {
          position: absolute;
          z-index: 3;
          font-size: 37px;
          background: white;
          border-radius: 50%;
          padding: 12px;
          box-shadow: 0 8px 20px #00000010;
        }

        .float-one {
          top: 5px;
          right: 8px;
        }

        .float-two {
          bottom: 5px;
          left: 5px;
        }

        .float-three {
          bottom: 10px;
          right: 5px;
        }

        .benefits {
          background: #fff;
          border-bottom: 1px solid #eff1e9;
        }

        .benefits-inner {
          max-width: 1050px;
          margin: auto;
          padding: 27px 25px;
          display: flex;
          justify-content: space-between;
          gap: 25px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .benefit-icon {
          font-size: 31px;
        }

        .benefit-item b,
        .benefit-item small {
          display: block;
        }

        .benefit-item b {
          font-size: 14px;
        }

        .benefit-item small {
          color: #879187;
          margin-top: 5px;
          font-size: 12px;
        }

        .section {
          max-width: 1190px;
          margin: auto;
          padding: 65px 30px;
          scroll-margin-top: 90px;
        }

        .section-heading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          margin-bottom: 25px;
        }

        .section-heading h2 {
          margin: 0 0 9px;
          font-size: 30px;
          color: #31543b;
        }

        .section-heading p {
          color: #829083;
          font-size: 14px;
          margin: 0;
        }

        .view-all {
          color: #477b51;
          font-size: 13px;
          font-weight: 700;
        }

        .search-box {
          height: 52px;
          max-width: 560px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 17px;
          background: #fff;
          border: 1px solid #e6ebdf;
          border-radius: 11px;
          margin-bottom: 22px;
        }

        .search-box input {
          width: 100%;
          border: 0;
          outline: none;
          background: transparent;
          color: #294333;
          font-size: 14px;
        }

        .search-box button {
          border: 0;
          background: transparent;
          color: #829083;
          cursor: pointer;
        }

        .category-list {
          display: flex;
          flex-wrap: wrap;
          gap: 11px;
          margin-bottom: 28px;
        }

        .category {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 16px;
          border: 1px solid #e8ece3;
          background: white;
          border-radius: 25px;
          color: #526558;
          font-size: 13px;
          cursor: pointer;
        }

        .category:hover,
        .active-category {
          background: #eaf2e6;
          border-color: #9ab897;
          color: #477b51;
        }

        .result-count {
          font-size: 12px;
          color: #829083;
          margin-bottom: 15px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .product-card {
          border-radius: 15px;
          background: #fff;
          overflow: hidden;
          border: 1px solid #edf0e8;
          transition: transform .2s, box-shadow .2s;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px #29433312;
        }

        .product-picture {
          height: 190px;
          display: grid;
          place-items: center;
          position: relative;
          background: #edf3e9;
          overflow: hidden;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          font-size: 70px;
        }

        .product-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #fff;
          color: #648365;
          border-radius: 20px;
          padding: 6px 10px;
          font-size: 10px;
        }

        .product-info {
          padding: 17px;
        }

        .product-info h3 {
          margin: 0 0 9px;
          font-size: 16px;
          color: #294333;
        }

        .farmer {
          color: #89958a;
          font-size: 12px;
          margin: 0 0 10px;
        }

        .description {
          color: #879187;
          font-size: 12px;
          line-height: 1.6;
          min-height: 19px;
          margin: 0 0 10px;
        }

        .stock {
          font-size: 11px;
          color: #6b9564;
          margin-bottom: 15px;
        }

        .product-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          border-top: 1px solid #f0f1eb;
          padding-top: 13px;
        }

        .product-bottom p {
          color: #879187;
          font-size: 12px;
          margin: 0;
          white-space: nowrap;
        }

        .product-bottom b {
          color: #477b51;
          font-size: 19px;
        }

        .product-bottom small {
          font-size: 11px;
        }

        .reserve-btn {
          background: #477b51;
          color: white;
          border-radius: 7px;
          padding: 9px 11px;
          font-size: 11px;
          white-space: nowrap;
        }

        .message-box {
          background: white;
          border: 1px solid #edf0e8;
          border-radius: 15px;
          padding: 55px 20px;
          text-align: center;
          color: #829083;
        }

        .message-box p {
          font-size: 14px;
        }

        .message-box h3 {
          color: #31543b;
        }

        .empty-icon {
          font-size: 45px;
        }

        .message-box .primary-btn {
          margin-top: 12px;
        }

        .error-message button {
          background: #477b51;
          color: white;
          border: 0;
          border-radius: 8px;
          padding: 10px 18px;
          cursor: pointer;
        }

        .loader {
          width: 34px;
          height: 34px;
          margin: 0 auto;
          border: 3px solid #e3eadf;
          border-top-color: #477b51;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .farmer-banner {
          max-width: 1120px;
          margin: 0 auto 65px;
          padding: 32px 38px;
          border-radius: 18px;
          background: #e9f0e4;
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .farmer-illustration {
          font-size: 60px;
        }

        .farmer-text h2 {
          font-size: 24px;
          color: #31543b;
          margin: 0 0 9px;
        }

        .farmer-text p {
          color: #829083;
          font-size: 14px;
          margin: 0;
          line-height: 1.7;
        }

        .farmer-btn {
          margin-left: auto;
          white-space: nowrap;
          background: #477b51;
          color: white;
          padding: 13px 18px;
          border-radius: 9px;
          font-size: 13px;
        }

        .footer {
          text-align: center;
          background: #294b35;
          color: #fff;
          padding: 40px 20px;
        }

        .footer-brand {
          font-size: 26px;
          font-weight: 800;
        }

        .footer p {
          color: #d0ddce;
          font-size: 13px;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 25px;
          flex-wrap: wrap;
          margin: 22px 0;
        }

        .footer-links a {
          color: #d0ddce;
          font-size: 12px;
        }

        .footer small {
          color: #a9bda9;
          font-size: 11px;
        }

        @media (max-width: 900px) {
          .header-inner {
            padding: 15px 20px;
            flex-wrap: wrap;
          }

          .nav {
            order: 3;
            width: 100%;
            justify-content: center;
            gap: 22px;
          }

          .hero-inner {
            padding: 45px 30px;
          }

          .hero-visual {
            transform: scale(.85);
            transform-origin: center;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .farmer-banner {
            margin: 0 20px 45px;
            flex-wrap: wrap;
          }

          .farmer-btn {
            margin-left: 0;
          }
        }

        @media (max-width: 600px) {
          .header-inner {
            gap: 12px;
          }

          .brand {
            font-size: 22px;
          }

          .header-actions {
            gap: 10px;
          }

          .login-btn {
            font-size: 12px;
          }

          .register-btn {
            padding: 10px 12px;
            font-size: 12px;
          }

          .nav {
            justify-content: flex-start;
            overflow-x: auto;
            padding: 8px 0;
          }

          .nav a {
            white-space: nowrap;
            font-size: 12px;
          }

          .hero-inner {
            display: block;
            padding: 40px 23px 20px;
          }

          .hero-content h1 {
            font-size: 35px;
          }

          .hero-content > p {
            font-size: 13px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .hero-visual {
            width: 100%;
            max-width: none;
            height: 250px;
            transform: scale(.8);
          }

          .benefits-inner {
            flex-direction: column;
            padding-left: 10%;
            gap: 20px;
          }

          .section {
            padding: 45px 16px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
          }

          .section-heading h2 {
            font-size: 25px;
          }

          .product-grid {
            gap: 10px;
          }

          .product-picture {
            height: 135px;
          }

          .product-info {
            padding: 12px;
          }

          .product-info h3 {
            font-size: 14px;
          }

          .product-bottom {
            align-items: flex-start;
            flex-direction: column;
          }

          .farmer-banner {
            padding: 25px 20px;
          }

          .farmer-text h2 {
            font-size: 20px;
          }

          .farmer-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
