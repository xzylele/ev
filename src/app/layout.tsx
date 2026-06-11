import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Zap } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EV Compare Thailand | ระบบเปรียบเทียบรถยนต์ไฟฟ้า ค้นหาสเปค และคำนวณความประหยัด',
  description: 'เปรียบเทียบรถยนต์ไฟฟ้า EV ทุกยี่ห้อในไทย ค้นหาตัวเลือกในงบประมาณของคุณ พร้อมระบบคำนวณค่าไฟฟ้า เครื่องจำลองเวลาชาร์จไฟ และรีวิวจากผู้ใช้จริง',
  keywords: ['รถยนต์ไฟฟ้า', 'เปรียบเทียบ EV', 'สเปครถ EV', 'คำนวณค่าชาร์จ EV', 'BYD', 'Tesla', 'MG', 'Deepal', 'GAC', 'รีวิวรถ EV'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-ev-dark text-slate-100 font-sans selection:bg-electric-green selection:text-ev-dark">
        {/* Header */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-grow w-full pb-20 md:pb-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-ev-border bg-ev-dark/50 py-8 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-green text-ev-dark border border-ev-border">
                  <Zap className="h-4 w-4 fill-current" />
                </div>
                <span className="text-md font-bold tracking-tight text-white">
                  EV <span className="text-electric-green">THAI</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} EV Compare Thailand.
              </p>
              <div className="flex space-x-4 text-xs text-slate-400">
                <span className="hover:text-electric-green cursor-pointer transition-colors duration-200">ข้อกำหนดการใช้งาน</span>
                <span className="hover:text-electric-green cursor-pointer transition-colors duration-200">นโยบายความเป็นส่วนตัว</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
