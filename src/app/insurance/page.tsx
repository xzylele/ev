'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Info, Car, Plus, Sparkles, Check, ChevronDown, ShieldAlert, Zap, Truck, AlertTriangle } from 'lucide-react';

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  price: number;
  image: string;
  batteryCapacity: number;
  batteryType: string;
}

interface InsuranceProvider {
  id: string;
  name: string;
  logo: string;
  baseRate: number; // percentage of car price
  batteryCoverage: string; // e.g. "100% ไม่หักค่าเสื่อม", "80% ตามอายุการใช้งาน"
  batteryLimitDesc: string;
  deductible: number;
  roadsideAssistance: string;
  towDistance: string;
  garageType: 'ซ่อมห้าง' | 'ซ่อมอู่';
  extraFeatures: string[];
}

const INSURERS: InsuranceProvider[] = [
  {
    id: 'viriya',
    name: 'วิริยะประกันภัย (EV Plus)',
    logo: '🛡️',
    baseRate: 0.021, // 2.1%
    batteryCoverage: '100% คุ้มครองเต็มมูลค่า',
    batteryLimitDesc: 'เปลี่ยนแบตเตอรี่ใหม่ 100% ในปีแรก และไม่มีหักค่าเสื่อมสภาพเมื่อเสียหายสิ้นเชิง',
    deductible: 0,
    roadsideAssistance: 'รถสไลด์ฉุกเฉิน (Flatbed Only) ตลอด 24 ชม.',
    towDistance: 'ฟรีระยะ 100 กม. แรก',
    garageType: 'ซ่อมห้าง',
    extraFeatures: ['คุ้มครองเครื่องชาร์จ Wallbox สูงสุด 50,000 บาท', 'เยียวยาค่าเดินทาง 2,000 บาท/ครั้ง', 'ชดเชยค่าไฟชาร์จฉุกเฉิน']
  },
  {
    id: 'bangkok',
    name: 'กรุงเทพประกันภัย (EV Care)',
    logo: '💎',
    baseRate: 0.018, // 1.8%
    batteryCoverage: '90% ของราคาเปลี่ยนใหม่',
    batteryLimitDesc: 'รับผิดชอบค่าเปลี่ยนแบตเตอรี่ 90% ส่วนต่าง 10% เจ้าของรถร่วมรับผิดชอบ (Co-payment)',
    deductible: 3000,
    roadsideAssistance: 'รถสไลด์ฉุกเฉิน (Flatbed Only) ตลอด 24 ชม.',
    towDistance: 'ฟรีระยะ 50 กม. แรก',
    garageType: 'ซ่อมห้าง',
    extraFeatures: ['คุ้มครองสายชาร์จพกพาสูงสุด 10,000 บาท', 'คุ้มครองบุคคลภายนอกสะดุดล้มสายชาร์จ', 'ไม่มีค่าเสียหายส่วนแรกกรณีชนกับยานพาหนะทางบก']
  },
  {
    id: 'thanachart',
    name: 'ธนชาตประกันภัย (EV Save Lite)',
    logo: '⚡',
    baseRate: 0.014, // 1.4%
    batteryCoverage: 'ลดหลั่นตามปี (Depreciated Scale)',
    batteryLimitDesc: 'คุ้มครองแบตเตอรี่หักค่าเสื่อมปีละ 10% (ปีที่ 1: 100%, ปีที่ 2: 90% ... ขั้นต่ำสุด 60%)',
    deductible: 5000,
    roadsideAssistance: 'บริการรถยกสไลด์กรณีแบตเตอรี่หมดกลางทาง',
    towDistance: 'ฟรีระยะ 30 กม. แรก',
    garageType: 'ซ่อมอู่',
    extraFeatures: ['เบี้ยประหยัดพิเศษสำหรับขับดี', 'ซ่อมอู่มาตรฐานในเครือกว่า 400 แห่ง', 'คุ้มครองความเสียหายจากไฟไหม้แบตเตอรี่']
  }
];

