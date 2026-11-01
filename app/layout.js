import "./globals.css";

export const metadata = {
  title: "ปลูกรัก | ตลาดผลผลิตจากชุมชน",
  description: "เชื่อมโยงเกษตรกรไทยกับผู้บริโภคโดยตรง"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
