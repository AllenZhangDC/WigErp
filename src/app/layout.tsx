import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "Wig ERP — 假发进销存系统",
  description: "基于 Next.js + Prisma 的专业假发行业 ERP 系统",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark scroll-smooth">
      <body className="antialiased bg-slate-950 text-slate-200">
        <div className="flex min-h-screen relative">
          <Sidebar />

          <main className="main-content flex flex-col min-w-0">
            <div className="flex-1 w-full max-w-[1600px] mx-auto">
              {children}
            </div>

            <footer className="py-10 px-6 border-t border-slate-900 bg-slate-950/50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-widest">
                <p>© 2026 WigERP Systems Inc.</p>
                <div className="flex gap-6">
                  <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
                  <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
                  <a href="#" className="hover:text-indigo-400 transition-colors">Status</a>
                </div>
              </div>
            </footer>
          </main>

          <MobileNav />
        </div>
      </body>
    </html>
  );
}
