import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Sidebar } from "../components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecoverAI Dashboard",
  description: "AI Revenue Recovery Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FAFAFA] flex h-screen overflow-hidden text-gray-900`}>
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 pt-10">
          {children}
        </main>
      </body>
    </html>
  );
}
