
"use client";

import { useEffect, useRef, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  quantity: "",
  unit: "กิโลกรัม",
  image_url: "",
  status: "available",
};

export default function FarmerProductsPage() {
  const fileRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    loadProducts();

    return () => {
      if (previewImage.startsWith("blob:")) {
        URL.revokeObjectURL(previewImage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProducts() {
    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        showMessage(data.message || "โหลดสินค้าไม่สำเร็จ", "error");
        return;
      }

      setProducts(data.products || []);
    } catch (error) {
      showMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
    } finally {
      setLoading(false);
    }
  }

  function showMessage(text, type = "success") {
    setMessage(text);
    setMessageType(type);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showMessage("รองรับเฉพาะ JPG, PNG และ WEBP", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("รูปภาพต้องมีขนาดไม่เกิน 5 MB", "error");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    setPreviewImage((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });

    showMessage("เลือกรูปภาพแล้ว พร้อมอัปโหลด", "success");
  }

  async function uploadImage() {
    if (!selectedFile) {
      return form.image_url;
    }

    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append("image", selectedFile);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "อัปโหลดรูปภาพไม่สำเร็จ");
      }

      if (!data.image_url) {
        throw new Error("เซิร์ฟเวอร์ไม่ได้ส่ง URL รูปภาพกลับมา");
      }

      return data.image_url;
    } finally {
      setUploading(false);
    }
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setSelectedFile(null);

    setPreviewImage((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return "";
    });

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || uploading) return;

    if (!form.name.trim()) {
      showMessage("กรุณากรอกชื่อสินค้า", "error");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // อัปโหลดรูปก่อน แล้วนำ URL ไปบันทึกสินค้า
      const imageUrl = await uploadImage();

      const payload = {
        ...form,
        name: form.name.trim(),
        image_url: imageUrl || "",
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "บันทึกสินค้าไม่สำเร็จ");
      }

      showMessage("เพิ่มสินค้าสำเร็จแล้ว", "success");

      resetForm();
      await loadProducts();
    } catch (error) {
      showMessage(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page">
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          font-family: inherit;
          padding: 36px 5%;
          background: #faf9f2;
          color: #263d2b;
        }

        .container {
          max-width: 1200px;
          margin: auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 30px;
        }

        .title {
          font-size: 30px;
          font-weight: 800;
          color: #285c38;
          margin: 0;
        }

        .subtitle {
          color: #788779;
          margin-top: 8px;
        }

        .homeLink {
          text-decoration: none;
          background: white;
          color: #285c38;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 700;
          border: 1px solid #dce8d8;
        }

        .card {
          background: white;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 5px 25px rgba(40, 92, 56, 0.06);
          margin-bottom: 35px;
        }

        .sectionTitle {
          font-size: 22px;
          font-weight: 800;
          color: #285c38;
          margin: 0 0 24px;
        }

        .form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          font-weight: 700;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          padding: 13px;
          border: 1px solid #dce5d8;
          border-radius: 10px;
          font-size: 15px;
          background: #fcfdfb;
          color: #263d2b;
          outline: none;
        }

        .field input:focus,
        .field textarea:focus,
        .field select:focus {
          border-color: #4d925e;
          box-shadow: 0 0 0 3px rgba(77, 146, 94, 0.12);
        }

        .field textarea {
          resize: vertical;
        }

        .uploadBox {
          border: 2px dashed #b9cfb5;
          background: #f8fbf5;
          padding: 24px;
          border-radius: 14px;
          text-align: center;
        }

        .uploadIcon {
          font-size: 38px;
          margin-bottom: 10px;
        }

        .fileInput {
          display: block;
          width: 100%;
          margin-top: 14px;
        }

        .hint {
          color: #839184;
          font-size: 13px;
          margin-top: 12px;
        }

        .preview {
          margin-top: 20px;
          text-align: left;
        }

        .preview img {
          width: 100%;
          max-width: 340px;
          height: 220px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #dce5d8;
        }

        .buttonRow {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 8px;
        }

        .button {
          border: none;
          border-radius: 10px;
          padding: 14px 22px;
          font-weight: 800;
          cursor: pointer;
          font-size: 15px;
        }

        .primary {
          background: #397b4b;
          color: white;
        }

        .secondary {
          background: #eaf1e6;
          color: #285c38;
        }

        .button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .message {
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .success {
          background: #e4f2e4;
          color: #285c38;
        }

        .error {
          background: #fdebea;
          color: #a32d27;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 22px;
        }

        .productCard {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(40, 92, 56, 0.07);
          border: 1px solid #e6eee2;
        }

        .productImage {
          width: 100%;
          height: 190px;
          object-fit: cover;
          background: #eaf1e6;
        }

        .noImage {
          height: 190px;
          display: grid;
          place-items: center;
          background: #eaf1e6;
          color: #82917f;
          font-size: 42px;
        }

        .productInfo {
          padding: 18px;
        }

        .productName {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 8px;
          color: #285c38;
        }

        .description {
          color: #788779;
          font-size: 14px;
          min-height: 38px;
        }

        .price {
          color: #397b4b;
          font-size: 18px;
          font-weight: 800;
        }

        .status {
          font-size: 13px;
          color: #718071;
        }

        .actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .editButton,
        .deleteButton {
          flex: 1;
          padding: 10px;
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }

        .editButton {
          background: #e7f0e3;
          color: #285c38;
        }

        .deleteButton {
          background: #fcebea;
          color: #b42318;
        }

        .empty {
          padding: 45px;
          text-align: center;
          background: white;
          border-radius: 14px;
          color: #788779;
        }

        @media (max-width: 650px) {
          .page {
            padding: 22px 14px;
          }

          .form {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }

          .card {
            padding: 20px;
          }

          .title {
            font-size: 24px;
          }
        }
      `}</style>

      <div className="container">
        <header className="header">
          <div>
            <h1 className="title">🌱 จัดการสินค้าของฉัน</h1>
            <p className="subtitle">
              เพิ่มสินค้าและติดตามผลผลิตของคุณบนปลูกรัก
            </p>
          </div>

          <a href="/" className="homeLink">
            ← กลับหน้าหลัก
          </a>
        </header>

        {message && (
          <div
            className={`message ${
              messageType === "error" ? "error" : "success"
            }`}
            role="status"
          >
            {message}
          </div>
        )}

        <section className="card">
          <h2 className="sectionTitle">
            ＋ เพิ่มสินค้าใหม่
          </h2>

          <form onSubmit={handleSubmit} className="form">
            <div className="field full">
              <label>ชื่อสินค้า *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น มะม่วงน้ำดอกไม้"
                required
                maxLength={255}
              />
            </div>

            <div className="field full">
              <label>รายละเอียดสินค้า</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="บอกเล่ารายละเอียดผลผลิตของคุณ..."
              />
            </div>

            <div className="field">
              <label>ราคา (บาท) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>จำนวนสินค้า *</label>
              <input
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label>หน่วยสินค้า</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
              >
                <option value="กิโลกรัม">กิโลกรัม</option>
                <option value="กรัม">กรัม</option>
                <option value="ถุง">ถุง</option>
                <option value="กล่อง">กล่อง</option>
                <option value="ชิ้น">ชิ้น</option>
                <option value="ผล">ผล</option>
              </select>
            </div>



            <div className="field full">
              <label>รูปภาพสินค้า</label>

              <div className="uploadBox">
                <div className="uploadIcon">📷</div>
                <strong>เลือกรูปภาพสินค้าจากเครื่อง</strong>

                <input
                  ref={fileRef}
                  className="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  disabled={saving || uploading}
                />

                <p className="hint">
                  JPG, PNG หรือ WEBP ขนาดไม่เกิน 5 MB
                </p>

                {previewImage && (
                  <div className="preview">
                    <p><strong>ตัวอย่างรูปภาพ</strong></p>
                    <img
                      src={previewImage}
                      alt="ตัวอย่างรูปสินค้า"
                    />
                    <p className="hint">
                      {selectedFile
                        ? `ไฟล์ที่เลือก: ${selectedFile.name}`
                        : "รูปภาพปัจจุบัน"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="full buttonRow">
              <button
                className="button primary"
                type="submit"
                disabled={saving || uploading}
              >
                {saving
                  ? "กำลังบันทึก..."
                  : uploading
                    ? "กำลังอัปโหลด..."
                    : "＋ เพิ่มสินค้า"}
              </button>


            </div>
          </form>
        </section>

        <section>
          <h2 className="sectionTitle">
            📦 สินค้าของฉัน ({products.length})
          </h2>

          {loading ? (
            <div className="empty">กำลังโหลดสินค้า...</div>
          ) : products.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize: 42 }}>🌱</div>
              ยังไม่มีสินค้า เริ่มเพิ่มสินค้าแรกของคุณได้เลย
            </div>
          ) : (
            <div className="grid">
              {products.map((product) => (
                <article key={product.id} className="productCard">
                  {product.image_url ? (
                    <img
                      className="productImage"
                      src={product.image_url}
                      alt={product.name}
                    />
                  ) : (
                    <div className="noImage">🌿</div>
                  )}

                  <div className="productInfo">
                    <h3 className="productName">{product.name}</h3>

                    <p className="description">
                      {product.description || "ไม่มีรายละเอียดสินค้า"}
                    </p>

                    <div className="price">
                      {Number(product.price).toLocaleString("th-TH")} บาท
                      / {product.unit}
                    </div>

                    <p>
                      คงเหลือ: {product.quantity} {product.unit}
                    </p>

                    <p className="status">
                      สถานะ: {
                        product.status === "available"
                          ? "พร้อมขาย"
                          : product.status === "sold_out"
                            ? "สินค้าหมด"
                            : "ปิดการขาย"
                      }
                    </p>


                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
