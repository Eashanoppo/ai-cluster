import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClustroConnect — Autonomous AI Cluster Management Platform",
  description: "Next-Gen Autonomous Infrastructure & Distributed AI Workload Execution Showcase for DIU National Hackathon 2026",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#eceff4] text-[#2e3440] antialiased selection:bg-[#5e81ac] selection:text-white">
        {children}
      </body>
    </html>
  );
}
