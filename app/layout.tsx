import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://almistudy.almiworld.com"),
  title: {
    // Homepage uses this default verbatim (no template) — it self-brands.
    default: "Accredited Universities, Verified by Country — AlmiStudy",
    template: "%s · AlmiStudy"
  },
  description:
    "6,300+ universities across 190+ countries, every one checked against a recognized national accrediting body. No pay-to-list — just verified institutions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFFBF5"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-cream text-plum antialiased min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
