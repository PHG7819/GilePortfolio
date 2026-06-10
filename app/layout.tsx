import type { Metadata } from "next";
import "./globals.css";
import { AdminProvider } from "@/components/admin/AdminProvider";

export const metadata: Metadata = {
  title: "gile.devlog",
  description: "gile.devlog — 포트폴리오",
  icons: { icon: "/tistory-logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}
