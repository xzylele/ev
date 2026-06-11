'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calculator, Zap, Fuel, Sparkles, AlertCircle, ArrowLeftRight, Clock, ChevronDown, Search, X as XIcon } from 'lucide-react';
import CompareSelector from '@/components/CompareSelector';

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  batteryCapacity: number;
  acChargePower: number;
  dcChargePower: number;
  rangeWLTP: number;
  rangeNEDC: number;
  rangeCLTC: number;
}

const CalculatorsContent = () => {
  const searchParams = useSearchParams();
  const carId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState<'cost' | 'time'>('cost');
  const [loadingCar, setLoadingCar] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarSpec | null>(null);

  // All cars for picker
  const [allCars, setAllCars] = useState<CarSpec[]>([]);
  const [carPickerOpen, setCarPickerOpen] = useState(false);
  const [carPickerSearch, setCarPickerSearch] = useState('');
  const [costSelectedCar, setCostSelectedCar] = useState<CarSpec | null>(null);

  // Time simulator picker state
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerSearch, setTimePickerSearch] = useState('');
  const [timeSelectedCar, setTimeSelectedCar] = useState<CarSpec | null>(null);

  // Fetch all cars for the picker on mount
  useEffect(() => {
    fetch('/api/cms/cars')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllCars(data); })
      .catch(() => {});
  }, []);

  const handlePickCar = (car: CarSpec) => {
    setCostSelectedCar(car);
    setCarPickerOpen(false);
    setCarPickerSearch('');
    // Auto-fill efficiency from battery/range
    const range = Math.max(car.rangeWLTP, car.rangeNEDC, car.rangeCLTC);
    if (range > 0) {
      const eff = (car.batteryCapacity / range) * 100;
      setEvEfficiency(Number(eff.toFixed(1)));
    }
  };

  const handlePickTimeCar = (car: CarSpec) => {
    setTimeSelectedCar(car);
    setTimePickerOpen(false);
    setTimePickerSearch('');
    // Auto-fill charging specs
    setBatterySize(car.batteryCapacity);
    setCarMaxAcSpeed(car.acChargePower);
    setCarMaxDcSpeed(car.dcChargePower);
  };

  const filteredCars = allCars.filter(c =>
    `${c.brand} ${c.model} ${c.trim}`.toLowerCase().includes(carPickerSearch.toLowerCase())
  );

  const filteredTimeCars = allCars.filter(c =>
    `${c.brand} ${c.model} ${c.trim}`.toLowerCase().includes(timePickerSearch.toLowerCase())
  );

  // Group filtered cars by brand for display
  const groupedCars = filteredCars.reduce((acc, car) => {
    if (!acc[car.brand]) acc[car.brand] = [];
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarSpec[]>);

  const groupedTimeCars = filteredTimeCars.reduce((acc, car) => {
    if (!acc[car.brand]) acc[car.brand] = [];
    acc[car.brand].push(car);
    return acc;
  }, {} as Record<string, CarSpec[]>);

  // 1. Cost Calculator State
  const [distance, setDistance] = useState<number>(2000); // km/month
  const [fuelPrice, setFuelPrice] = useState<number>(38); // THB/L
  const [fuelConsumption, setFuelConsumption] = useState<number>(15); // km/L
  const [evEfficiency, setEvEfficiency] = useState<number>(15); // kWh/100km

  // 2. Charging Time Simulator State
  const [batterySize, setBatterySize] = useState<number>(60); // kWh
  const [startSoc, setStartSoc] = useState<number>(10); // %
  const [endSoc, setEndSoc] = useState<number>(80); // %
  const [chargerSpeed, setChargerSpeed] = useState<number>(50); // kW
  const [chargerType, setChargerType] = useState<'AC' | 'DC'>('DC');
  const [carMaxAcSpeed, setCarMaxAcSpeed] = useState<number>(7);
  const [carMaxDcSpeed, setCarMaxDcSpeed] = useState<number>(88);

  // Fetch prefilled car spec if URL ID is provided
  useEffect(() => {
    if (carId) {
      setLoadingCar(true);
      fetch(`/api/cms/cars/${carId}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setSelectedCar(data);
            setBatterySize(data.batteryCapacity);
            setCarMaxAcSpeed(data.acChargePower);
            setCarMaxDcSpeed(data.dcChargePower);
            // Switch to time tab for simulator context if suitable
            setActiveTab('time');
            // Estimate average EV efficiency (kWh/100km) based on range/battery
            const range = Math.max(data.rangeWLTP, data.rangeNEDC, data.rangeCLTC) || 400;
            const efficiency = (data.batteryCapacity / range) * 100;
            setEvEfficiency(Number(efficiency.toFixed(1)));
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoadingCar(false));
    }
  }, [carId]);

  // Calculations: Cost
  const monthlyFuelCost = (distance / fuelConsumption) * fuelPrice;
  
  // Power rates (THB / kWh)
  const rateOffPeak = 2.63; // Home TOU Off-peak
  const rateOnPeak = 5.80;  // Home TOU On-peak
  const ratePublicDc = 7.50; // Public DC Charger average

  const energyNeededPerMonth = (distance * evEfficiency) / 100; // kWh/month
  const costOffPeak = energyNeededPerMonth * rateOffPeak;
  const costOnPeak = energyNeededPerMonth * rateOnPeak;
  const costPublicDc = energyNeededPerMonth * ratePublicDc;

  const savingsOffPeak = monthlyFuelCost - costOffPeak;
  const savingsOnPeak = monthlyFuelCost - costOnPeak;
  const savingsPublicDc = monthlyFuelCost - costPublicDc;

  // Calculations: Charging Time
  const calculateChargingTime = () => {
    if (startSoc >= endSoc) return { hours: 0, minutes: 0, avgSpeed: 0 };

    const maxSpeedLimit = chargerType === 'AC' ? carMaxAcSpeed : carMaxDcSpeed;
    const actualPeakSpeed = Math.min(chargerSpeed, maxSpeedLimit);

    let totalHours = 0;
    
    // Simulate chargers logic
    // From start% to 80%: charges at peak speed
    const transitionPoint = 80;
    
    if (startSoc < transitionPoint) {
      const targetForPeak = Math.min(endSoc, transitionPoint);
      const capacityToChargePeak = batterySize * (targetForPeak - startSoc) / 100;
      totalHours += capacityToChargePeak / actualPeakSpeed;
    }

    // From 80% to 100%: Speed decays linearly down to 20% of max speed
    // The average charging speed in 80-100% range is approx 40% of the actual peak speed
    if (endSoc > transitionPoint) {
      const startForDecay = Math.max(startSoc, transitionPoint);
      const capacityToChargeDecay = batterySize * (endSoc - startForDecay) / 100;
      const avgDecaySpeed = actualPeakSpeed * 0.4;
      totalHours += capacityToChargeDecay / avgDecaySpeed;
    }

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    return {
      hours,
      minutes: minutes === 60 ? 59 : minutes, // bound minutes check
      avgSpeed: actualPeakSpeed
    };
  };

  const timeResult = calculateChargingTime();
  const energyAdded = batterySize * (endSoc - startSoc) / 100;

  // Presets helper for charger speeds
  const handleSelectPresetCharger = (kw: number, type: 'AC' | 'DC') => {
    setChargerSpeed(kw);
    setChargerType(type);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          เครื่องคำนวณและจำลองการใช้งาน EV
        </h1>
        <p className="mt-2 text-sm text-slate-400">เปรียบเทียบค่าชาร์จไฟและวิเคราะห์จำลองระยะเวลาชาร์จจริง</p>
      </div>

      {loadingCar && (
        <div className="mb-6 p-4 rounded-xl border border-electric-green/30 bg-electric-green/10 text-xs text-electric-green">
          กำลังโหลดข้อมูลรุ่นรถที่ระบุสำหรับตั้งค่าตั้งต้น...
        </div>
      )}

      {/* Selected Car context banner */}
      {selectedCar && (
        <div className="mb-8 rounded-2xl border border-ev-border bg-ev-card/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-electric-green/15 flex items-center justify-center text-electric-green">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">เปิดใช้งานโมเดลตั้งต้น</span>
              <h3 className="text-sm font-bold text-white leading-tight">
                {selectedCar.brand} {selectedCar.model} ({selectedCar.trim})
              </h3>
            </div>
          </div>
          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <span>แบตเตอรี่: <strong className="text-white">{selectedCar.batteryCapacity} kWh</strong></span>
            <span>รองรับชาร์จ DC สูงสุด: <strong className="text-white">{selectedCar.dcChargePower} kW</strong></span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-ev-border mb-8">
        <button
          onClick={() => setActiveTab('cost')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 ${
            activeTab === 'cost'
              ? 'border-electric-green text-electric-green'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>เครื่องคำนวณค่าไฟเทียบน้ำมัน</span>
        </button>
        
        <button
          onClick={() => setActiveTab('time')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 ${
            activeTab === 'time'
              ? 'border-electric-blue text-electric-blue'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>เครื่องจำลองเวลาชาร์จ (Charging Simulator)</span>
        </button>
      </div>

      {/* Cost Calculator Content */}
      {activeTab === 'cost' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
          {/* Inputs Column */}
          <div className="lg:col-span-5 rounded-2xl border border-ev-border bg-ev-card/20 p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-ev-border/50 pb-3">กำหนดค่าการทดสอบ</h3>
            
            {/* Distance */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">ระยะทางวิ่งต่อเดือน (กม.)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-700"
              />
            </div>

            {/* ICE Inputs group */}
            <div className="border border-ev-border/60 bg-slate-900/30 rounded-xl p-4 space-y-4">
              <span className="block text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                <Fuel className="h-4 w-4 text-red-400" />
                <span>รถยนต์น้ำมันเดิม (ICE Car)</span>
              </span>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">ราคาน้ำมันเฉลี่ย (บาทต่อลิตร)</label>
                <input
                  type="number"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">อัตราประหยัดน้ำมัน (กิโลเมตรต่อลิตร)</label>
                <input
                  type="number"
                  value={fuelConsumption}
                  onChange={(e) => setFuelConsumption(Number(e.target.value))}
                  className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* EV Inputs group */}
            <div className="border border-ev-border/60 bg-slate-900/30 rounded-xl p-4 space-y-4">
              <span className="block text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                <Zap className="h-4 w-4 text-electric-green" />
                <span>รถยนต์ไฟฟ้า (EV Car)</span>
              </span>

              {/* Car Model Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCarPickerOpen(prev => !prev)}
                  className="w-full flex items-center justify-between rounded-lg border border-electric-green/40 bg-electric-green/5 px-3 py-2 text-xs font-semibold text-electric-green hover:bg-electric-green/10 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5" />
                    {costSelectedCar
                      ? `${costSelectedCar.brand} ${costSelectedCar.model} (${costSelectedCar.trim})`
                      : 'เลือกรุ่นรถจากฐานข้อมูล...'}
                  </span>
                  <div className="flex items-center gap-1">
                    {costSelectedCar && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={e => { e.stopPropagation(); setCostSelectedCar(null); }}
                        onKeyDown={e => e.key === 'Enter' && setCostSelectedCar(null)}
                        className="p-0.5 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        <XIcon className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${carPickerOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown */}
                {carPickerOpen && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-ev-border bg-slate-950 shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-ev-border/40">
                      <Search className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="ค้นหายี่ห้อ / รุ่น..."
                        value={carPickerSearch}
                        onChange={e => setCarPickerSearch(e.target.value)}
                        className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-600"
                      />
                    </div>
                    {/* List grouped by brand */}
                    <div className="max-h-60 overflow-y-auto">
                      {Object.keys(groupedCars).length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">ไม่พบรุ่นที่ค้นหา</div>
                      ) : (
                        Object.entries(groupedCars).map(([brand, brandCars]) => (
                          <div key={brand}>
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-900/60 sticky top-0">{brand}</div>
                            {brandCars.map(car => (
                              <button
                                key={car._id}
                                type="button"
                                onClick={() => handlePickCar(car)}
                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 transition-colors border-b border-ev-border/10 last:border-0"
                              >
                                <span className="font-bold text-white">{car.model}</span>
                                <span className="ml-2 text-[10px] text-electric-green">{car.trim}</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">แบต {car.batteryCapacity} kWh · DC {car.dcChargePower} kW</span>
                              </button>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected car chip */}
              {costSelectedCar && (
                <div className="text-[10px] text-slate-400 bg-electric-green/5 border border-electric-green/20 rounded-lg px-3 py-2">
                  อัตรากินไฟฟ้าถูกคำนวณเป็น <strong className="text-electric-green">{evEfficiency} kWh/100km</strong> จากสเปคของรุ่นที่เลือก
                </div>
              )}
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">อัตราการกินกระแสไฟ (kWh ต่อ 100 กม.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={evEfficiency}
                  onChange={(e) => setEvEfficiency(Number(e.target.value))}
                  className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-xs text-white outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">มาตรฐานเฉลี่ยรถยนต์ไฟฟ้าทั่วไปอยู่ที่ 14 - 18 kWh/100km</span>
              </div>
            </div>
          </div>

          {/* Results Comparison Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-ev-border bg-ev-card/40 p-6">
              <h3 className="text-md font-bold text-white mb-6">สรุปผลการเปรียบเทียบค่าใช้จ่ายรายเดือน</h3>
              
              {/* Cost Rows */}
              <div className="space-y-5">
                {/* ICE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Fuel className="h-3.5 w-3.5 text-red-400" /> รถยนต์น้ำมันเดิม
                    </span>
                    <span className="font-extrabold text-white">{new Intl.NumberFormat('th-TH').format(Math.round(monthlyFuelCost))} บาท</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full w-full" />
                  </div>
                </div>

                {/* EV Home Off Peak */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-electric-green" /> ชาร์จไฟบ้านช่วงถูก (TOU Off-peak, 2.63 ฿)
                    </span>
                    <span className="font-extrabold text-electric-green">{new Intl.NumberFormat('th-TH').format(Math.round(costOffPeak))} บาท</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-electric-green rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (costOffPeak / monthlyFuelCost) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">ประหยัดเดือนละ: {new Intl.NumberFormat('th-TH').format(Math.round(savingsOffPeak))} ฿ | ปีละ {new Intl.NumberFormat('th-TH').format(Math.round(savingsOffPeak * 12))} ฿</span>
                </div>

                {/* EV Home On Peak */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-orange-400" /> ชาร์จไฟบ้านช่วงแพง (TOU On-peak, 5.80 ฿)
                    </span>
                    <span className="font-extrabold text-orange-400">{new Intl.NumberFormat('th-TH').format(Math.round(costOnPeak))} บาท</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (costOnPeak / monthlyFuelCost) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">ประหยัดเดือนละ: {new Intl.NumberFormat('th-TH').format(Math.round(savingsOnPeak))} ฿ | ปีละ {new Intl.NumberFormat('th-TH').format(Math.round(savingsOnPeak * 12))} ฿</span>
                </div>

                {/* EV Public Station */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-electric-blue" /> ชาร์จสถานีชาร์จสาธารณะ (เฉลี่ย 7.50 ฿)
                    </span>
                    <span className="font-extrabold text-electric-blue">{new Intl.NumberFormat('th-TH').format(Math.round(costPublicDc))} บาท</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-electric-blue rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (costPublicDc / monthlyFuelCost) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">ประหยัดเดือนละ: {new Intl.NumberFormat('th-TH').format(Math.round(savingsPublicDc))} ฿ | ปีละ {new Intl.NumberFormat('th-TH').format(Math.round(savingsPublicDc * 12))} ฿</span>
                </div>
              </div>
            </div>
            
            {/* Visual Callout */}
            <div className="rounded-2xl border border-electric-green/20 bg-gradient-to-r from-electric-green/5 to-electric-blue/5 p-6 flex items-start gap-4">
              <Sparkles className="h-6 w-6 text-electric-green flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">ประเมินมูลค่าความคุ้มค่าระยะยาว</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1 font-normal">
                  หากคุณชาร์จรถยนต์ไฟฟ้าที่บ้านเป็นส่วนใหญ่ในช่วงเวลา Off-peak (หลัง 4 ทุ่มเป็นต้นไป) เป็นระยะเวลา 5 ปี คุณจะสามารถประหยัดเงินค่าเชื้อเพลิงได้เฉลี่ยถึง{' '}
                  <strong className="text-electric-green font-bold text-sm">
                    {new Intl.NumberFormat('th-TH').format(Math.round(savingsOffPeak * 12 * 5))} บาท!
                  </strong>{' '}
                  ซึ่งเทียบเท่ากับครึ่งหนึ่งของราคารถยนต์ไฟฟ้าพรีเมียมขนาดกะทัดรัดเลยทีเดียว
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Charging Time Simulator Content
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-slide-up">
          {/* Inputs Column */}
          <div className="lg:col-span-5 rounded-2xl border border-ev-border bg-ev-card/20 p-6 space-y-6">
            <h3 className="text-md font-bold text-white border-b border-ev-border/50 pb-3">กำหนดค่าการชาร์จไฟ</h3>

            {/* Car Model Picker for Time Simulator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTimePickerOpen(prev => !prev)}
                className="w-full flex items-center justify-between rounded-lg border border-electric-blue/40 bg-electric-blue/5 px-3 py-2 text-xs font-semibold text-electric-blue hover:bg-electric-blue/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  {timeSelectedCar
                    ? `${timeSelectedCar.brand} ${timeSelectedCar.model} (${timeSelectedCar.trim})`
                    : 'เลือกรุ่นรถเพื่อตั้งค่าอัตโนมัติ...'}
                </span>
                <div className="flex items-center gap-1">
                  {timeSelectedCar && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); setTimeSelectedCar(null); }}
                      onKeyDown={e => e.key === 'Enter' && setTimeSelectedCar(null)}
                      className="p-0.5 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      <XIcon className="h-3 w-3" />
                    </span>
                  )}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${timePickerOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Dropdown */}
              {timePickerOpen && (
                <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-ev-border bg-slate-950 shadow-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-ev-border/40">
                    <Search className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="ค้นหายี่ห้อ / รุ่น..."
                      value={timePickerSearch}
                      onChange={e => setTimePickerSearch(e.target.value)}
                      className="w-full bg-transparent text-xs text-white outline-none placeholder-slate-600"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {Object.keys(groupedTimeCars).length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-500">ไม่พบรุ่นที่ค้นหา</div>
                    ) : (
                      Object.entries(groupedTimeCars).map(([brand, brandCars]) => (
                        <div key={brand}>
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-900/60 sticky top-0">{brand}</div>
                          {brandCars.map(car => (
                            <button
                              key={car._id}
                              type="button"
                              onClick={() => handlePickTimeCar(car)}
                              className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-800 transition-colors border-b border-ev-border/10 last:border-0"
                            >
                              <span className="font-bold text-white">{car.model}</span>
                              <span className="ml-2 text-[10px] text-electric-blue">{car.trim}</span>
                              <div className="flex gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-500">แบต {car.batteryCapacity} kWh</span>
                                <span className="text-[10px] text-electric-green">AC {car.acChargePower} kW</span>
                                <span className="text-[10px] text-electric-blue">DC {car.dcChargePower} kW</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected car summary chips */}
            {timeSelectedCar && (
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-lg border border-ev-border bg-slate-900/60 px-2.5 py-1 text-[10px] font-semibold text-white">
                  ⚡ แบต <strong className="text-electric-blue ml-1">{timeSelectedCar.batteryCapacity} kWh</strong>
                </span>
                <span className="flex items-center gap-1 rounded-lg border border-ev-border bg-slate-900/60 px-2.5 py-1 text-[10px] font-semibold text-white">
                  AC Max <strong className="text-electric-green ml-1">{timeSelectedCar.acChargePower} kW</strong>
                </span>
                <span className="flex items-center gap-1 rounded-lg border border-ev-border bg-slate-900/60 px-2.5 py-1 text-[10px] font-semibold text-white">
                  DC Max <strong className="text-electric-blue ml-1">{timeSelectedCar.dcChargePower} kW</strong>
                </span>
              </div>
            )}

            {/* Battery Size */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">ขนาดความจุแบตเตอรี่ (kWh)</label>
              <input
                type="number"
                value={batterySize}
                onChange={(e) => setBatterySize(Number(e.target.value))}
                className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-slate-700"
              />
            </div>

            {/* Slider: Start and End SoC */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">ระดับพลังงานเริ่มต้น</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={startSoc}
                    onChange={(e) => setStartSoc(Math.min(Number(e.target.value), endSoc - 5))}
                    className="w-full accent-electric-green"
                  />
                  <span className="text-xs font-bold text-white w-10 text-right">{startSoc}%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">ระดับเป้าหมายที่ต้องการ</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={endSoc}
                    onChange={(e) => setEndSoc(Math.max(Number(e.target.value), startSoc + 5))}
                    className="w-full accent-electric-blue"
                  />
                  <span className="text-xs font-bold text-white w-10 text-right">{endSoc}%</span>
                </div>
              </div>
            </div>

            {/* Charger Speed Selectors */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">กำลังไฟฟ้าของหัวชาร์จ (kW)</label>
              <div className="flex items-center space-x-3 mb-4">
                <input
                  type="number"
                  value={chargerSpeed}
                  onChange={(e) => setChargerSpeed(Number(e.target.value))}
                  className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-slate-700"
                />
                <select
                  value={chargerType}
                  onChange={(e) => setChargerType(e.target.value as 'AC' | 'DC')}
                  className="rounded-xl border border-ev-border bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="AC">AC (ไฟฟ้ากระแสสลับ)</option>
                  <option value="DC">DC (ไฟฟ้ากระแสตรง)</option>
                </select>
              </div>

              {/* Charger Presets */}
              <div className="space-y-2">
                <span className="block text-[10px] font-semibold text-slate-500 uppercase">ประเภทตู้ชาร์จยอดนิยม:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetCharger(7, 'AC')}
                    className={`px-3 py-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      chargerSpeed === 7 && chargerType === 'AC' 
                        ? 'border-electric-green text-electric-green bg-electric-green/5' 
                        : 'border-ev-border bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    Home Wallbox AC 7kW
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetCharger(11, 'AC')}
                    className={`px-3 py-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      chargerSpeed === 11 && chargerType === 'AC' 
                        ? 'border-electric-green text-electric-green bg-electric-green/5' 
                        : 'border-ev-border bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    Home/Mall AC 11kW
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetCharger(50, 'DC')}
                    className={`px-3 py-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      chargerSpeed === 50 && chargerType === 'DC' 
                        ? 'border-electric-blue text-electric-blue bg-electric-blue/5' 
                        : 'border-ev-border bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    Public DC 50kW (ปานกลาง)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPresetCharger(120, 'DC')}
                    className={`px-3 py-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      chargerSpeed === 120 && chargerType === 'DC' 
                        ? 'border-electric-blue text-electric-blue bg-electric-blue/5' 
                        : 'border-ev-border bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    Public DC 120kW (ชาร์จด่วน)
                  </button>
                </div>
              </div>
            </div>

            {/* Spec Limits of Car */}
            <div className="border border-ev-border/60 bg-slate-900/30 rounded-xl p-4 space-y-3">
              <span className="block text-xs font-bold text-slate-400 uppercase">ขีดจำกัดกำลังชาร์จของรถยนต์ไฟฟ้า</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">รับ AC สูงสุด (kW)</label>
                  <input
                    type="number"
                    value={carMaxAcSpeed}
                    onChange={(e) => setCarMaxAcSpeed(Number(e.target.value))}
                    className="w-full rounded-lg border border-ev-border bg-slate-900 px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">รับ DC สูงสุด (kW)</label>
                  <input
                    type="number"
                    value={carMaxDcSpeed}
                    onChange={(e) => setCarMaxDcSpeed(Number(e.target.value))}
                    className="w-full rounded-lg border border-ev-border bg-slate-900 px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Simulator Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-ev-border bg-ev-card/40 p-6 flex flex-col items-center text-center">
              <h3 className="text-md font-bold text-white mb-6 w-full text-left">ผลลัพธ์การจำลองการชาร์จไฟฟ้า</h3>
              
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-dashed border-electric-blue/30 bg-gradient-to-br from-electric-blue/15 to-transparent relative mb-6">
                <div className="text-center">
                  <span className="block text-3xl font-extrabold text-white">
                    {timeResult.hours > 0 ? `${timeResult.hours} ชม.` : ''} {timeResult.minutes} นาที
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase block font-semibold">เวลาจำลองโดยประมาณ</span>
                </div>
              </div>

              {/* Data list */}
              <div className="w-full border-t border-ev-border/50 pt-6 space-y-4 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">พลังงานไฟฟ้าที่จะเข้าแบตเตอรี่:</span>
                  <span className="font-bold text-white">{energyAdded.toFixed(1)} kWh</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">ความเร็วการชาร์จสูงสุดที่รถรับได้ขณะชาร์จ:</span>
                  <span className="font-bold text-electric-green">{timeResult.avgSpeed} kW</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">ประเภทการชาร์จ:</span>
                  <span className="font-bold text-white">{chargerType === 'AC' ? 'กระแสสลับ (AC Normal Charge)' : 'กระแสตรง (DC Fast Charge)'}</span>
                </div>
              </div>
            </div>

            {/* Note alert curve */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">ข้อควรทราบเกี่ยวกับกราฟการชาร์จ (Charging Curve)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1 font-normal">
                  ระบบจำลองนี้คำนวณตามการทำงานจริงของแบตเตอรี่รถยนต์ไฟฟ้า โดยเมื่อชาร์จแบตเตอรี่เกิน 80% ขึ้นไป ระบบ BMS ของตัวรถจะสั่งปรับลดกำลังวัตต์การชาร์จ (Charging Deceleration) ลงแบบไล่ระดับ เพื่อป้องกันความร้อนสะสมยืดอายุแบตเตอรี่ ทำให้ช่วงเวลาชาร์จ 80% - 100% จะใช้เวลาค่อนข้างนานกว่าช่วง 10% - 80% อย่างมาก
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating comparison Selector */}
      <CompareSelector />
    </div>
  );
};

export default function CalculatorsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">กำลังดาวน์โหลดข้อมูลหน้าคำนวณ...</div>}>
      <CalculatorsContent />
    </Suspense>
  );
}
