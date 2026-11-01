"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadNews() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/news", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "ไม่สามารถโหลดข่าวได้");
        setNews([]);
        return;
      }

      setNews(data.news || []);
    } catch (error) {
      console.error(error);
      setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews();
  }, []);

  function formatDate(dateValue) {
    if (!dateValue) return "-";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="news-page">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-icon">🌱</span>
          <span>ปลูกรัก</span>
        </Link>

        <nav className="top-actions">
          <Link href="/" className="nav-link">หน้าแรก</Link>
          <Link href="/dashboard" className="nav-button">แดชบอร์ด</Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">PLOOKRAK COMMUNITY</span>
          <h1>ข่าวสารและประชาสัมพันธ์</h1>
          <p>ติดตามข่าวสาร กิจกรรม และเรื่องราวดี ๆ จากชุมชนเกษตรกร</p>
        </div>
        <div className="hero-decoration">🌿</div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="section-label">LATEST UPDATES</span>
            <h2>ข่าวสารทั้งหมด</h2>
            <p>อัปเดตเรื่องราวล่าสุดจากปลูกรัก</p>
          </div>

          <button
            onClick={loadNews}
            className="refresh-button"
            disabled={loading}
          >
            <span>↻</span>
            {loading ? "กำลังโหลด..." : "รีเฟรชข่าว"}
          </button>
        </div>

        {loading ? (
          <div className="state-card">
            <div className="loader"></div>
            <p>กำลังโหลดข่าวสาร...</p>
          </div>
        ) : message ? (
          <div className="state-card error-card">
            <div className="state-icon">⚠️</div>
            <h3>ไม่สามารถแสดงข่าวได้</h3>
            <p>{message}</p>
            <button onClick={loadNews} className="retry-button">
              ลองอีกครั้ง
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="state-card">
            <div className="state-icon">📰</div>
            <h3>ยังไม่มีข่าวสาร</h3>
            <p>ขณะนี้ยังไม่มีข่าวที่เผยแพร่ในระบบ</p>
          </div>
        ) : (
          <div className="news-grid">
            {news.map((item) => (
              <article key={item.id} className="news-card">
                <div className="news-card-top">
                  <span className="news-tag">ข่าวสาร</span>
                  <span className="news-symbol">🌱</span>
                </div>

                <h3>{item.title}</h3>

                <div className="news-meta">
                  <span>✍️ {item.author_name || "ไม่ระบุผู้เขียน"}</span>
                  <span>📅 {formatDate(item.created_at)}</span>
                </div>

                <div className="news-content">{item.content}</div>

                <div className="card-footer">
                  <span>ชุมชนปลูกรัก</span>
                  <span className="footer-leaf">🍃</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="page-footer">
        <div className="footer-brand">🌱 ปลูกรัก</div>
        <p>เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง</p>
        <small>© 2026 Plookrak. All rights reserved.</small>
      </footer>

      <style jsx>{`
        .news-page {
          min-height: 100vh;
          background: #faf9f2;
          color: #294333;
        }

        .topbar {
          min-height: 76px;
          padding: 0 7%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: #fff;
          border-bottom: 1px solid #e8ede3;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #315f40;
          font-size: 25px;
          font-weight: 700;
          text-decoration: none;
        }

        .brand-icon {
          font-size: 27px;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .nav-link {
          color: #617565;
          font-size: 14px;
          text-decoration: none;
        }

        .nav-link:hover {
          color: #315f40;
        }

        .nav-button {
          background: #477b51;
          color: #fff;
          padding: 10px 19px;
          border-radius: 10px;
          font-size: 13px;
          text-decoration: none;
        }

        .nav-button:hover,
        .refresh-button:hover,
        .retry-button:hover {
          background: #315f40;
        }

        .hero {
          min-height: 230px;
          padding: 45px 9%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          background: linear-gradient(120deg, #eaf2e6, #f5f6e9);
        }

        .hero-content {
          position: relative;
          z-index: 1;
        }

        .eyebrow,
        .section-label {
          color: #6b9564;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
        }

        .hero h1 {
          margin: 10px 0;
          color: #214b35;
          font-size: clamp(27px, 4vw, 38px);
          font-weight: 700;
        }

        .hero p {
          margin: 0;
          color: #718273;
          font-size: 14px;
          line-height: 1.8;
        }

        .hero-decoration {
          padding-right: 5%;
          color: #477b51;
          font-size: 100px;
          opacity: .65;
        }

        .content-section {
          max-width: 1120px;
          min-height: 420px;
          margin: 0 auto;
          padding: 55px 24px 75px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .section-heading h2 {
          margin: 7px 0 3px;
          color: #294b35;
          font-size: 25px;
        }

        .section-heading p {
          margin: 0;
          color: #829083;
          font-size: 13px;
        }

        .refresh-button,
        .retry-button {
          border: 0;
          border-radius: 10px;
          padding: 11px 17px;
          background: #477b51;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
        }

        .refresh-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .refresh-button span {
          margin-right: 7px;
          font-size: 17px;
        }

        .news-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .news-card {
          padding: 25px;
          background: #fff;
          border: 1px solid #e8ede3;
          border-radius: 17px;
          box-shadow: 0 8px 25px rgba(35, 72, 47, .045);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .news-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 13px 30px rgba(35, 72, 47, .09);
        }

        .news-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .news-tag {
          padding: 5px 11px;
          border-radius: 20px;
          background: #edf4e9;
          color: #477b51;
          font-size: 11px;
        }

        .news-symbol {
          font-size: 23px;
        }

        .news-card h3 {
          margin: 0 0 13px;
          color: #294b35;
          font-size: 20px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .news-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 17px;
          padding-bottom: 15px;
          border-bottom: 1px solid #edf0e8;
          color: #879187;
          font-size: 11px;
        }

        .news-content {
          padding: 17px 0;
          color: #596b5d;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 13px;
          border-top: 1px solid #edf0e8;
          color: #8a9a8b;
          font-size: 11px;
        }

        .footer-leaf {
          font-size: 17px;
        }

        .state-card {
          padding: 65px 20px;
          border: 1px solid #e8ede3;
          border-radius: 17px;
          background: #fff;
          text-align: center;
          color: #829083;
        }

        .state-card h3 {
          margin: 12px 0 6px;
          color: #31543b;
          font-size: 19px;
        }

        .state-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.8;
        }

        .state-icon {
          font-size: 43px;
        }

        .error-card {
          border-color: #f0d9d5;
        }

        .retry-button {
          margin-top: 18px;
        }

        .loader {
          width: 34px;
          height: 34px;
          margin: 0 auto 16px;
          border: 3px solid #e3eadf;
          border-top-color: #477b51;
          border-radius: 50%;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-footer {
          padding: 35px 20px;
          background: #294b35;
          color: #d0ddce;
          text-align: center;
        }

        .footer-brand {
          color: #fff;
          font-size: 23px;
          font-weight: 700;
        }

        .page-footer p {
          margin: 8px 0 15px;
          font-size: 13px;
        }

        .page-footer small {
          color: #a9bda9;
          font-size: 11px;
        }

        @media (max-width: 700px) {
          .topbar {
            padding: 14px 20px;
          }

          .brand {
            font-size: 21px;
          }

          .top-actions {
            gap: 12px;
          }

          .nav-link {
            font-size: 12px;
          }

          .nav-button {
            padding: 9px 12px;
            font-size: 12px;
          }

          .hero {
            min-height: 190px;
            padding: 35px 24px;
          }

          .hero-decoration {
            padding: 0;
            font-size: 65px;
          }

          .hero p {
            max-width: 290px;
            font-size: 12px;
          }

          .content-section {
            padding: 40px 16px 55px;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .news-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .news-card {
            padding: 20px;
          }

          .news-card h3 {
            font-size: 18px;
          }
        }

        @media (max-width: 390px) {
          .topbar {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .top-actions {
            width: 100%;
            justify-content: space-between;
          }

          .hero-decoration {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
