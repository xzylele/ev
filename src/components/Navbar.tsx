'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, ArrowLeftRight, Calculator, LayoutDashboard, Zap, Sparkles, Newspaper } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'ค้นหารถ EV', href: '/cars', icon: Car },
    { name: 'เปรียบเทียบสเปค', href: '/compare', icon: ArrowLeftRight },
    { name: 'เครื่องคำนวณ & จำลอง', href: '/calculators', icon: Calculator },
    { name: 'แนะนำรถ EV', href: '/recommend', icon: Sparkles },
    { name: 'ข่าวสาร EV', href: '/news', icon: Newspaper },
    { name: 'ระบบแอดมิน', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <>
      {/* Top Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-ev-border bg-ev-dark/85 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-green text-ev-dark transition-all duration-300 group-hover:scale-105 border border-ev-border">
                  <Zap className="h-5 w-5 fill-current" />
                </div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  EV <span className="text-electric-green">THAI</span>
                </span>
              </Link>
            </div>

            {/* Navigation Links (Desktop) */}
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-electric-green/10 text-electric-green border border-electric-green/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Sticky Bottom Tab Bar (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ev-border bg-ev-dark/95 backdrop-blur-md md:hidden pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))]">
        <div className="flex justify-around items-center px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-300 border ${
                  isActive
                    ? 'bg-electric-green/10 text-electric-green border-electric-green/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border-transparent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 whitespace-nowrap font-medium tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
