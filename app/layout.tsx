import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "안단테 (Andante) | AI 감성 힐링 캔버스",
  description: "당신의 마음을 느리게 다듬는 AI 감성 힐링 공간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased theme-transition min-h-screen">
        {children}
      </body>
    </html>
  );
}
