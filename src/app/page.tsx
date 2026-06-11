import React from 'react';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';
import { Zap, Search, ArrowLeftRight, Calculator, Star, ArrowRight } from 'lucide-react';

// Fetch featured cars directly from DB (Server Component)
async function getFeaturedCars() {
  try {
    await dbConnect();
    // Fetch 3 popular cars for homepage
    return await EV.find({ 
      model: { $in: ['Model Y', 'Atto 3', 'S07'] } 
    }).limit(3);
  } catch (error) {
    console.error('Error fetching featured cars:', error);
    return [];
  }
}

export default async function Home() {
  const featuredCars = await getFeaturedCars();

  const features = [
    {
      title: 'ฐานข้อมูลสเปคละเอียด',
      description: 'รวบรวมมิติตัวถัง สมรรถนะ ความจุแบตเตอรี่ หัวชาร์จ AC/DC แรงดันระบบ และฟังก์ชัน V2L ครบถ้วน',
      icon: Zap,
      color: 'text-electric-green bg-electric-green/10',
    },
    {
      title: 'ตัวกรองขั้นสูง',
      description: 'กรองตามงบประมาณ ระยะทางที่วิ่งได้จริง ประเภทตัวถัง ระบบขับเคลื่อน และความสามารถชาร์จเร็ว',
      icon: Search,
      color: 'text-electric-blue bg-electric-blue/10',
    },
    {
      title: 'เปรียบเทียบเจาะลึก',
      description: 'เปรียบเทียบสเปคเคียงข้างกันได้ 2-4 รุ่นพร้อมกัน ไฮไลท์จุดต่างหรือซ่อนส่วนที่เหมือนกันได้ง่ายดาย',
      icon: ArrowLeftRight,
      color: 'text-amber-400 bg-amber-400/10',
    },
    {
      title: 'เครื่องคำนวณอัจฉริยะ',
      description: 'คำนวณเปรียบเทียบค่าไฟฟ้าบ้าน TOU กับน้ำมัน หรือจำลองเวลาชาร์จจริงตามสปีดตู้ชาร์จ',
      icon: Calculator,
      color: 'text-purple-400 bg-purple-400/10',
    },
  ];

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {/* Background glow effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-electric-green to-electric-blue opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72rem]" />
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-electric-green/30 bg-electric-green/10 px-4 py-1.5 text-xs font-semibold text-electric-green mb-6 animate-pulse">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>อัปเดตสเปครถ EV ไทยล่าสุด ปี 2026</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            เลือกและเปรียบเทียบ <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-electric-green to-electric-blue bg-clip-text text-transparent">รถยนต์ไฟฟ้า (EV)</span> อย่างโปร
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            ระบบเปรียบเทียบสเปครถ EV เจาะลึกแห่งเดียวในไทยที่มีระบบจำลองเวลาชาร์จ คำนวณความประหยัดรายเดือนเปรียบเทียบน้ำมัน และระบบรีวิววิเคราะห์จุดเด่นจุดด้อยจากผู้ใช้จริง
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/cars"
              className="rounded-xl bg-gradient-to-r from-electric-green to-electric-blue px-6 py-3.5 text-sm font-semibold text-ev-dark shadow-lg hover:opacity-90 transition-all duration-300 transform hover:-translate-y-0.5 glow-green"
            >
              ค้นหารถยนต์ไฟฟ้า
            </Link>
            <Link
              href="/compare"
              className="text-sm font-semibold leading-6 text-slate-300 hover:text-white flex items-center space-x-1 group"
            >
              <span>เปรียบเทียบสเปค</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32 lg:mt-40">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col rounded-2xl border border-ev-border bg-ev-card/50 p-6 transition-all duration-300 hover:border-slate-700 hover:translate-y-[-4px]"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-5`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-md font-bold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed flex-grow">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured Cars Section */}
        {featuredCars.length > 0 && (
          <div className="mt-24 sm:mt-32">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">รถยนต์ไฟฟ้าแนะนำ</h2>
                <p className="mt-2 text-sm text-slate-400">รุ่นเด่นยอดนิยมที่ได้รับการค้นหาและเปรียบเทียบสูงสุด</p>
              </div>
              <Link
                href="/cars"
                className="text-sm font-semibold text-electric-green hover:underline flex items-center gap-1 group"
              >
                ดูรถทั้งหมด ({featuredCars.length}+ รุ่น)
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCars.map((car: any) => (
                <div
                  key={car._id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-ev-border bg-ev-card transition-all duration-300 hover:scale-[1.02] hover:border-slate-700 glow-blue"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute top-4 right-4 rounded-lg bg-ev-dark/80 px-2.5 py-1 text-xs font-semibold border border-ev-border text-electric-green">
                      {car.bodyType}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="flex flex-col p-6 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{car.brand}</span>
                      <div className="flex items-center text-amber-400 text-xs font-semibold">
                        <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                        <span>4.8</span>
                      </div>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white leading-tight">
                      {car.model} <span className="text-xs text-slate-400 font-normal">{car.trim}</span>
                    </h3>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-3 gap-2 border-y border-ev-border/50 py-4 my-4 text-center">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase">ราคาเริ่มต้น</span>
                        <span className="text-sm font-bold text-white text-xs">
                          {`${new Intl.NumberFormat('th-TH').format(car.price)} ฿`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase">ระยะทาง (NEDC/WLTP)</span>
                        <span className="text-sm font-bold text-electric-green">
                          {car.rangeWLTP || car.rangeNEDC || car.rangeCLTC} กม.
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase">อัตราเร่ง 0-100</span>
                        <span className="text-sm font-bold text-electric-blue">{car.acceleration0To100} วินาที</span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4">
                      <Link
                        href={`/cars/${car._id}`}
                        className="flex-grow text-center rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all duration-300"
                      >
                        สเปคโดยละเอียด
                      </Link>
                      <Link
                        href="/compare"
                        className="p-2.5 rounded-xl border border-ev-border text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-300"
                        title="เปรียบเทียบ"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
