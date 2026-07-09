import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TOTAL_QUESTIONS } from "@/lib/mbti";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_NAME = "Visionary Analyst";
const TITLE = "투자 MBTI - 나의 투자 성향 진단";
const DESCRIPTION = `${TOTAL_QUESTIONS}개 문항으로 진단하는 나의 투자 MBTI 성향과 맞춤형 자산 배분 제안`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
