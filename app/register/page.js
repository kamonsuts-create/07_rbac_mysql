"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <Link href="/" className="register-brand">
        <span className="brand-icon">🌱</span>
        <span>
          ปลูกรัก
          <small>ตลาดผลผลิตจากชุมชน</small>
        </span>
      </Link>

      <div className="register-container">
        <section className="register-visual">
          <div className="visual-content">
            <span className="visual-label">GROW TOGETHER WITH US</span>
            <h1>
              เริ่มต้นเติบโต
              <br />
              <span>ไปด้วยกัน</span>
            </h1>
            <p>
              สมัครสมาชิกเพื่อร่วมเป็นส่วนหนึ่งของชุมชน
              ที่เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง
            </p>

            <div className="visual-illustration">
              <span>🌱</span>
              <span>🥬</span>
              <span>🍅</span>
              <span>🥕</span>
            </div>

            <div className="visual-note">
              💚 ผลผลิตจากชุมชน ส่งต่อด้วยความใส่ใจ
            </div>
          </div>
        </section>

        <section className="register-card">
          <div className="card-icon">✨</div>
          <div className="card-eyebrow">JOIN OUR COMMUNITY</div>
          <h2>สมัครสมาชิก</h2>
          <p className="card-description">
            สร้างบัญชีใหม่เพื่อเริ่มต้นใช้งานปลูกรัก
          </p>

          <form onSubmit={handleRegister}>
            <label htmlFor="fullName">ชื่อ-นามสกุล</label>
            <div className="field-wrap">
              <span>👤</span>
              <input
                id="fullName"
                type="text"
                placeholder="กรอกชื่อและนามสกุล"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <label htmlFor="email">อีเมล</label>
            <div className="field-wrap">
              <span>✉️</span>
              <input
                id="email"
                type="email"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">รหัสผ่าน</label>
            <div className="field-wrap">
              <span>🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>

            {message && (
              <div className="error-message">
                <span>⚠️</span>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              {loading ? "กำลังสมัครสมาชิก..." : "สร้างบัญชีผู้ใช้งาน"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="login-prompt">
            มีบัญชีอยู่แล้ว?
            <Link href="/login"> เข้าสู่ระบบ</Link>
          </div>

          <Link href="/" className="back-home">
            ← กลับสู่หน้าหลัก
          </Link>
        </section>
      </div>

      <footer className="register-footer">
        © 2026 ปลูกรัก · เชื่อมโยงเกษตรกรไทยกับผู้บริโภค
      </footer>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          font-family: inherit;
          padding: 90px 6% 30px;
          background: #faf9f2;
          color: #294333;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .register-page::before,
        .register-page::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: #e8efdf;
          pointer-events: none;
        }

        .register-page::before {
          width: 420px;
          height: 420px;
          top: -220px;
          left: -130px;
        }

        .register-page::after {
          width: 500px;
          height: 500px;
          bottom: -300px;
          right: -180px;
        }

        .register-brand {
          position: absolute;
          top: 25px;
          left: 6%;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #315b40;
          font-size: 25px;
          font-weight: 800;
          z-index: 2;
        }

        .brand-icon {
          font-size: 38px;
        }

        .register-brand small {
          display: block;
          color: #829183;
          font-size: 10px;
          font-weight: 400;
        }

        .register-container {
          width: 100%;
          max-width: 1020px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: white;
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(41, 67, 51, .12);
          position: relative;
          z-index: 1;
          margin: 20px 0 30px;
        }

        .register-visual {
          background: linear-gradient(145deg, #315f40, #214b35);
          color: white;
          display: flex;
          align-items: center;
          padding: 50px 45px;
          position: relative;
          overflow: hidden;
        }

        .register-visual::before {
          content: "";
          position: absolute;
          width: 350px;
          height: 350px;
          border: 1px solid #ffffff20;
          border-radius: 50%;
          right: -150px;
          top: -100px;
        }

        .visual-content {
          position: relative;
          z-index: 1;
        }

        .visual-label {
          color: #c5dfb8;
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .visual-content h1 {
          font-size: clamp(30px, 3.5vw, 43px);
          line-height: 1.5;
          margin: 22px 0 15px;
        }

        .visual-content h1 span {
          color: #c5df9d;
        }

        .visual-content > p {
          color: #d4e2d4;
          font-size: 14px;
          line-height: 2;
        }

        .visual-illustration {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 45px;
          background: #ffffff16;
          border: 1px solid #ffffff20;
          padding: 18px;
          border-radius: 17px;
          width: fit-content;
        }

        .visual-illustration span {
          font-size: 38px;
        }

        .visual-note {
          color: #d3e6c8;
          font-size: 12px;
          margin-top: 20px;
        }

        .register-card {
          padding: 42px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .card-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          background: #edf4e8;
          border-radius: 15px;
          font-size: 24px;
          margin-bottom: 15px;
        }

        .card-eyebrow {
          color: #71946b;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .register-card h2 {
          font-size: 31px;
          color: #294b35;
          margin: 5px 0;
        }

        .card-description {
          color: #89958a;
          font-size: 13px;
          margin: 5px 0 20px;
        }

        .register-card label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin: 15px 0 8px;
          color: #405b47;
        }

        .field-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e5eae0;
          border-radius: 10px;
          padding: 0 13px;
          height: 47px;
          background: #fcfdf9;
        }

        .field-wrap:focus-within {
          border-color: #619467;
          box-shadow: 0 0 0 3px #61946718;
        }

        .field-wrap > span {
          font-size: 15px;
        }

        .field-wrap input {
          width: 100%;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 13px;
          box-shadow: none !important;
        }

        .show-password {
          border: 0;
          background: transparent;
          color: #619467;
          font-size: 11px;
          white-space: nowrap;
        }

        .error-message {
          margin-top: 15px;
          padding: 12px;
          border-radius: 9px;
          background: #fff1ed;
          color: #bd4d3e;
          font-size: 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .register-submit {
          width: 100%;
          height: 49px;
          margin-top: 23px;
          background: #477b51;
          color: white;
          border: 0;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          box-shadow: 0 7px 15px #477b5128;
        }

        .register-submit:hover:not(:disabled) {
          background: #315e3b;
          transform: translateY(-2px);
        }

        .register-submit:disabled {
          opacity: .65;
          cursor: wait;
        }

        .login-prompt {
          text-align: center;
          color: #829083;
          font-size: 12px;
          margin-top: 22px;
        }

        .login-prompt a {
          color: #477b51;
          font-weight: 700;
        }

        .back-home {
          text-align: center;
          color: #829083;
          font-size: 12px;
          margin-top: 20px;
        }

        .back-home:hover {
          color: #477b51;
        }

        .register-footer {
          position: relative;
          z-index: 1;
          color: #929c8d;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 760px) {
          .register-page {
            padding: 90px 18px 25px;
          }

          .register-brand {
            top: 20px;
            left: 22px;
          }

          .register-container {
            grid-template-columns: 1fr;
            max-width: 470px;
          }

          .register-visual {
            padding: 28px;
          }

          .visual-content h1 {
            font-size: 27px;
            margin: 12px 0;
          }

          .visual-illustration {
            margin-top: 18px;
            padding: 10px 15px;
          }

          .visual-illustration span {
            font-size: 29px;
          }

          .register-card {
            padding: 32px 25px;
          }
        }
      `}</style>
    </main>
  );
}
