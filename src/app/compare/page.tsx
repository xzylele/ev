'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftRight, X, Plus, Sparkles, EyeOff, Check, AlertCircle } from 'lucide-react';
import CompareSelector, { SelectedCar } from '@/components/CompareSelector';

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  price: number;
  image: string;
  bodyType: string;
  warrantyYears: number;
  warrantyKm: number;
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  cargoVolume: number;
  frunkVolume: number;
  horsepower: number;
  torque: number;
  acceleration0To100: number;
  topSpeed: number;
  driveType: string;
  batteryCapacity: number;
  batteryType: string;
  rangeWLTP: number;
  rangeNEDC: number;
  rangeCLTC: number;
  acChargePower: number;
  dcChargePower: number;
  voltageArchitecture: string;
  v2lSupport: boolean;
  v2lPower: number;
  // ADAS
  adasLevel: number;
  adaptiveCruiseControl: boolean;
  laneKeepAssist: boolean;
  autoEmergencyBraking: boolean;
  blindSpotMonitor: boolean;
  autoParking: boolean;
  adasFeatures: string;
}

const ComparePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allCars, setAllCars] = useState<CarSpec[]>([]);
  const [selectedCars, setSelectedCars] = useState<CarSpec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Toggles
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [hideIdentical, setHideIdentical] = useState(false);

  // Search dropdown inside comparison slot
  const [activeSearchSlot, setActiveSearchSlot] = useState<number | null>(null);
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  // Fetch all cars and parse initial selection
  useEffect(() => {
    setMounted(true);
    const fetchCars = async () => {
      try {
        const res = await fetch('/api/cms/cars');
        const data = await res.json();
        if (res.ok) {
          setAllCars(data);
          loadSelection(data);
        }
      } catch (err) {
        console.error('Failed to load cars:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadSelection = (carsList: CarSpec[]) => {
      // Priority 1: Query parameters (ids=id1,id2,...)
      const queryIds = searchParams.get('ids');
      if (queryIds) {
        const ids = queryIds.split(',');
        const matched = carsList.filter(c => ids.includes(c._id));
        setSelectedCars(matched);
        return;
      }

      // Priority 2: LocalStorage
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored) {
        try {
          const parsed: SelectedCar[] = JSON.parse(stored);
          const matched = carsList.filter(c => parsed.some(pc => pc.id === c._id));
          setSelectedCars(matched);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchCars();

    // Listen to selection changes
    const handleUpdate = () => {
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored && allCars.length > 0) {
        try {
          const parsed: SelectedCar[] = JSON.parse(stored);
          const matched = allCars.filter(c => parsed.some(pc => pc.id === c._id));
          setSelectedCars(matched);
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('ev_compare_updated', handleUpdate);
    return () => {
      window.removeEventListener('ev_compare_updated', handleUpdate);
    };
  }, [searchParams, allCars.length]);

  // Sync state back to localStorage and URL query
  const updateCompareSelection = (newSelection: CarSpec[]) => {
    setSelectedCars(newSelection);
    
    // Save to localStorage
    const mapped: SelectedCar[] = newSelection.map(c => ({
      id: c._id,
      brand: c.brand,
      model: c.model,
      trim: c.trim,
      image: c.image,
      price: c.price
    }));
    localStorage.setItem('ev_compare_selection', JSON.stringify(mapped));
    
    // Sync to URL
    const ids = newSelection.map(c => c._id).join(',');
    if (ids) {
      router.replace(`/compare?ids=${ids}`);
    } else {
      router.replace('/compare');
    }

    // Trigger update event
    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  const handleRemoveColumn = (id: string) => {
    const updated = selectedCars.filter(c => c._id !== id);
    updateCompareSelection(updated);
  };

  const handleAddCarToCompare = (car: CarSpec) => {
    if (selectedCars.length >= 4) {
      alert('เปรียบเทียบรถได้สูงสุด 4 รุ่นพร้อมกันครับ');
      return;
    }
    if (selectedCars.some(c => c._id === car._id)) {
      alert('มีรถยนต์รุ่นนี้ในการเปรียบเทียบแล้ว');
      return;
    }
    const updated = [...selectedCars, car];
    updateCompareSelection(updated);
    setActiveSearchSlot(null);
    setSlotSearchQuery('');
  };

  // Check if values in a row are different
  const hasDiffs = (values: any[]) => {
    if (values.length <= 1) return false;
    return !values.every(v => v === values[0]);
  };

  // Render spec comparison row
  const renderSpecRow = (
    label: string, 
    fieldExtractor: (car: CarSpec) => any, 
    formatter?: (val: any) => string,
    betterDirection?: 'higher' | 'lower'
  ) => {
    const values = selectedCars.map(fieldExtractor);
    const rowIsDifferent = hasDiffs(values);

    if (hideIdentical && !rowIsDifferent && selectedCars.length > 1) {
      return null;
    }

    // Determine the optimal value if there are differences and more than 1 car
    let optimalValue: number | null = null;
    if (betterDirection && rowIsDifferent && selectedCars.length > 1) {
      const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v));
      if (numericValues.length > 0) {
        if (betterDirection === 'higher') {
          optimalValue = Math.max(...numericValues);
        } else if (betterDirection === 'lower') {
          optimalValue = Math.min(...numericValues);
        }
      }
    }

    return (
      <tr 
        className={`transition-colors duration-200 ${
          highlightDiffs && rowIsDifferent && selectedCars.length > 1 
            ? 'bg-ev-highlight/15 text-ev-highlight border-l-4 border-l-ev-highlight' 
            : 'border-b border-ev-border/40 hover:bg-slate-800/10'
        }`}
      >
        <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap bg-ev-dark/80 sticky left-0 z-10 w-48">
          {label}
        </td>
        {selectedCars.map((car) => {
          const val = fieldExtractor(car);
          const isOptimal = optimalValue !== null && Number(val) === optimalValue;
          return (
            <td 
              key={car._id} 
              className={`px-6 py-4 text-xs font-semibold text-center whitespace-nowrap min-w-[200px] ${
                isOptimal 
                  ? 'text-electric-green font-extrabold bg-electric-green/10 shadow-[inset_0_0_10px_rgba(5,243,131,0.05)]' 
                  : 'text-white'
              }`}
            >
              {formatter ? formatter(val) : String(val)}
            </td>
          );
        })}
        {/* Fill slots if selectedCars count is less than max */}
        {Array.from({ length: Math.max(0, 4 - selectedCars.length) }).map((_, i) => (
          <td key={`empty-${i}`} className="px-6 py-4 text-slate-700 text-center">-</td>
        ))}
      </tr>
    );
  };

  if (!mounted) return null;

  const filteredDropdownOptions = allCars.filter(car => {
    const searchLower = slotSearchQuery.toLowerCase();
    const alreadySelected = selectedCars.some(sc => sc._id === car._id);
    return !alreadySelected && (
      car.brand.toLowerCase().includes(searchLower) ||
      car.model.toLowerCase().includes(searchLower) ||
      car.trim.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            เปรียบเทียบสเปคเจาะลึก
          </h1>
          <p className="text-sm text-slate-400 mt-1">วิเคราะห์ข้อมูลความแตกต่างของรถยนต์ไฟฟ้าแต่ละรุ่นแบบเคียงข้างกัน</p>
        </div>

        {selectedCars.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setHighlightDiffs(!highlightDiffs)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                highlightDiffs 
                  ? 'bg-ev-highlight/10 border-ev-highlight text-ev-highlight glow-green' 
                  : 'border-ev-border text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{highlightDiffs ? 'ปิดไฮไลท์จุดต่าง' : 'ไฮไลท์จุดต่าง'}</span>
            </button>

            <button
              onClick={() => setHideIdentical(!hideIdentical)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                hideIdentical 
                  ? 'bg-electric-blue/10 border-electric-blue text-electric-blue' 
                  : 'border-ev-border text-slate-400 hover:text-white'
              }`}
            >
              <EyeOff className="h-4 w-4" />
              <span>{hideIdentical ? 'แสดงสเปคทั้งหมด' : 'ซ่อนแถวที่เหมือนกัน'}</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <span>กำลังโหลดข้อมูลสเปครถยนต์ไฟฟ้า...</span>
        </div>
      ) : selectedCars.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ev-border py-20 text-center max-w-lg mx-auto">
          <ArrowLeftRight className="h-12 w-12 text-slate-500 mb-4" />
          <span className="text-md font-bold text-white">ยังไม่ได้เลือกคู่เปรียบเทียบ</span>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm px-4">
            กรุณาไปที่หน้า ค้นหา เพื่อกดเลือกเพิ่มรถที่ต้องการ หรือคลิกเพิ่มรถยนต์ไฟฟ้ารุ่นแรกในกล่องการค้นหาด้านล่างนี้เลย
          </p>
          <div className="mt-6 w-full max-w-xs relative px-4">
            <input
              type="text"
              placeholder="พิมพ์ค้นหารถเพื่อเริ่มเปรียบเทียบ..."
              value={slotSearchQuery}
              onChange={(e) => setSlotSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none"
            />
            {slotSearchQuery && (
              <div className="absolute left-4 right-4 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-ev-border bg-ev-dark shadow-2xl">
                {filteredDropdownOptions.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-xs">ไม่พบรถที่ค้นหา</div>
                ) : (
                  filteredDropdownOptions.map(car => (
                    <button
                      key={car._id}
                      onClick={() => handleAddCarToCompare(car)}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white border-b border-ev-border/30 last:border-b-0 flex items-center space-x-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={car.image} alt={car.model} className="h-6 w-8 rounded object-cover" />
                      <span>{car.brand} {car.model} ({car.trim})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Link
            href="/cars"
            className="mt-4 text-xs font-bold text-electric-green hover:underline"
          >
            ไปที่หน้าค้นหารถ
          </Link>
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-ev-border bg-ev-card/10 no-scrollbar relative shadow-2xl">
          <table className="w-full border-collapse">
            {/* Table Header: Column Headers (Car Images & Names) */}
            <thead>
              <tr className="border-b border-ev-border/60">
                <th className="px-6 py-6 text-left bg-ev-dark/90 sticky left-0 z-20 w-48">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">เปรียบเทียบสเปค</span>
                </th>
                {selectedCars.map((car) => (
                  <th key={car._id} className="px-6 py-6 text-center align-top min-w-[220px]">
                    <div className="relative flex flex-col items-center">
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveColumn(car._id)}
                        className="absolute -top-3 right-0 rounded-full bg-slate-800 border border-ev-border p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="ลบออก"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={car.image}
                        alt={car.model}
                        className="h-24 w-32 rounded-xl object-cover border border-ev-border shadow-md"
                      />

                      {/* Info */}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">{car.brand}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5 leading-tight">{car.model}</h3>
                      <p className="text-xs text-electric-green font-semibold mt-0.5">{car.trim}</p>
                      
                      {/* Sibling Trims Dropdown Selector */}
                      {(() => {
                        const siblingTrims = allCars.filter(c => c.brand === car.brand && c.model === car.model);
                        if (siblingTrims.length <= 1) return null;
                        return (
                          <select
                            value={car._id}
                            onChange={(e) => {
                              const newCarId = e.target.value;
                              const newCar = siblingTrims.find(c => c._id === newCarId);
                              if (newCar) {
                                const index = selectedCars.findIndex(c => c._id === car._id);
                                if (index !== -1) {
                                  const updated = [...selectedCars];
                                  updated[index] = newCar;
                                  updateCompareSelection(updated);
                                }
                              }
                            }}
                            className="mt-2 text-[10px] font-bold bg-slate-900 border border-ev-border text-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-electric-green/60 cursor-pointer max-w-[180px] truncate"
                          >
                            {siblingTrims.map(t => (
                              <option key={t._id} value={t._id} className="bg-ev-dark text-white text-xs">
                                {t.trim} ({new Intl.NumberFormat('th-TH').format(t.price)} ฿)
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                      
                      <Link
                        href={`/cars/${car._id}`}
                        className="mt-3 text-[10px] font-bold text-electric-blue hover:underline"
                      >
                        ดูหน้ารายละเอียดหลัก
                      </Link>
                    </div>
                  </th>
                ))}
                
                {/* Empty columns inputs (Add slots dynamically) */}
                {Array.from({ length: 4 - selectedCars.length }).map((_, idx) => {
                  const slotIndex = selectedCars.length + idx;
                  const isSearching = activeSearchSlot === slotIndex;
                  return (
                    <th key={`empty-header-${idx}`} className="px-6 py-6 text-center align-middle min-w-[220px]">
                      <div className="relative border-2 border-dashed border-ev-border/60 hover:border-slate-600 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center justify-center min-h-[160px]">
                        {!isSearching ? (
                          <button
                            onClick={() => {
                              setActiveSearchSlot(slotIndex);
                              setSlotSearchQuery('');
                            }}
                            className="flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-colors"
                          >
                            <Plus className="h-8 w-8 rounded-full border border-dashed border-ev-border p-1.5" />
                            <span className="text-[11px] font-bold">เพิ่มรุ่นเปรียบเทียบ</span>
                          </button>
                        ) : (
                          <div className="w-full space-y-3 relative">
                            <input
                              type="text"
                              autoFocus
                              placeholder="ค้นหารถยนต์..."
                              value={slotSearchQuery}
                              onChange={(e) => setSlotSearchQuery(e.target.value)}
                              className="w-full rounded-xl border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
                            />
                            
                            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-ev-border bg-ev-dark shadow-2xl">
                              {filteredDropdownOptions.length === 0 ? (
                                <div className="p-3 text-center text-slate-500 text-xs">ไม่พบรถที่ค้นหา</div>
                              ) : (
                                filteredDropdownOptions.map(car => (
                                  <button
                                    key={car._id}
                                    onClick={() => handleAddCarToCompare(car)}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white border-b border-ev-border/30 last:border-b-0 flex items-center space-x-2"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={car.image} alt={car.model} className="h-5 w-7 rounded object-cover" />
                                    <span className="truncate">{car.brand} {car.model}</span>
                                  </button>
                                ))
                              )}
                            </div>
                            
                            <button
                              onClick={() => setActiveSearchSlot(null)}
                              className="text-[10px] text-slate-500 hover:text-white underline block mx-auto pt-1"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body Groups */}
            <tbody>
              {/* === BASIC INFO === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-electric-blue sticky left-0">
                  ข้อมูลพื้นฐาน (Basic Information)
                </td>
              </tr>
              {renderSpecRow('ราคาจำหน่าย (บาท)', (car) => car.price, (val) => `${new Intl.NumberFormat('th-TH').format(val)} ฿`, 'lower')}
              {renderSpecRow('ประเภทตัวถัง', (car) => car.bodyType)}
              {renderSpecRow('ระยะเวลาการรับประกันแบตเตอรี่', (car) => car.warrantyYears, (val) => `${val} ปี`, 'higher')}
              {renderSpecRow('ระยะทางรับประกัน (กม.)', (car) => car.warrantyKm, (val) => `${new Intl.NumberFormat('th-TH').format(val)} กม.`, 'higher')}

              {/* === PERFORMANCE === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-electric-green sticky left-0">
                  สมรรถนะตัวรถ (Performance)
                </td>
              </tr>
              {renderSpecRow('กำลังมอเตอร์ไฟฟ้า (แรงม้า)', (car) => car.horsepower, (val) => `${val} HP`, 'higher')}
              {renderSpecRow('แรงบิดสูงสุด (นิวตันเมตร)', (car) => car.torque, (val) => `${val} Nm`, 'higher')}
              {renderSpecRow('อัตราเร่ง 0-100 กม./ชม.', (car) => car.acceleration0To100, (val) => `${val} วินาที`, 'lower')}
              {renderSpecRow('ความเร็วสูงสุด (กม./ชม.)', (car) => car.topSpeed, (val) => `${val} km/h`, 'higher')}
              {renderSpecRow('ระบบขับเคลื่อน', (car) => car.driveType)}

              {/* === BATTERY & RANGE === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-amber-400 sticky left-0">
                  แบตเตอรี่ & ระยะการเดินทาง (Battery & Range)
                </td>
              </tr>
              {renderSpecRow('ความจุแบตเตอรี่ (kWh)', (car) => car.batteryCapacity, (val) => `${val} kWh`, 'higher')}
              {renderSpecRow('ชนิดของแบตเตอรี่', (car) => car.batteryType)}
              {renderSpecRow('ระยะทางวิ่ง WLTP (กม.)', (car) => car.rangeWLTP, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}
              {renderSpecRow('ระยะทางวิ่ง NEDC (กม.)', (car) => car.rangeNEDC, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}
              {renderSpecRow('ระยะทางวิ่ง CLTC (กม.)', (car) => car.rangeCLTC, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}

              {/* === CHARGING & TECH === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-purple-400 sticky left-0">
                  ระบบชาร์จไฟฟ้า & เทคโนโลยี (Charging & Technology)
                </td>
              </tr>
              {renderSpecRow('การชาร์จกระแสสลับ AC สูงสุด', (car) => car.acChargePower, (val) => `${val} kW`, 'higher')}
              {renderSpecRow('การชาร์จกระแสตรง DC สูงสุด', (car) => car.dcChargePower, (val) => `${val} kW`, 'higher')}
              {renderSpecRow('สถาปัตยกรรมแรงดันระบบ', (car) => car.voltageArchitecture)}
              {renderSpecRow('จ่ายกระแสไฟภายนอก (V2L)', (car) => car.v2lSupport, (val) => val ? 'รองรับ' : 'ไม่รองรับ')}
              {renderSpecRow('กำลังจ่ายไฟ V2L สูงสุด', (car) => car.v2lPower, (val) => val > 0 ? `${val} kW` : '-', 'higher')}

              {/* === DIMENSIONS === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-pink-400 sticky left-0">
                  สัดส่วนและมิติตัวถัง (Body Dimensions)
                </td>
              </tr>
              {renderSpecRow('ความยาวตัวรถ (มม.)', (car) => car.length, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความกว้างตัวรถ (มม.)', (car) => car.width, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความสูงตัวรถ (มม.)', (car) => car.height, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ระยะความยาวฐานล้อ (มม.)', (car) => car.wheelbase, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความจุห้องสัมภาระท้าย (ลิตร)', (car) => car.cargoVolume, (val) => `${val} ลิตร`, 'higher')}
              {renderSpecRow('ที่เก็บของด้านหน้า Frunk (ลิตร)', (car) => car.frunkVolume, (val) => val > 0 ? `${val} ลิตร` : 'ไม่มี', 'higher')}

              {/* === ADAS === */}
              <tr className="bg-slate-900/30 border-b border-ev-border">
                <td colSpan={5} className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-widest text-cyan-400 sticky left-0">
                  ระบบช่วยขับขี่อัจฉริยะ (ADAS)
                </td>
              </tr>
              {renderSpecRow('ระดับระบบ ADAS', (car) => car.adasLevel ?? 0, (val) => {
                const labels: Record<number, string> = { 0: 'ไม่มี', 1: 'Level 1 (พื้นฐาน)', 2: 'Level 2 (โหมดกึ่งอัตโนมัติ)', 3: 'Level 2+ (สูงกว่า)' };
                return labels[val] || `Level ${val}`;
              }, 'higher')}
              {renderSpecRow('Adaptive Cruise Control (ACC)', (car) => car.adaptiveCruiseControl ?? false, (val) => val ? '✓ รองรับ' : '— ไม่มี')}
              {renderSpecRow('Lane Keeping Assist (LKA)', (car) => car.laneKeepAssist ?? false, (val) => val ? '✓ รองรับ' : '— ไม่มี')}
              {renderSpecRow('Auto Emergency Braking (AEB)', (car) => car.autoEmergencyBraking ?? false, (val) => val ? '✓ รองรับ' : '— ไม่มี')}
              {renderSpecRow('Blind Spot Monitor (BSM)', (car) => car.blindSpotMonitor ?? false, (val) => val ? '✓ รองรับ' : '— ไม่มี')}
              {renderSpecRow('จอดรถอัตโนมัติ (Auto Parking)', (car) => car.autoParking ?? false, (val) => val ? '✓ รองรับ' : '— ไม่มี')}
              {renderSpecRow('ฟีเจอร์ ADAS เพิ่มเติม', (car) => car.adasFeatures || '', (val) => val || '—')}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Compare Floating Bar */}
      <CompareSelector />
    </div>
  );
};

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400 font-bold">กำลังดาวน์โหลดข้อมูลการเปรียบเทียบ...</div>}>
      <ComparePageContent />
    </Suspense>
  );
}
