'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Check, Plus, Star, Zap, Gauge, BatteryCharging } from 'lucide-react';
import CompareSelector, { SelectedCar } from './CompareSelector';

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
  avgRating?: number | null;
  reviewCount?: number;
}

interface CarsCatalogClientProps {
  initialCars: string; // Passed as serialized JSON
}

const CarsCatalogClient: React.FC<CarsCatalogClientProps> = ({ initialCars }) => {
  const cars: CarSpec[] = JSON.parse(initialCars);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
  const [selectedDriveTypes, setSelectedDriveTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(3000000);
  const [minRange, setMinRange] = useState<number>(0);
  const [v2lOnly, setV2lOnly] = useState(false);
  const [voltage800vOnly, setVoltage800vOnly] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Compare selection state
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  useEffect(() => {
    // Load initial compare state
    const loadCompare = () => {
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored) {
        try {
          const parsed: SelectedCar[] = JSON.parse(stored);
          setSelectedCompareIds(parsed.map(c => c.id));
        } catch (e) {
          console.error(e);
        }
      } else {
        setSelectedCompareIds([]);
      }
    };
    
    loadCompare();
    window.addEventListener('ev_compare_updated', loadCompare);
    return () => {
      window.removeEventListener('ev_compare_updated', loadCompare);
    };
  }, []);

  // Group cars by brand and model
  const groupedCars = React.useMemo(() => {
    const groups: { [key: string]: CarSpec[] } = {};
    cars.forEach((car) => {
      const key = `${car.brand} ${car.model}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(car);
    });

    return Object.entries(groups).map(([key, trims]) => {
      const first = trims[0];
      return {
        key,
        brand: first.brand,
        model: first.model,
        bodyType: first.bodyType,
        image: first.image,
        trims,
      };
    });
  }, [cars]);

  // Filter groups logic
  const filteredGroups = React.useMemo(() => {
    return groupedCars
      .map((group) => {
        const matchingTrims = group.trims.filter((trim) => {
          // 1. Search Query
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch =
            trim.brand.toLowerCase().includes(searchLower) ||
            trim.model.toLowerCase().includes(searchLower) ||
            trim.trim.toLowerCase().includes(searchLower);

          // 2. Brand
          const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(trim.brand);

          // 3. Price
          const matchesPrice = trim.price <= maxPrice;

          // 4. Range (WLTP, NEDC, or CLTC)
          const range = Math.max(trim.rangeWLTP, trim.rangeNEDC, trim.rangeCLTC);
          const matchesRange = range >= minRange;

          // 5. Body Type
          const matchesBody = selectedBodyTypes.length === 0 || selectedBodyTypes.includes(trim.bodyType);

          // 6. Drive Type
          const matchesDrive = selectedDriveTypes.length === 0 || selectedDriveTypes.includes(trim.driveType);

          // 7. V2L
          const matchesV2L = !v2lOnly || trim.v2lSupport;

          // 8. Voltage
          const matchesVoltage = !voltage800vOnly || trim.voltageArchitecture === '800V';

          return matchesSearch && matchesBrand && matchesPrice && matchesRange && matchesBody && matchesDrive && matchesV2L && matchesVoltage;
        });

        return {
          ...group,
          matchingTrims,
        };
      })
      .filter((group) => group.matchingTrims.length > 0);
  }, [groupedCars, searchQuery, selectedBrands, maxPrice, minRange, selectedBodyTypes, selectedDriveTypes, v2lOnly, voltage800vOnly]);

  const handleToggleCompareGroup = (matchingTrims: CarSpec[]) => {
    let currentSelection: SelectedCar[] = [];
    const stored = localStorage.getItem('ev_compare_selection');
    if (stored) {
      try {
        currentSelection = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }

    const selectedInGroup = matchingTrims.filter((t) => currentSelection.some((c) => c.id === t._id));
    const isAnySelected = selectedInGroup.length > 0;

    if (isAnySelected) {
      // Remove all matching trims of this group from comparison
      const updated = currentSelection.filter((c) => !matchingTrims.some((t) => t._id === c.id));
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    } else {
      // Add the first matching trim of the group
      if (currentSelection.length >= 4) {
        alert('เปรียบเทียบรถได้สูงสุดครั้งละ 4 คันครับ');
        return;
      }
      const car = matchingTrims[0];
      const newSelect: SelectedCar = {
        id: car._id,
        brand: car.brand,
        model: car.model,
        trim: car.trim,
        image: car.image,
        price: car.price,
      };
      const updated = [...currentSelection, newSelect];
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    }

    // Dispatch update
    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  const formatPriceRange = (min: number, max: number) => {
    if (min === max) {
      return `${new Intl.NumberFormat('th-TH').format(min)} ฿`;
    }
    return `${new Intl.NumberFormat('th-TH').format(min)} - ${new Intl.NumberFormat('th-TH').format(max)} ฿`;
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedBodyTypes([]);
    setSelectedDriveTypes([]);
    setMaxPrice(3000000);
    setMinRange(0);
    setV2lOnly(false);
    setVoltage800vOnly(false);
  };

  const brands = React.useMemo(() => {
    const unique = new Set(cars.map(c => c.brand));
    return Array.from(unique).sort();
  }, [cars]);

  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'MPV'];
  const driveTypes = ['RWD', 'FWD', 'AWD'];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
          ค้นหาและกรองสเปครถยนต์ไฟฟ้า
        </h1>
        <p className="mt-2 text-sm text-slate-400">ค้นหารถ EV ที่เหมาะกับสไตล์การขับขี่และงบประมาณของคุณ</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-ev-card/40 border border-ev-border rounded-xl p-6 sticky top-24">
          <div className="flex items-center justify-between border-b border-ev-border pb-4 mb-6">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-electric-green" />
              <span>ตัวกรองขั้นสูง</span>
            </h2>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-slate-400 hover:text-electric-green transition-colors focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none rounded-sm px-1.5 py-0.5"
            >
              ล้างทั้งหมด
            </button>
          </div>

          {/* Price Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              งบประมาณสูงสุด: <span className="text-electric-green">{(maxPrice / 1000000).toFixed(2)} ล้านบาท</span>
            </label>
            <input
              type="range"
              min="500000"
              max="3000000"
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>5 แสน</span>
              <span>1.75 ล้าน</span>
              <span>3 ล้าน+</span>
            </div>
          </div>

          {/* Range Filter */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              ระยะทางวิ่งขั้นต่ำ: <span className="text-electric-blue">{minRange} กม.</span>
            </label>
            <input
              type="range"
              min="0"
              max="700"
              step="20"
              value={minRange}
              onChange={(e) => setMinRange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-electric-blue focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
              <span>0 กม.</span>
              <span>350 กม.</span>
              <span>700 กม.+</span>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-300 mb-3">ยี่ห้อ (Brand)</span>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center text-sm text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => {
                      setSelectedBrands(prev =>
                        prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                      );
                    }}
                    className="mr-3 h-4 w-4 rounded border-ev-border bg-slate-900 text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer accent-electric-green"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>

          {/* Body Type */}
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-300 mb-3">ประเภทตัวถัง</span>
            <div className="space-y-2">
              {bodyTypes.map((type) => (
                <label key={type} className="flex items-center text-sm text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
                  <input
                    type="checkbox"
                    checked={selectedBodyTypes.includes(type)}
                    onChange={() => {
                      setSelectedBodyTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      );
                    }}
                    className="mr-3 h-4 w-4 rounded border-ev-border bg-slate-900 text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer accent-electric-green"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Drive Type */}
          <div className="mb-6">
            <span className="block text-sm font-semibold text-slate-300 mb-3">ระบบขับเคลื่อน</span>
            <div className="space-y-2">
              {driveTypes.map((type) => (
                <label key={type} className="flex items-center text-sm text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
                  <input
                    type="checkbox"
                    checked={selectedDriveTypes.includes(type)}
                    onChange={() => {
                      setSelectedDriveTypes(prev =>
                        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                      );
                    }}
                    className="mr-3 h-4 w-4 rounded border-ev-border bg-slate-900 text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer accent-electric-green"
                  />
                  {type === 'FWD' ? 'ขับเคลื่อนล้อหน้า (FWD)' : type === 'RWD' ? 'ขับเคลื่อนล้อหลัง (RWD)' : 'ขับเคลื่อนสี่ล้อ (AWD)'}
                </label>
              ))}
            </div>
          </div>

          {/* Special Tech */}
          <div className="border-t border-ev-border pt-6 space-y-3">
            <label className="flex items-center text-sm text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
              <input
                type="checkbox"
                checked={v2lOnly}
                onChange={(e) => setV2lOnly(e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-ev-border bg-slate-900 text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer accent-electric-green"
              />
              จ่ายไฟภายนอก (V2L)
            </label>
            <label className="flex items-center text-sm text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
              <input
                type="checkbox"
                checked={voltage800vOnly}
                onChange={(e) => setVoltage800vOnly(e.target.checked)}
                className="mr-3 h-4 w-4 rounded border-ev-border bg-slate-900 text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer accent-electric-green"
              />
              สถาปัตยกรรม 800V
            </label>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 w-full">
          {/* Search Bar & Mobile Filter Toggle */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full flex-grow">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหายี่ห้อ รุ่น หรือประเภทสเปค เช่น Tesla Model Y..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-sm border border-ev-border bg-ev-card/40 py-3.5 pl-12 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:border-electric-green focus:ring-1 focus:ring-electric-green transition-all duration-300"
              />
            </div>
            
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="lg:hidden flex items-center justify-center gap-2 rounded-xl border border-ev-border bg-ev-card px-4 py-3.5 text-sm text-white w-full sm:w-auto hover:bg-slate-800 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
            >
              <SlidersHorizontal className="h-4 w-4 text-electric-green" />
              <span>ตัวกรองการค้นหา</span>
            </button>
          </div>

          {/* Mobile Filters Dropdown */}
          {showFiltersMobile && (
            <div className="lg:hidden w-full bg-ev-card border border-ev-border rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between border-b border-ev-border pb-4 mb-4">
                <h3 className="font-bold text-white">คัดกรองผลลัพธ์</h3>
                <button onClick={handleResetFilters} className="text-xs text-slate-400 hover:text-electric-green focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none rounded-sm px-1 py-0.5">ล้างตัวกรอง</button>
              </div>
 
              {/* Price Filter Mobile */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  งบประมาณสูงสุด: <span className="text-electric-green">{(maxPrice / 1000000).toFixed(2)} ล้านบาท</span>
                </label>
                <input
                  type="range"
                  min="500000"
                  max="3000000"
                  step="50000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-electric-green bg-slate-800 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none rounded-lg"
                />
              </div>
 
              {/* Range Filter Mobile */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  ระยะทางวิ่งขั้นต่ำ: <span className="text-electric-blue">{minRange} กม.</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="700"
                  step="20"
                  value={minRange}
                  onChange={(e) => setMinRange(Number(e.target.value))}
                  className="w-full accent-electric-blue bg-slate-800 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none rounded-lg"
                />
              </div>

              {/* Brand Mobile */}
              <div className="mb-4">
                <span className="block text-xs font-semibold text-slate-400 mb-2">ยี่ห้อ (Brand)</span>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => {
                    const isSelected = selectedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => {
                          setSelectedBrands(prev =>
                            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none ${
                          isSelected 
                            ? 'bg-electric-green/10 border-electric-green text-electric-green' 
                            : 'border-ev-border bg-slate-900 text-slate-400'
                        }`}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Body Type Mobile */}
              <div className="mb-4">
                <span className="block text-xs font-semibold text-slate-400 mb-2">ประเภทตัวถัง</span>
                <div className="flex flex-wrap gap-2">
                  {bodyTypes.map((type) => {
                    const isSelected = selectedBodyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedBodyTypes(prev =>
                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none ${
                          isSelected 
                            ? 'bg-electric-green/10 border-electric-green text-electric-green' 
                            : 'border-ev-border bg-slate-900 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Drive Type Mobile */}
              <div className="mb-4">
                <span className="block text-xs font-semibold text-slate-400 mb-2">ระบบขับเคลื่อน</span>
                <div className="flex flex-wrap gap-2">
                  {driveTypes.map((type) => {
                    const isSelected = selectedDriveTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedDriveTypes(prev =>
                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-electric-blue focus-visible:outline-none ${
                          isSelected 
                            ? 'bg-electric-blue/10 border-electric-blue text-electric-blue' 
                            : 'border-ev-border bg-slate-900 text-slate-400'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
 
              {/* Special Options Mobile */}
              <div className="flex gap-4 pt-4 border-t border-ev-border/50">
                <label className="flex items-center text-xs text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
                  <input
                    type="checkbox"
                    checked={v2lOnly}
                    onChange={(e) => setV2lOnly(e.target.checked)}
                    className="mr-2 h-4 w-4 accent-electric-green bg-slate-900 border-ev-border rounded focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer"
                  />
                  จ่ายไฟ V2L
                </label>
                <label className="flex items-center text-xs text-slate-400 hover:text-white cursor-pointer select-none focus-within:text-white">
                  <input
                    type="checkbox"
                    checked={voltage800vOnly}
                    onChange={(e) => setVoltage800vOnly(e.target.checked)}
                    className="mr-2 h-4 w-4 accent-electric-green bg-slate-900 border-ev-border rounded focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:ring-offset-2 focus-visible:ring-offset-ev-dark outline-none cursor-pointer"
                  />
                  ระบบ 800V
                </label>
              </div>
            </div>
          )}

          {/* Results Info */}
          <div className="flex items-center justify-between mb-6 text-sm text-slate-400">
            <span>พบรถยนต์ไฟฟ้าทั้งหมด <span className="font-semibold text-white">{filteredGroups.length}</span> รุ่นหลัก</span>
            {(searchQuery || selectedBrands.length > 0 || selectedBodyTypes.length > 0 || selectedDriveTypes.length > 0 || maxPrice < 3000000 || minRange > 0 || v2lOnly || voltage800vOnly) && (
              <button onClick={handleResetFilters} className="text-electric-green hover:underline focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none rounded-sm px-1">ล้างตัวกรองทั้งหมด</button>
            )}
          </div>
 
          {/* Cars Grid */}
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ev-border py-16 text-center">
              <span className="text-slate-400 font-medium">ไม่พบรถยนต์ไฟฟ้าที่ตรงกับเงื่อนไขการค้นหาของคุณ</span>
              <button
                onClick={handleResetFilters}
                className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
              >
                ดูสเปครถทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => {
                const matchingTrims = group.matchingTrims;
                const isSelectedForCompare = matchingTrims.some((t) => selectedCompareIds.includes(t._id));
                
                // Calculate spec ranges for matching trims
                const prices = matchingTrims.map((t) => t.price);
                const minPrice = Math.min(...prices);
                const maxPriceVal = Math.max(...prices);

                const ranges = matchingTrims.map((t) => Math.max(t.rangeWLTP, t.rangeNEDC, t.rangeCLTC));
                const minRangeVal = Math.min(...ranges);
                const maxRangeVal = Math.max(...ranges);

                const dcPowers = matchingTrims.map((t) => t.dcChargePower);
                const minDc = Math.min(...dcPowers);
                const maxDc = Math.max(...dcPowers);

                const hps = matchingTrims.map((t) => t.horsepower);
                const minHp = Math.min(...hps);
                const maxHp = Math.max(...hps);

                const displayRange = minRangeVal === maxRangeVal
                  ? `${minRangeVal} กม.`
                  : `${minRangeVal}-${maxRangeVal} กม.`;

                const displayDC = minDc === maxDc
                  ? `${minDc} kW`
                  : `${minDc}-${maxDc} kW`;

                const displayHp = minHp === maxHp
                  ? `${minHp} HP`
                  : `${minHp}-${maxHp} HP`;

                const car = matchingTrims[0]; // Representative trim

                return (
                  <div
                    key={group.key}
                    className="group/card flex flex-col overflow-hidden rounded-xl border border-ev-border bg-ev-card/40 transition-all duration-300 hover:border-slate-600"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={car.image}
                        alt={`${group.brand} ${group.model}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                      <div className="absolute top-3 right-3 rounded-lg bg-ev-dark/85 px-2 py-0.5 text-[10px] font-bold border border-ev-border text-electric-green uppercase">
                        {group.bodyType}
                      </div>
                    </div>
 
                    {/* Specifications Details */}
                    <div className="flex flex-col p-6 flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{group.brand}</span>
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

                      <h3 className="mt-1 text-md font-bold text-white leading-tight">
                        {group.model}
                      </h3>
                      
                      <div className="flex items-baseline justify-between mt-1.5 mb-1 gap-2">
                        <span className="text-xs text-slate-400">
                          {group.trims.length > 1 ? `${group.trims.length} รุ่นย่อย` : car.trim}
                        </span>
                        <span className="text-xs font-extrabold text-electric-green text-right">
                          {formatPriceRange(minPrice, maxPriceVal)}
                        </span>
                      </div>

                      {/* Specs Row */}
                      <div className="grid grid-cols-3 gap-2 border-y border-ev-border/50 py-3 my-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Zap className="h-3.5 w-3.5 text-slate-400 mb-1" />
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">พละกำลัง</span>
                          <span className="text-xs font-bold text-white leading-tight">
                            {displayHp}
                          </span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <Gauge className="h-3.5 w-3.5 text-electric-green mb-1" />
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">ระยะทาง</span>
                          <span className="text-xs font-bold text-electric-green">{displayRange}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <BatteryCharging className="h-3.5 w-3.5 text-electric-blue mb-1" />
                          <span className="text-[9px] text-slate-400 uppercase font-semibold">ชาร์จ DC</span>
                          <span className="text-xs font-bold text-electric-blue">{displayDC}</span>
                        </div>
                      </div>

                      <div className="mt-auto flex gap-3">
                        <Link
                          href={`/cars/${car._id}`}
                          className="flex-grow text-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 py-2.5 text-xs font-bold text-white transition-all duration-200 border border-transparent hover:border-slate-600 focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none"
                        >
                          เจาะลึกสเปค
                        </Link>
                        
                        <button
                          onClick={() => handleToggleCompareGroup(matchingTrims)}
                          className={`px-3 rounded-xl border transition-all duration-300 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-electric-green focus-visible:outline-none ${
                            isSelectedForCompare 
                              ? 'bg-electric-green/10 border-electric-green text-electric-green' 
                              : 'border-ev-border text-slate-400 hover:text-white hover:border-slate-700'
                          }`}
                          title={isSelectedForCompare ? "ลบออกจากการเปรียบเทียบ" : "เพิ่มเข้าการเปรียบเทียบ"}
                        >
                          {isSelectedForCompare ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Floating comparison selector */}
      <CompareSelector />
    </div>
  );
};

export default CarsCatalogClient;
