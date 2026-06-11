'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, ArrowLeftRight, Calculator, LayoutDashboard, Zap } from 'lucide-react';

const Navbar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'ค้นหารถ EV', href: '/cars', icon: Car },
    { name: 'เปรียบเทียบสเปค', href: '/compare', icon: ArrowLeftRight },
    { name: 'เครื่องคำนวณ & จำลอง', href: '/calculators', icon: Calculator },
    { name: 'ระบบแอดมิน', href: '/admin', icon: LayoutDashboard },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-ev-border bg-ev-dark/85 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-electric-green to-electric-blue text-ev-dark transition-all duration-300 group-hover:scale-110 glow-green">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-electric-green bg-clip-text text-transparent">
                EV <span className="text-electric-green">COMPARE</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
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
                      ? 'bg-gradient-to-r from-electric-green/15 to-electric-blue/15 text-electric-green border border-electric-green/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile navigation button (renders icons only or standard small layout) */}
          <div className="flex md:hidden space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.name}
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-electric-green/15 text-electric-green border border-electric-green/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
