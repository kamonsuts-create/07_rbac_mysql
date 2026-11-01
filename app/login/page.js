"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "เข้าสู่ระบบไม่สำเร็จ");
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
    <main className="login-page">
      <div className="login-decoration decoration-one"></div>
      <div className="login-decoration decoration-two"></div>

      <Link href="/" className="login-brand">
        <span className="brand-icon">🌱</span>
        <span>
          ปลูกรัก
          <small>ตลาดผลผลิตจากชุมชน</small>
        </span>
      </Link>

      <div className="login-container">
        <div className="login-visual">
          <div className="visual-content">
            <span className="visual-label">WELCOME TO PLOOKRAK</span>
            <h1>
              เติบโตไปด้วยกัน
              <br />
              <span>เริ่มต้นที่ปลูกรัก</span>
            </h1>
            <p>
              พื้นที่เชื่อมโยงเกษตรกรไทยกับผู้บริโภค
              เพื่อส่งต่อผลผลิตดี ๆ จากชุมชน
            </p>
            <div className="visual-illustration">
              <span>🥬</span>
              <span>🍅</span>
              <span>🥕</span>
              <span>🌽</span>
            </div>
            <div className="visual-note">
              💚 สดจากสวน ส่งต่อด้วยรัก
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="card-icon">👋</div>
          <div className="card-eyebrow">ยินดีต้อนรับกลับมา</div>
          <h2>เข้าสู่ระบบ</h2>
          <p className="card-description">
            กรอกข้อมูลบัญชีของคุณเพื่อเข้าใช้งาน
          </p>

          <form onSubmit={handleLogin}>
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
                placeholder="กรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
              className="login-submit"
              disabled={loading}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="register-prompt">
            ยังไม่มีบัญชีใช่ไหม?
            <Link href="/register"> สมัครสมาชิก</Link>
          </div>

          <Link href="/" className="back-home">
            ← กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>

      <footer className="login-footer">
        © 2026 ปลูกรัก · เชื่อมโยงเกษตรกรไทยกับผู้บริโภค
      </footer>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          font-family: inherit;
          padding: 25px 6%;
          background: #faf9f2;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #294333;
        }

        .login-decoration {
          position: absolute;
          border-radius: 50%;
          background: #e8efdf;
          pointer-events: none;
        }

        .decoration-one {
          width: 420px;
          height: 420px;
          top: -220px;
          left: -130px;
        }

        .decoration-two {
          width: 500px;
          height: 500px;
          bottom: -300px;
          right: -180px;
          background: #e4edda;
        }

        .login-brand {
          position: absolute;
          top: 30px;
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

        .login-brand small {
          display: block;
          color: #829183;
          font-size: 10px;
          font-weight: 400;
        }

        .login-container {
          width: 100%;
          max-width: 1020px;
          min-height: 590px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: white;
          border-radius: 25px;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(41, 67, 51, .12);
          position: relative;
          z-index: 1;
          margin: 55px 0 35px;
        }

        .login-visual {
          background: linear-gradient(145deg, #315f40, #214b35);
          color: white;
          display: flex;
          align-items: center;
          padding: 55px 45px;
          position: relative;
          overflow: hidden;
        }

        .login-visual::before {
          content: "";
          position: absolute;
          width: 350px;
          height: 350px;
          border: 1px solid #ffffff20;
          border-radius: 50%;
          right: -150px;
          top: -100px;
        }

        .login-visual::after {
          content: "";
          position: absolute;
          width: 270px;
          height: 270px;
          border: 1px solid #ffffff20;
          border-radius: 50%;
          left: -130px;
          bottom: -130px;
        }

        .visual-content {
          position: relative;
          z-index: 1;
        }

        .visual-label {
          color: #c5dfb8;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 2px;
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

        .login-card {
          padding: 55px 48px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .card-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          background: #edf4e8;
          border-radius: 15px;
          font-size: 25px;
          margin-bottom: 20px;
        }

        .card-eyebrow {
          color: #71946b;
          font-size: 12px;
          font-weight: 600;
        }

        .login-card h2 {
          font-size: 32px;
          color: #294b35;
          margin: 5px 0;
        }

        .card-description {
          color: #89958a;
          font-size: 13px;
          margin: 5px 0 28px;
        }

        .login-card label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin: 17px 0 8px;
          color: #405b47;
        }

        .field-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e5eae0;
          border-radius: 10px;
          padding: 0 13px;
          height: 49px;
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
          margin-top: 16px;
          padding: 12px;
          border-radius: 9px;
          background: #fff1ed;
          color: #bd4d3e;
          font-size: 12px;
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .login-submit {
          width: 100%;
          height: 50px;
          margin-top: 25px;
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

        .login-submit:hover:not(:disabled) {
          background: #315e3b;
          transform: translateY(-2px);
        }

        .login-submit:disabled {
          opacity: .65;
          cursor: wait;
        }

        .register-prompt {
          text-align: center;
          color: #829083;
          font-size: 12px;
          margin-top: 25px;
        }

        .register-prompt a {
          color: #477b51;
          font-weight: 700;
        }

        .back-home {
          text-align: center;
          color: #829083;
          font-size: 12px;
          margin-top: 25px;
        }

        .back-home:hover {
          color: #477b51;
        }

        .login-footer {
          position: relative;
          z-index: 1;
          color: #929c8d;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 760px) {
          .login-page {
            padding: 90px 18px 25px;
          }

          .login-brand {
            top: 22px;
            left: 22px;
          }

          .login-container {
            grid-template-columns: 1fr;
            max-width: 470px;
            margin-top: 15px;
          }

          .login-visual {
            padding: 30px;
          }

          .visual-content h1 {
            font-size: 27px;
            margin: 12px 0;
          }

          .visual-illustration {
            margin-top: 20px;
            padding: 10px 15px;
          }

          .visual-illustration span {
            font-size: 29px;
          }

          .login-card {
            padding: 35px 28px;
          }
        }
      `}</style>
    </main>
  );
}
