import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "ปลูกรัก - ตลาดผลผลิตชุมชน",
  description: "ตลาดผลผลิตเกษตรชุมชน ส่งตรงจากสวนถึงมือคุณ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body className="bg-[#faf8f2] text-[#143122] antialiased" style={{ fontFamily: "'Kanit', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}