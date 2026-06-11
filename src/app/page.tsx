import React from 'react';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';
import Review from '@/models/review';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import { Zap, Search, ArrowLeftRight, Calculator, Star, ArrowRight, BatteryCharging, Gauge } from 'lucide-react';

// Fetch featured cars directly from DB (Server Component)
async function getFeaturedCars() {
  try {
    await dbConnect();
    // Fetch 3 popular cars for homepage
    const cars = await EV.find({
      model: { $in: ['Model Y', 'Atto 3', 'S07'] }
    }).limit(3).lean();

    // Batch fetch all approved reviews for the featured cars in one query
    const carIds = cars.map((car: any) => car._id);
    const allReviews = await Review.find({ evId: { $in: carIds }, approved: true }).lean();

    // Group reviews by evId in-memory
    const reviewsMap: { [key: string]: any[] } = {};
    allReviews.forEach((review: any) => {
      const evIdStr = review.evId.toString();
      if (!reviewsMap[evIdStr]) {
        reviewsMap[evIdStr] = [];
      }
      reviewsMap[evIdStr].push(review);
    });

    // Compute ratings and map results
    const carsWithRatings = cars.map((car: any) => {
      const carIdStr = car._id.toString();
      const carReviews = reviewsMap[carIdStr] || [];
      if (carReviews.length > 0) {
        const avgRating = carReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / carReviews.length;
        return {
          ...car,
          _id: carIdStr,
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: carReviews.length
        };
      }
      return {
        ...car,
        _id: carIdStr,
        avgRating: null,
        reviewCount: 0
      };
    });
    return carsWithRatings;
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
      description: (
        <span>
          รวบรวมมิติตัวถัง สมรรถนะ ความจุแบตเตอรี่ หัวชาร์จ{' '}
          <abbr className="underline decoration-dotted cursor-help text-slate-200" title="AC (กระแสสลับ - ชาร์จปกติ) / DC (กระแสตรง - ชาร์จเร็ว)">
            AC/DC
          </abbr>{' '}
          แรงดันระบบ และฟังก์ชัน{' '}
          <abbr className="underline decoration-dotted cursor-help text-slate-200" title="Vehicle-to-Load: ระบบจ่ายกระแสไฟฟ้าจากตัวรถออกไปสู่อุปกรณ์ภายนอก">
            V2L
          </abbr>{' '}
          ครบถ้วน
        </span>
      ),
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
      description: (
        <span>
          คำนวณเปรียบเทียบค่าไฟฟ้าบ้าน{' '}
          <abbr className="underline decoration-dotted cursor-help text-slate-200" title="Time of Use: อัตราค่าไฟฟ้าชั่วโมงประหยัด โดยราคาจะถูกลงพิเศษในช่วงเวลากลางคืนหรือวันหยุด (Off-Peak)">
            TOU
          </abbr>{' '}
          กับน้ำมัน หรือจำลองเวลาชาร์จจริงตามสปีดตู้ชาร์จ
        </span>
      ),
      icon: Calculator,
      color: 'text-purple-400 bg-purple-400/10',
    },
  ];

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      <KeyboardShortcuts />
      {/* Background glow effects removed for Flat & Bordered system */}

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-electric-green/30 bg-electric-green/10 px-4 py-1.5 text-xs font-semibold text-electric-green mb-6">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>อัปเดตสเปครถ EV ไทยล่าสุด ปี 2026</span>
          </div>
          <h1 className="text-5xl font-black tracking-[-0.03em] text-white sm:text-7xl leading-tight sm:leading-none text-balance">
            เลือกและเปรียบเทียบ <br className="hidden sm:inline" />
            <span className="text-electric-green">รถยนต์EV</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400 tracking-[0.015em] max-w-[65ch] mx-auto">
            ระบบเปรียบเทียบสเปครถ EV เจาะลึกแห่งเดียวในไทยที่มีระบบจำลองเวลาชาร์จ คำนวณความประหยัดรายเดือนเปรียบเทียบน้ำมัน และระบบรีวิววิเคราะห์จุดเด่นจุดด้อยจากผู้ใช้จริง
          </p>
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-x-6">
              <Link
                href="/cars"
                className="rounded-xl bg-electric-green border border-ev-border px-6 py-3.5 text-sm font-semibold text-ev-dark hover:bg-electric-green/90 transition-all duration-300"
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

            {/* Keyboard shortcut hint */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono select-none mt-2">
              <span>ทางลัดคีย์บอร์ด:</span>
              <kbd className="px-1.5 py-0.5 bg-ev-card border border-ev-border rounded text-slate-400">S</kbd>
              <span>ค้นหารถ</span>
              <span className="text-slate-600">|</span>
              <kbd className="px-1.5 py-0.5 bg-ev-card border border-ev-border rounded text-slate-400">C</kbd>
              <span>เปรียบเทียบ</span>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (Asymmetric Bento Layout) */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32 lg:mt-40">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const colSpanClass =
                idx === 0 ? 'sm:col-span-2 lg:col-span-2' :
                  idx === 1 ? 'sm:col-span-1 lg:col-span-1' :
                    idx === 2 ? 'sm:col-span-1 lg:col-span-1' :
                      'sm:col-span-2 lg:col-span-2'; // idx === 3

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between rounded-xl border border-ev-border bg-ev-card/50 p-6 transition-all duration-300 hover:border-slate-600 group/card ${colSpanClass}`}
                >
                  <div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} mb-5 transition-transform duration-300 group-hover/card:scale-105`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-md font-bold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm text-slate-400 leading-relaxed tracking-[0.01em]">{feature.description}</p>
                  </div>

                  {/* Custom Coded Mock UI Indicators for Bento Grid */}
                  {idx === 0 && (
                    <div className="my-4 rounded-lg border border-ev-border bg-ev-dark/40 p-3 font-mono text-[11px] space-y-1.5">
                      <div className="flex justify-between"><span className="text-slate-400">ความจุแบตเตอรี่:</span><span className="text-white font-bold">82.0 kWh</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">กำลังชาร์จ DC (สูงสุด):</span><span className="text-electric-blue font-bold">250 kW</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">สถาปัตยกรรมแรงดันไฟฟ้า:</span><span className="text-amber-400 font-bold">800V Supercharge</span></div>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className="my-4 rounded-lg border border-ev-border bg-ev-dark/40 p-3 space-y-2">
                      <div className="flex justify-between text-[11px] font-semibold"><span className="text-slate-400">งบประมาณสูงสุด:</span><span className="text-electric-green">1.50 ล้านบาท</span></div>
                      <div className="w-full h-1 bg-slate-800 rounded-full relative">
                        <div className="absolute left-0 top-0 bottom-0 bg-electric-green rounded-full w-2/3" />
                        <div className="absolute left-2/3 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-white border border-electric-green" />
                      </div>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className="my-4 rounded-lg border border-ev-border bg-ev-dark/40 p-3 space-y-2 text-[11px]">
                      <div className="flex justify-between border-b border-ev-border/40 pb-1 font-bold text-white">
                        <span>สเปครถยนต์</span>
                        <span>Atto 3</span>
                        <span>Model Y</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>ระยะทางวิ่ง</span>
                        <span className="text-slate-300">410 กม.</span>
                        <span className="text-electric-green font-bold">533 กม.</span>
                      </div>
                    </div>
                  )}

                  {idx === 3 && (
                    <div className="my-4 rounded-lg border border-ev-border bg-ev-dark/40 p-3 space-y-2 text-[11px]">
                      <div className="flex justify-between text-slate-400"><span>เปรียบเทียบค่าพลังงานรายเดือน:</span></div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">น้ำมัน (Petrol)</span>
                          <span className="text-red-400 font-semibold">4,800 ฿</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-red-400 h-full w-full" />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">ชาร์จ EV (ไฟบ้าน TOU)</span>
                          <span className="text-electric-green font-bold">980 ฿</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="bg-electric-green h-full w-[20%]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Spec tags inside Bento cards */}
                  {idx === 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-ev-border/40 select-none">
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">มิติตัวถัง</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">แบตเตอรี่ LFP / NMC</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ระบบขับ RWD / AWD</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">หัวชาร์จ AC / DC</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ฟังก์ชัน V2L</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ระบบ ADAS</span>
                    </div>
                  )}

                  {idx === 1 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-ev-border/40 select-none">
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">งบประมาณ</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ระยะทางวิ่ง</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ตัวถัง & ขับเคลื่อน</span>
                    </div>
                  )}

                  {idx === 2 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-ev-border/40 select-none">
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">เปรียบเทียบ 2-4 รุ่น</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ไฮไลท์จุดต่าง</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">ซ่อนสเปคที่เหมือนกัน</span>
                    </div>
                  )}

                  {idx === 3 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-ev-border/40 select-none">
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">เปรียบเทียบค่าไฟ TOU vs น้ำมัน</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">คำนวณจุดคุ้มทุนรายเดือน</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">จำลอง DC Charge Speed</span>
                      <span className="text-[10px] font-semibold tracking-wider uppercase bg-ev-dark border border-ev-border px-2 py-0.5 rounded text-slate-400">จำลองระยะเวลาชาร์จจริง</span>
                    </div>
                  )}
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
                <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white sm:text-3xl leading-tight">รถยนต์ไฟฟ้าแนะนำ</h2>
                <p className="mt-2 text-sm text-slate-400 tracking-[0.01em]">รุ่นเด่นยอดนิยมที่ได้รับการค้นหาและเปรียบเทียบสูงสุด</p>
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
                  className="group/card flex flex-col overflow-hidden rounded-xl border border-ev-border bg-ev-card transition-all duration-300 hover:border-slate-600"
                >
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                    />
                    <div className="absolute top-4 right-4 rounded-lg bg-ev-dark/80 px-2.5 py-1 text-xs font-semibold border border-ev-border text-electric-green">
                      {car.bodyType}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="flex flex-col p-6 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{car.brand}</span>
                      {car.avgRating !== null ? (
                        <div className="flex items-center text-amber-400 text-xs font-semibold" title={`เรตติ้งเฉลี่ยจาก ${car.reviewCount} รีวิว`}>
                          <Star className="h-3.5 w-3.5 fill-current mr-0.5" />
                          <span>{car.avgRating} ({car.reviewCount})</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-slate-400 text-xs font-semibold" title="ยังไม่มีรีวิวสำหรับรถรุ่นนี้">
                          <Star className="h-3.5 w-3.5 mr-0.5" />
                          <span>ไม่มีรีวิว</span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white leading-tight">
                      {car.model}
                    </h3>

                    <div className="flex items-baseline justify-between mt-1.5 mb-1 gap-2">
                      <span className="text-xs text-slate-400">
                        {car.trim}
                      </span>
                      <span className="text-xs font-extrabold text-electric-green text-right">
                        {`${new Intl.NumberFormat('th-TH').format(car.price)} ฿`}
                      </span>
                    </div>

                    {/* Quick Specs */}
                    <div className="grid grid-cols-3 gap-2 border-y border-ev-border/50 py-3 my-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-slate-400 mb-1" />
                        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">พละกำลัง</span>
                        <span className="text-xs font-bold text-white leading-tight">
                          {car.horsepower} HP
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <Gauge className="h-3.5 w-3.5 text-electric-green mb-1" />
                        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">ระยะทาง</span>
                        <span className="text-xs font-bold text-electric-green">
                          {car.rangeWLTP || car.rangeNEDC || car.rangeCLTC} กม.
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <BatteryCharging className="h-3.5 w-3.5 text-electric-blue mb-1" />
                        <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">อัตราเร่ง</span>
                        <span className="text-xs font-bold text-electric-blue">
                          {car.acceleration0To100} วินาที
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4">
                      <Link
                        href={`/cars/${car._id}`}
                        className="flex-grow text-center rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
                      >
                        สเปคโดยละเอียด
                      </Link>
                      <Link
                        href="/compare"
                        className="p-2.5 rounded-xl border border-ev-border text-slate-400 hover:text-white hover:border-slate-700 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
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

        {/* Glossary & FAQ Section */}
        <div className="mt-24 sm:mt-32 border-t border-ev-border pt-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-white mb-2 text-center sm:text-left leading-tight">
              คำถามที่พบบ่อย ?
            </h2>
            <p className="text-sm text-slate-400 mb-10 text-center sm:text-left tracking-[0.01em] max-w-[65ch]">
              ทำความเข้าใจข้อมูลเทคนิคพื้นฐานและมาตรฐานการทำงานเพื่อประกอบการตัดสินใจซื้อรถ EV ได้อย่างมั่นใจ
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FAQ Item 1 */}
              <div className="p-6 bg-ev-card border border-ev-border rounded-xl hover:border-slate-600 transition-all duration-300">
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 leading-snug">
                  <span className="text-electric-green text-xs font-mono font-bold">[01]</span>
                  มาตรฐาน WLTP กับ NEDC คืออะไรและต่างกันอย่างไร?
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed tracking-[0.01em]">
                  เป็นมาตรฐานการทดสอบระยะวิ่งของรถไฟฟ้าต่อการชาร์จเต็ม 1 ครั้ง โดย <strong>WLTP (Worldwide Harmonised Light Vehicles Test Procedure)</strong> เป็นมาตรฐานสากลใหม่ที่มีความใกล้เคียงการวิ่งจริงในชีวิตประจำวันมากกว่า <strong>NEDC (New European Driving Cycle)</strong> ซึ่งเป็นแบบจำลองในห้องแล็บที่ทำระยะได้เกินจริงราว 20-30%
                </p>
              </div>

              {/* FAQ Item 2 */}
              <div className="p-6 bg-ev-card border border-ev-border rounded-xl hover:border-slate-600 transition-all duration-300">
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 leading-snug">
                  <span className="text-electric-green text-xs font-mono font-bold">[02]</span>
                  การชาร์จแบบ AC กับ DC ต่างกันอย่างไร?
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed tracking-[0.01em]">
                  <strong>AC (Alternating Current)</strong> คือการชาร์จแบบกระแสสลับความเร็วต่ำ เหมาะสำหรับชาร์จทิ้งไว้ข้ามคืนที่บ้าน ส่วน <strong>DC (Direct Current)</strong> คือการชาร์จกระแสตรงความเร็วสูงตามสถานีบริการ ดันกระแสไฟเข้าแบตเตอรี่โดยตรง เหมาะสำหรับการเดินทางไกลที่ต้องทำเวลา
                </p>
              </div>

              {/* FAQ Item 3 */}
              <div className="p-6 bg-ev-card border border-ev-border rounded-xl hover:border-slate-600 transition-all duration-300">
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 leading-snug">
                  <span className="text-electric-green text-xs font-mono font-bold">[03]</span>
                  ระบบ V2L ในรถ EV มีประโยชน์อย่างไร?
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed tracking-[0.01em]">
                  <strong>V2L (Vehicle-to-Load)</strong> คือเทคโนโลยีจ่ายไฟกระแสสลับออกจากช่องชาร์จของตัวรถไปยังเครื่องใช้ไฟฟ้าภายนอก (เช่น พัดลม, ตู้เย็นพกพา, เตาไฟฟ้า หรือชาร์จคอมพิวเตอร์) เปลี่ยนให้รถ EV เป็นเสมือน Powerbank เคลื่อนที่ขนาดใหญ่ เหมาะกับการแคมป์ปิ้งหรือกรณีไฟดับ
                </p>
              </div>

              {/* FAQ Item 4 */}
              <div className="p-6 bg-ev-card border border-ev-border rounded-xl hover:border-slate-600 transition-all duration-300">
                <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2 leading-snug">
                  <span className="text-electric-green text-xs font-mono font-bold">[04]</span>
                  ค่าไฟ TOU เหมาะกับผู้ใช้รถ EV อย่างไร?
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed tracking-[0.01em]">
                  <strong>TOU (Time of Use Tariff)</strong> เป็นอัตราค่าไฟฟ้าที่คิดราคาต่างกันตามวันและเวลา โดยจะมีช่วงราคาถูกพิเศษ (Off-Peak) คือหลัง 22.00 น. ถึง 9.00 น. ของวันธรรมดา และตลอดทั้งวันของเสาร์-อาทิตย์ ช่วยลดราคาค่าไฟฟ้าในการชาร์จแบตรถลงเหลือเพียงหน่วยละประมาณ 2.6 - 2.9 บาท ประหยัดกว่าน้ำมันถึง 4-5 เท่า
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