export default function InsuranceAggregatorPage() {
  const [allCars, setAllCars] = useState<CarSpec[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarSpec | null>(null);
  const [carPickerSearch, setCarPickerSearch] = useState('');
  const [carPickerOpen, setCarPickerOpen] = useState(false);

  // Form State
  const [driverDesignation, setDriverDesignation] = useState(false);
  const [driverAge, setDriverAge] = useState<number>(35);
  const [ncbDiscount, setNcbDiscount] = useState<number>(0); // 0%, 20%, 30%, 40%, 50%
  const [isOwnerDriver, setIsOwnerDriver] = useState(true);

  useEffect(() => {
    fetch('/api/cms/cars')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllCars(data);
          // Set initial default selection if available
          if (data.length > 0) {
            setSelectedCar(data[0]);
          }
        }
      })
      .catch(err => console.error('Failed to load cars:', err));
  }, []);

  const handlePickCar = (car: CarSpec) => {
    setSelectedCar(car);
    setCarPickerOpen(false);
    setCarPickerSearch('');
  };

  const filteredCars = allCars.filter(c =>
    `${c.brand} ${c.model} ${c.trim}`.toLowerCase().includes(carPickerSearch.toLowerCase())
  );

  const groupedCars = filteredCars.reduce((acc, car) => {
    if (!acc[car.brand]) acc[car.brand] = [];
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarSpec[]>);

  // Get driver age discount percentage (OIC rules in Thailand)
  const getDriverAgeDiscount = (age: number) => {
    if (!driverDesignation) return 0;
    if (age >= 18 && age <= 24) return 5;
    if (age >= 25 && age <= 35) return 10;
    if (age >= 36 && age <= 50) return 15;
    if (age > 50) return 20;
    return 0;
  };

  const driverDiscount = getDriverAgeDiscount(driverAge);

  // Dynamic premium calculator function
  const calculatePremium = (insurer: InsuranceProvider) => {
    if (!selectedCar) return { netPremium: 0, basePremium: 0, discountAmount: 0 };

    const basePremium = selectedCar.price * insurer.baseRate;
    
    // Apply discounts multiplicatively to respect OIC insurance rules
    // Driver discount is deducted, NCB discount is deducted
    let multiplier = 1;
    
    if (driverDesignation) {
      multiplier *= (1 - (driverDiscount / 100));
    }
    
    if (ncbDiscount > 0) {
      multiplier *= (1 - (ncbDiscount / 100));
    }

    const netPremium = Math.round(basePremium * multiplier);
    const discountAmount = Math.round(basePremium - netPremium);

    return {
      basePremium: Math.round(basePremium),
      netPremium,
      discountAmount
    };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-electric-green/10 text-electric-green rounded">
            <ShieldCheck className="h-5 w-5 fill-current" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
            เปรียบเทียบและเช็คเบี้ยประกันภัย EV (Aggregator)
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">คำนวณเบี้ยประกันภัยรถยนต์ไฟฟ้าชั้น 1 ตามจริง พร้อมวิเคราะห์เงื่อนไขความคุ้มครองแบตเตอรี่ คปภ. ล่าสุด</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Inputs Form */}
        <div className="lg:col-span-4 rounded-xl border border-ev-border bg-ev-card/20 p-6 space-y-6">
          <h2 className="text-sm font-bold text-white border-b border-ev-border/50 pb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Car className="h-4 w-4 text-electric-blue" />
            <span>ระบุข้อมูลตัวรถและผู้ขับขี่</span>
          </h2>

          {/* Car Model Selector */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">เลือกรุ่นรถยนต์ไฟฟ้า *</label>
            <button
              type="button"
              id="car-model-select-btn"
              onClick={() => setCarPickerOpen(prev => !prev)}
              className="w-full flex items-center justify-between rounded-lg border border-ev-border bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:border-slate-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Car className="h-4 w-4 text-slate-400" />
                {selectedCar
                  ? `${selectedCar.brand} ${selectedCar.model} (${selectedCar.trim})`
                  : 'เลือกรุ่นรถ...'}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${carPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {carPickerOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-ev-border bg-slate-950 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-ev-border/40">
                  <input
                    autoFocus
                    type="text"
                    id="car-search-input"
                    placeholder="พิมพ์ค้นหายี่ห้อ / รุ่น..."
                    value={carPickerSearch}
                    onChange={e => setCarPickerSearch(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-600"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {Object.keys(groupedCars).length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">ไม่พบรุ่นรถ</div>
                  ) : (
                    Object.entries(groupedCars).map(([brand, brandCars]) => (
                      <div key={brand}>
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-900/60 sticky top-0">{brand}</div>
                        {brandCars.map(car => (
                          <button
                            key={car._id}
                            type="button"
                            onClick={() => handlePickCar(car)}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition-colors border-b border-ev-border/10 last:border-0"
                          >
                            <span className="font-bold text-white">{car.model}</span>
                            <span className="ml-2 text-[10px] text-electric-green">{car.trim}</span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">ราคาตลาด: {new Intl.NumberFormat('th-TH').format(car.price)} ฿</span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Display Car Price Banner */}
          {selectedCar && (
            <div className="p-3 bg-slate-900/40 border border-ev-border rounded-lg text-xs font-semibold space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">ราคารถตั้งต้นสำหรับคำนวณ:</span>
                <span className="text-white font-bold">{new Intl.NumberFormat('th-TH').format(selectedCar.price)} ฿</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ขนาดแบตเตอรี่:</span>
                <span className="text-slate-400">{selectedCar.batteryCapacity} kWh ({selectedCar.batteryType})</span>
              </div>
            </div>
          )}

          {/* Driver Designation Block */}
          <div className="border border-ev-border/60 bg-slate-900/30 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="driver-designation-toggle" className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-electric-green" />
                <span>ระบุชื่อผู้ขับขี่ (คปภ.)</span>
              </label>
              <input
                type="checkbox"
                id="driver-designation-toggle"
                checked={driverDesignation}
                onChange={(e) => setDriverDesignation(e.target.checked)}
                className="h-4 w-4 accent-electric-green rounded cursor-pointer"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-normal font-normal">
              ระบุผู้จดขับขี่สูงสุด 2 คนเพื่อลดความเสี่ยงบริษัทประกันภัย ได้ส่วนลดเบี้ยสูงสุด 20%
            </p>

            {driverDesignation && (
              <div className="space-y-3 pt-2 border-t border-ev-border/20">
                <div>
                  <label htmlFor="driver-age-select" className="block text-[10px] font-semibold text-slate-400 mb-1.5">ระบุอายุผู้ขับขี่ที่น้อยที่สุด</label>
                  <select
                    id="driver-age-select"
                    value={driverAge}
                    onChange={(e) => setDriverAge(Number(e.target.value))}
                    className="w-full rounded-md border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-slate-700"
                  >
                    <option value={20}>18 - 24 ปี (ส่วนลด 5%)</option>
                    <option value={30}>25 - 35 ปี (ส่วนลด 10%)</option>
                    <option value={40}>36 - 50 ปี (ส่วนลด 15%)</option>
                    <option value={55}>มากกว่า 50 ปี ขึ้นไป (ส่วนลด 20%)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="owner-driver-checkbox" className="text-[10px] font-semibold text-slate-400">ผู้ขับขี่เป็นบุคคลเดียวกับชื่อเจ้าของรถ</label>
                  <input
                    type="checkbox"
                    id="owner-driver-checkbox"
                    checked={isOwnerDriver}
                    onChange={(e) => setIsOwnerDriver(e.target.checked)}
                    className="h-3.5 w-3.5 accent-electric-blue rounded cursor-pointer"
                  />
                </div>
                {!isOwnerDriver && (
                  <div className="p-2.5 rounded border border-amber-500/20 bg-amber-500/5 text-[9px] text-amber-400 flex items-start gap-1.5 leading-normal">
                    <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span><strong>คำเตือน:</strong> ตามระเบียบ คปภ. หากเกิดอุบัติเหตุแล้วผู้ขับขี่ในเหตุการณ์ไม่ใช่ชื่อที่ระบุในตารางกรมธรรม์ อาจต้องชดใช้ค่าเสียหายส่วนแรก (Deductible) สูงสุดถึง 6,000 บาท</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* No Claim Bonus Block */}
          <div className="border border-ev-border/60 bg-slate-900/30 rounded-xl p-4 space-y-3">
            <label htmlFor="ncb-select" className="block text-xs font-bold text-slate-400 uppercase">ประวัติการขับขี่ดี (No Claim Bonus)</label>
            <select
              id="ncb-select"
              value={ncbDiscount}
              onChange={(e) => setNcbDiscount(Number(e.target.value))}
              className="w-full rounded-md border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-slate-700"
            >
              <option value={0}>ไม่มีส่วนลด / ปีแรก (0%)</option>
              <option value={20}>ขับดีปีที่ 1 (ส่วนลด 20%)</option>
              <option value={30}>ขับดีปีที่ 2 (ส่วนลด 30%)</option>
              <option value={40}>ขับดีปีที่ 3 (ส่วนลด 40%)</option>
              <option value={50}>ขับดีปีที่ 4 ขึ้นไป (ส่วนลด 50%)</option>
            </select>
            <p className="text-[10px] text-slate-500 leading-normal font-normal">
              โอนประวัติจากค่ายเดิมได้สูงสุด 50% หากไม่มีเคลมฝ่ายผิดในปีที่ผ่านมา
            </p>
          </div>
        </div>

        {/* Right Side: Comparison Table Aggregator */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedCar ? (
            <div className="rounded-xl border border-dashed border-ev-border p-12 text-center text-slate-400">
              <ShieldCheck className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-sm font-semibold">กรุณาเลือกรุ่นรถยนต์ไฟฟ้าเพื่อเริ่มคำนวณเบี้ยประกัน</p>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              {/* Premium Summary Grid */}
              <div className="rounded-xl border border-ev-border bg-ev-card/10 overflow-hidden">
                <table className="w-full border-separate border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-ev-card">
                      <th className="px-6 py-4 text-xs font-extrabold uppercase text-slate-400 tracking-wider border-b border-ev-border/30 w-1/3">
                        รายละเอียดการเปรียบเทียบ
                      </th>
                      {INSURERS.map((insurer) => (
                        <th key={insurer.id} className="px-6 py-4 border-b border-r border-ev-border/20 last:border-r-0 text-center w-1/4">
                          <span className="text-2xl block mb-1">{insurer.logo}</span>
                          <span className="text-xs font-extrabold text-white block truncate">{insurer.name}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ev-border/40 font-normal">
                    {/* Calculated Net Premium */}
                    <tr className="bg-slate-900/20">
                      <td className="px-6 py-4 text-xs font-bold text-slate-300">
                        ค่าเบี้ยประกันภัยสุทธิรายปี
                      </td>
                      {INSURERS.map((insurer) => {
                        const { netPremium, basePremium, discountAmount } = calculatePremium(insurer);
                        return (
                          <td key={insurer.id} className="px-6 py-4 text-center border-r border-ev-border/20 last:border-r-0">
                            <span className="text-lg font-black text-electric-green">
                              {new Intl.NumberFormat('th-TH').format(netPremium)} ฿
                            </span>
                            {discountAmount > 0 && (
                              <span className="block text-[10px] text-slate-500 font-semibold mt-1">
                                (ประหยัดได้ {new Intl.NumberFormat('th-TH').format(discountAmount)} ฿)
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Base Premium Reference */}
                    <tr>
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        ราคาเบี้ยตั้งต้นปีแรก (ก่อนหักส่วนลด)
                      </td>
                      {INSURERS.map((insurer) => {
                        const { basePremium } = calculatePremium(insurer);
                        return (
                          <td key={insurer.id} className="px-6 py-3.5 text-center text-xs text-slate-300 font-mono border-r border-ev-border/20 last:border-r-0">
                            {new Intl.NumberFormat('th-TH').format(basePremium)} ฿
                          </td>
                        );
                      })}
                    </tr>

                    {/* Battery Coverage */}
                    <tr className="bg-slate-900/10">
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        การคุ้มครองแบตเตอรี่ (คปภ.)
                      </td>
                      {INSURERS.map((insurer) => (
                        <td key={insurer.id} className="px-6 py-3.5 text-center text-xs text-white font-bold border-r border-ev-border/20 last:border-r-0">
                          <span className="text-electric-blue block">{insurer.batteryCoverage}</span>
                          <span className="text-[9px] text-slate-500 font-normal leading-normal block mt-1">{insurer.batteryLimitDesc}</span>
                        </td>
                      ))}
                    </tr>

                    {/* Towing System */}
                    <tr>
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        ระบบรถยกช่วยเหลือฉุกเฉิน
                      </td>
                      {INSURERS.map((insurer) => (
                        <td key={insurer.id} className="px-6 py-3.5 text-center text-xs text-white border-r border-ev-border/20 last:border-r-0">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="flex items-center gap-1 text-[11px] font-semibold">
                              <Truck className="h-3.5 w-3.5 text-amber-500" />
                              <span>{insurer.roadsideAssistance}</span>
                            </span>
                            <span className="text-[10px] text-slate-400">{insurer.towDistance}</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Garage Type */}
                    <tr className="bg-slate-900/10">
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        สิทธิ์การซ่อมตัวถังและสี
                      </td>
                      {INSURERS.map((insurer) => (
                        <td key={insurer.id} className="px-6 py-3.5 text-center text-xs font-bold border-r border-ev-border/20 last:border-r-0">
                          <span className={insurer.garageType === 'ซ่อมห้าง' ? 'text-electric-green' : 'text-slate-400'}>
                            {insurer.garageType}
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Deductible */}
                    <tr>
                      <td className="px-6 py-3.5 text-xs text-slate-400">
                        ค่าเสียหายส่วนแรกต่อครั้ง (Deductible)
                      </td>
                      {INSURERS.map((insurer) => (
                        <td key={insurer.id} className="px-6 py-3.5 text-center text-xs text-white font-mono border-r border-ev-border/20 last:border-r-0">
                          {insurer.deductible === 0 ? 'ไม่มี (0 ฿)' : `${new Intl.NumberFormat('th-TH').format(insurer.deductible)} ฿`}
                        </td>
                      ))}
                    </tr>

                    {/* Extra benefits */}
                    <tr className="bg-slate-900/10">
                      <td className="px-6 py-4 text-xs text-slate-400 align-top">
                        ความคุ้มครองและฟังก์ชันเสริมพิเศษ
                      </td>
                      {INSURERS.map((insurer) => (
                        <td key={insurer.id} className="px-6 py-4 text-xs text-slate-400 font-normal border-r border-ev-border/20 last:border-r-0 leading-relaxed">
                          <ul className="space-y-1.5 list-disc pl-4 text-[10px]">
                            {insurer.extraFeatures.map((feat, i) => (
                              <li key={i}>{feat}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Technical guidelines Alert */}
              <div className="rounded-xl border border-electric-green/20 bg-gradient-to-r from-electric-green/5 to-electric-blue/5 p-5 flex items-start gap-4">
                <Info className="h-6 w-6 text-electric-green flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">ข้อควรรู้เฉพาะประกันภัยรถไฟฟ้า (EV Insurance Regulations)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 font-normal">
                    ตามกรอบเงื่อนไขใหม่ของ คปภ. (OIC) รถยนต์ไฟฟ้าจะต้องแสดงหลักฐานและระดับสุขภาพแบตเตอรี่ (SOH) ประกอบการยื่นประเมินเคลมกรณีเกิดความเสียหายในจุดที่ส่งผลต่อโมดูลแบตเตอรี่ 
                    โดยระบบประกัน EV ชั้น 1 จะครอบคลุมเฉพาะตัวรถที่มีแบตเตอรี่ดั้งเดิมจากทางผู้ผลิตเท่านั้น หากมีการดัดแปลงระบบแบตเตอรี่ด้วยตนเอง ประกันภัยจะถือเป็นโมฆะทันที
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* EV Claim Guideline Section */}
          <div className="rounded-xl border border-ev-border bg-ev-card/40 p-6 space-y-6">
            <h2 className="text-md font-bold text-white border-b border-ev-border/50 pb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>3 เงื่อนไขและระเบียบเคลมที่ห้ามมองข้ามในรถ EV ⚠️</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-normal">
              {/* Point 1 */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-amber-400 block">[01] ค่าเสื่อมแบตเตอรี่ (Depreciation Rule)</span>
                <p className="text-slate-400 leading-relaxed font-normal">
                  เนื่องจากแบตเตอรี่คือหัวใจหลักของรถ EV และมีมูลค่าสูงมาก ประกันภัยรถยนต์ไฟฟ้าชั้น 1 ในไทย จึงมีทั้งค่ายที่ให้ความคุ้มครองค่าชดเชยการเปลี่ยนแบตเตอรี่ลูกใหม่ 100% 
                  และค่ายที่คิดเกณฑ์หักเปอร์เซ็นต์ค่าเสื่อมแบตเตอรี่รายปี (เช่น ปีที่ 2 เหลือ 90% ปีที่ 3 เหลือ 80%) ซึ่งผู้เอาประกันอาจต้องแบกรับส่วนต่างหลักหมื่นถึงหลักแสนบาทหากเกิดการเปลี่ยนแบตเตอรี่จากการชนพังยับเยิน
                </p>
              </div>

              {/* Point 2 */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-electric-green block">[02] บริการลากจูงล้อลอย (Flatbed Towing Rule)</span>
                <p className="text-slate-400 leading-relaxed font-normal">
                  รถยนต์ไฟฟ้ามีระบบมอเตอร์แม่เหล็กถาวร (Permanent Magnet Motor) ซึ่งหากล้อใดล้อหนึ่งหมุนจะเกิดการต้านกระแสและเหนี่ยวนำให้เกิดไฟฟ้าไหลย้อนกลับเข้าอินเวอร์เตอร์ 
                  ซึ่งอาจทำให้ขดลวดละลายและไฟไหม้ระบบบอร์ดควบคุมหลักได้ ประกันภัย EV จึงระบุเงื่อนไขการลากจูงพิเศษเป็น **"รถสไลด์ยกร้อยเปอร์เซ็นต์ (Flatbed slide)"** เท่านั้น 
                  โดยห้ามใช้ล้อตักยกลากแบบปกติโดยไม่มีแคร่ล้อลอยรองเด็ดขาด
                </p>
              </div>

              {/* Point 3 */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-electric-blue block">[03] กฎการแสดงผลตรวจเช็คระบบไฟฟ้า (BMS Logs Check)</span>
                <p className="text-slate-400 leading-relaxed font-normal">
                  บริษัทประกันในไทยเกือบทุกค่าย จะส่งวิศวกรเข้าประเมินความเสียหายควบคู่กับรายงานสแกนตรวจเช็คระบบไฟฟ้า (BMS Logs) จากทางศูนย์บริการแบรนด์อย่างเป็นทางการ 
                  เพื่อตรวจสอบความชื้น ความร้อนของแบตเตอรี่ หรือรอยยุบใต้ท้องรถจากการปะทะ หากทางศูนย์รายงานว่าเกิดความชื้นจากการขับลุยน้ำสูงเกินพิกัดที่ระบุในคู่มือ 
                  ประกันภัยอาจปฏิเสธความรับผิดชอบค่าใช้จ่ายในการเปลี่ยนแบตเตอรี่
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
