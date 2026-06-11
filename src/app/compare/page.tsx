'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftRight, X, Plus, Sparkles, EyeOff, Check, Minus, Search, Zap, ChevronRight } from 'lucide-react';
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

/* ─── Skeleton loader ─── */
const TableSkeleton = () => (
  <div className="w-full rounded-xl border border-ev-border bg-ev-card/10 overflow-hidden">
    {/* Header skeleton */}
    <div className="flex border-b border-ev-border">
      <div className="w-48 shrink-0 bg-ev-dark/80 p-6">
        <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="flex-1 min-w-[200px] p-6 flex flex-col items-center gap-3">
          <div className="h-20 w-28 rounded-lg bg-slate-800 animate-pulse" />
          <div className="h-3 w-16 rounded bg-slate-800 animate-pulse" />
          <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
          <div className="h-3 w-20 rounded bg-slate-800 animate-pulse" />
        </div>
      ))}
    </div>
    {/* Row skeletons */}
    {Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="flex border-b border-ev-border/40">
        <div className="w-48 shrink-0 bg-ev-dark/80 px-6 py-4">
          <div className="h-3 w-32 rounded bg-slate-800 animate-pulse" />
        </div>
        {[1, 2, 3].map(j => (
          <div key={j} className="flex-1 min-w-[200px] px-6 py-4 flex justify-center">
            <div className="h-3 w-20 rounded bg-slate-800 animate-pulse" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ─── Boolean value component ─── */
const BooleanValue = ({ value }: { value: boolean }) => (
  value ? (
    <span className="inline-flex items-center gap-1.5 text-electric-green font-semibold text-sm">
      <Check className="h-4 w-4" strokeWidth={2.5} />
      <span>รองรับ</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-sm">
      <Minus className="h-4 w-4" strokeWidth={2} />
      <span>ไม่มี</span>
    </span>
  )
);

/* ─── Matchup generation algorithm ─── */
interface Matchup {
  cars: [CarSpec, CarSpec];
  reason: string;
  tag: string;
  similarity: number;
}

/**
 * Finds the best representative trim per brand+model.
 * Picks the mid-priced trim to avoid comparing bottom vs top trims.
 */
const pickRepresentativeTrim = (cars: CarSpec[]): CarSpec[] => {
  const grouped = new Map<string, CarSpec[]>();
  for (const car of cars) {
    const key = `${car.brand}::${car.model}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(car);
  }
  const reps: CarSpec[] = [];
  for (const trims of grouped.values()) {
    trims.sort((a, b) => a.price - b.price);
    // Pick middle trim
    reps.push(trims[Math.floor(trims.length / 2)]);
  }
  return reps;
};

const generateMatchups = (allCars: CarSpec[], maxResults = 6): Matchup[] => {
  if (allCars.length < 2) return [];

  const reps = pickRepresentativeTrim(allCars);
  const matchups: Matchup[] = [];

  for (let i = 0; i < reps.length; i++) {
    for (let j = i + 1; j < reps.length; j++) {
      const a = reps[i];
      const b = reps[j];

      // Must be different brands
      if (a.brand === b.brand) continue;

      // Must be same body type
      if (a.bodyType !== b.bodyType) continue;

      // Price similarity (within 35%)
      const priceDiff = Math.abs(a.price - b.price);
      const avgPrice = (a.price + b.price) / 2;
      const priceRatio = priceDiff / avgPrice;
      if (priceRatio > 0.35) continue;

      // Size similarity (length within 300mm)
      const lengthDiff = Math.abs(a.length - b.length);
      if (lengthDiff > 300) continue;

      // Compute similarity score (0-100, higher = more similar)
      const priceScore = Math.max(0, 1 - priceRatio) * 40;
      const lengthScore = Math.max(0, 1 - lengthDiff / 300) * 25;

      // Battery similarity bonus
      const battAvg = (a.batteryCapacity + b.batteryCapacity) / 2;
      const battDiff = battAvg > 0 ? Math.abs(a.batteryCapacity - b.batteryCapacity) / battAvg : 0;
      const battScore = Math.max(0, 1 - battDiff) * 20;

      // HP similarity bonus
      const hpAvg = (a.horsepower + b.horsepower) / 2;
      const hpDiff = hpAvg > 0 ? Math.abs(a.horsepower - b.horsepower) / hpAvg : 0;
      const hpScore = Math.max(0, 1 - hpDiff) * 15;

      const similarity = Math.round(priceScore + lengthScore + battScore + hpScore);

      // Generate matchup reason
      let reason: string;
      let tag: string;
      if (priceRatio < 0.1) {
        reason = `ราคาใกล้เคียงกัน ในเซกเมนต์ ${a.bodyType}`;
        tag = 'ราคาใกล้เคียง';
      } else if (lengthDiff < 100) {
        reason = `ขนาดใกล้เคียงกัน ${a.bodyType} คู่แข่งโดยตรง`;
        tag = 'ขนาดเดียวกัน';
      } else if (battDiff < 0.15) {
        reason = `แบตเตอรี่ขนาดใกล้เคียง ในกลุ่ม ${a.bodyType}`;
        tag = 'แบตใกล้เคียง';
      } else {
        reason = `คู่แข่ง ${a.bodyType} ต่างยี่ห้อ`;
        tag = 'คู่แข่งตรง';
      }

      matchups.push({ cars: [a, b], reason, tag, similarity });
    }
  }

  // Sort by similarity score, take top N
  matchups.sort((a, b) => b.similarity - a.similarity);
  return matchups.slice(0, maxResults);
};

/* ─── Popular Matchup Card ─── */
const MatchupCard = ({
  matchup,
  onSelect,
}: {
  matchup: Matchup;
  onSelect: (cars: [CarSpec, CarSpec]) => void;
}) => {
  const [a, b] = matchup.cars;
  return (
    <button
      onClick={() => onSelect(matchup.cars)}
      className="group w-full rounded-xl border border-ev-border bg-ev-card/40 hover:bg-ev-card/80 hover:border-slate-500 transition-all duration-150 p-4 text-left"
    >
      {/* Tag */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-electric-green uppercase tracking-wide">
          <Zap className="h-3 w-3" />
          {matchup.tag}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors duration-150" />
      </div>

      {/* Car pair */}
      <div className="flex items-center gap-3">
        {/* Car A */}
        <div className="flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.image}
            alt={a.model}
            className="h-14 w-full rounded-lg object-cover border border-ev-border/60"
          />
          <p className="mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{a.brand}</p>
          <p className="text-xs font-bold text-white truncate leading-tight">{a.model}</p>
        </div>

        {/* VS divider */}
        <div className="shrink-0 flex flex-col items-center">
          <span className="text-[10px] font-extrabold text-slate-500">VS</span>
        </div>

        {/* Car B */}
        <div className="flex-1 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.image}
            alt={b.model}
            className="h-14 w-full rounded-lg object-cover border border-ev-border/60"
          />
          <p className="mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{b.brand}</p>
          <p className="text-xs font-bold text-white truncate leading-tight">{b.model}</p>
        </div>
      </div>

      {/* Reason */}
      <p className="mt-2.5 text-[11px] text-slate-500 leading-snug truncate">{matchup.reason}</p>
    </button>
  );
};

/* ─── Popular Matchups Section ─── */
const PopularMatchups = ({
  matchups,
  onSelect,
  variant = 'full',
}: {
  matchups: Matchup[];
  onSelect: (cars: [CarSpec, CarSpec]) => void;
  variant?: 'full' | 'compact';
}) => {
  if (matchups.length === 0) return null;

  return (
    <div className={variant === 'compact' ? 'mt-8' : ''}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-electric-green" />
        <h2 className="text-sm font-bold text-white">
          {variant === 'full' ? 'คู่เปรียบเทียบยอดนิยม' : 'ลองเปรียบเทียบคู่อื่น'}
        </h2>
        <span className="text-xs text-slate-500 font-medium">— รุ่นที่คล้ายกันต่างยี่ห้อ</span>
      </div>
      <div className={`grid gap-3 ${
        variant === 'full'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {matchups.slice(0, variant === 'full' ? 6 : 3).map((m, i) => (
          <MatchupCard key={`${m.cars[0]._id}-${m.cars[1]._id}-${i}`} matchup={m} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

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
    formatter?: (val: any) => string | React.ReactNode,
    betterDirection?: 'higher' | 'lower',
    isBooleanRow?: boolean
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
        className={`transition-colors duration-150 ${highlightDiffs && rowIsDifferent && selectedCars.length > 1
            ? 'bg-ev-highlight/10 border-l-2 border-l-ev-highlight'
            : 'border-b border-ev-border/40 hover:bg-ev-card/40'
          }`}
      >
        <td className="px-6 py-3.5 text-xs font-bold text-slate-400 whitespace-nowrap bg-ev-dark/90 sticky left-0 z-10 w-48 border-r border-ev-border/30">
          {label}
        </td>
        {selectedCars.map((car) => {
          const val = fieldExtractor(car);
          const isOptimal = optimalValue !== null && Number(val) === optimalValue;

          if (isBooleanRow) {
            return (
              <td
                key={car._id}
                className="px-6 py-3.5 text-center whitespace-nowrap min-w-[200px]"
              >
                <BooleanValue value={!!val} />
              </td>
            );
          }

          return (
            <td
              key={car._id}
              className={`px-6 py-3.5 text-sm font-semibold text-center whitespace-nowrap min-w-[200px] ${isOptimal
                  ? 'text-electric-green font-extrabold bg-electric-green/10'
                  : 'text-white'
                }`}
            >
              {formatter ? formatter(val) : String(val)}
            </td>
          );
        })}
        {/* Fill empty slots */}
        {Array.from({ length: Math.max(0, 4 - selectedCars.length) }).map((_, i) => (
          <td key={`empty-${i}`} className="px-6 py-3.5 text-slate-700 text-center">-</td>
        ))}
      </tr>
    );
  };

  /* ─── Section group header ─── */
  const renderSectionHeader = (label: string, accentColor: string) => (
    <tr className="bg-ev-card/60">
      <td
        colSpan={5}
        className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest sticky left-0"
        style={{ color: accentColor, borderBottom: `1px solid ${accentColor}33` }}
      >
        {label}
      </td>
    </tr>
  );

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

  // Generate popular matchups from loaded car data
  const popularMatchups = generateMatchups(allCars);

  const handleMatchupSelect = (cars: [CarSpec, CarSpec]) => {
    updateCompareSelection(cars);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ textWrap: 'balance' }}>
            เปรียบเทียบสเปคเจาะลึก
          </h1>
          <p className="text-sm text-slate-400 mt-1">วิเคราะห์ข้อมูลความแตกต่างของรถยนต์ไฟฟ้าแต่ละรุ่นแบบเคียงข้างกัน</p>
        </div>

        {selectedCars.length > 1 && (
          <div className="flex gap-3">
            <button
              onClick={() => setHighlightDiffs(!highlightDiffs)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border ${highlightDiffs
                  ? 'bg-ev-highlight/10 border-ev-highlight text-ev-highlight'
                  : 'border-ev-border text-slate-400 hover:text-white hover:border-slate-500'
                }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>{highlightDiffs ? 'ปิดไฮไลท์จุดต่าง' : 'ไฮไลท์จุดต่าง'}</span>
            </button>

            <button
              onClick={() => setHideIdentical(!hideIdentical)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 border ${hideIdentical
                  ? 'bg-electric-blue/10 border-electric-blue text-electric-blue'
                  : 'border-ev-border text-slate-400 hover:text-white hover:border-slate-500'
                }`}
            >
              <EyeOff className="h-4 w-4" />
              <span>{hideIdentical ? 'แสดงสเปคทั้งหมด' : 'ซ่อนแถวที่เหมือนกัน'}</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : selectedCars.length === 0 ? (
        /* ─── Empty state ─── */
        <>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ev-border py-16 text-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-xl border border-ev-border bg-ev-card flex items-center justify-center mb-5">
            <ArrowLeftRight className="h-7 w-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-bold text-white">ยังไม่ได้เลือกคู่เปรียบเทียบ</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-sm px-4 leading-relaxed">
            เลือกรถยนต์ไฟฟ้า 2–4 รุ่น เพื่อเปรียบเทียบสเปคแบบเคียงข้าง
          </p>

          {/* Steps */}
          <div className="mt-6 w-full max-w-xs px-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="shrink-0 h-6 w-6 rounded-md bg-ev-card border border-ev-border text-[11px] font-bold text-slate-300 flex items-center justify-center">1</span>
              <p className="text-xs text-slate-400 pt-0.5">ค้นหารถยนต์ไฟฟ้าที่สนใจในช่องด้านล่าง</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 h-6 w-6 rounded-md bg-ev-card border border-ev-border text-[11px] font-bold text-slate-300 flex items-center justify-center">2</span>
              <p className="text-xs text-slate-400 pt-0.5">เลือกรุ่นเพิ่มเติมเพื่อเปรียบเทียบข้อมูล</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 h-6 w-6 rounded-md bg-ev-card border border-ev-border text-[11px] font-bold text-slate-300 flex items-center justify-center">3</span>
              <p className="text-xs text-slate-400 pt-0.5">ใช้เครื่องมือไฮไลท์จุดต่างเพื่อวิเคราะห์ผล</p>
            </div>
          </div>

          {/* Search input */}
          <div className="mt-6 w-full max-w-xs relative px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="พิมพ์ค้นหารถเพื่อเริ่มเปรียบเทียบ..."
                value={slotSearchQuery}
                onChange={(e) => setSlotSearchQuery(e.target.value)}
                className="w-full rounded-md border border-ev-border bg-ev-card px-4 pl-9 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-electric-green/60 transition-colors duration-150"
              />
            </div>
            {slotSearchQuery && (
              <div className="absolute left-4 right-4 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-ev-border bg-ev-dark">
                {filteredDropdownOptions.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-xs">ไม่พบรถที่ค้นหา</div>
                ) : (
                  filteredDropdownOptions.map(car => (
                    <button
                      key={car._id}
                      onClick={() => handleAddCarToCompare(car)}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-ev-card hover:text-white border-b border-ev-border/30 last:border-b-0 flex items-center space-x-2 transition-colors duration-150"
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

        {/* Popular matchups in empty state */}
        {popularMatchups.length > 0 && (
          <div className="mt-10 w-full">
            <PopularMatchups matchups={popularMatchups} onSelect={handleMatchupSelect} variant="full" />
          </div>
        )}
        </>
      ) : (
        /* ─── Comparison table ─── */
        <>
        <div className="w-full overflow-x-auto rounded-xl border border-ev-border bg-ev-card/10 no-scrollbar relative">
          <table className="w-full border-collapse">
            {/* Sticky thead: Car images & names */}
            <thead className="sticky top-0 z-30 bg-ev-dark">
              <tr className="border-b border-ev-border">
                <th className="px-6 py-5 text-left bg-ev-dark sticky left-0 z-40 w-48 border-r border-ev-border/30">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">เปรียบเทียบสเปค</span>
                </th>
                {selectedCars.map((car) => (
                  <th key={car._id} className="px-6 py-5 text-center align-top min-w-[220px] bg-ev-dark">
                    <div className="relative flex flex-col items-center">
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveColumn(car._id)}
                        className="absolute -top-2 right-0 rounded-md bg-ev-card border border-ev-border p-1 text-slate-400 hover:text-red-400 hover:border-red-400/40 transition-colors duration-150"
                        title="ลบออก"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      {/* Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={car.image}
                        alt={car.model}
                        className="h-24 w-32 rounded-lg object-cover border border-ev-border"
                      />

                      {/* Info */}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-3">{car.brand}</span>
                      <h3 className="text-sm font-bold text-white mt-0.5 leading-tight">{car.model}</h3>
                      <p className="text-xs text-electric-green font-semibold mt-0.5">{car.trim}</p>

                      {/* Price — promoted to header */}
                      <p className="mt-2 text-base font-extrabold text-white tabular-nums">
                        {new Intl.NumberFormat('th-TH').format(car.price)}
                        <span className="text-xs text-slate-400 font-semibold ml-1">฿</span>
                      </p>

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
                            className="mt-2 text-[10px] font-bold bg-ev-card border border-ev-border text-slate-200 rounded-md px-2 py-1.5 outline-none focus:border-electric-green/60 cursor-pointer max-w-[180px] truncate transition-colors duration-150"
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
                        className="mt-2 text-[10px] font-bold text-electric-blue hover:underline"
                      >
                        ดูหน้ารายละเอียดหลัก
                      </Link>
                    </div>
                  </th>
                ))}

                {/* Empty add-car slots */}
                {Array.from({ length: 4 - selectedCars.length }).map((_, idx) => {
                  const slotIndex = selectedCars.length + idx;
                  const isSearching = activeSearchSlot === slotIndex;
                  return (
                    <th key={`empty-header-${idx}`} className="px-6 py-5 text-center align-middle min-w-[220px] bg-ev-dark">
                      <div className="relative border border-dashed border-ev-border/60 hover:border-slate-500 rounded-xl p-6 transition-colors duration-150 flex flex-col items-center justify-center min-h-[160px]">
                        {!isSearching ? (
                          <button
                            onClick={() => {
                              setActiveSearchSlot(slotIndex);
                              setSlotSearchQuery('');
                            }}
                            className="flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-colors duration-150"
                          >
                            <Plus className="h-8 w-8 rounded-lg border border-dashed border-ev-border p-1.5" />
                            <span className="text-[11px] font-bold">เพิ่มรุ่นเปรียบเทียบ</span>
                          </button>
                        ) : (
                          <div className="w-full space-y-3 relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="ค้นหารถยนต์..."
                                value={slotSearchQuery}
                                onChange={(e) => setSlotSearchQuery(e.target.value)}
                                className="w-full rounded-md border border-ev-border bg-ev-card px-3 pl-9 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-electric-green/60 transition-colors duration-150"
                              />
                            </div>

                            <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-ev-border bg-ev-dark">
                              {filteredDropdownOptions.length === 0 ? (
                                <div className="p-3 text-center text-slate-500 text-xs">ไม่พบรถที่ค้นหา</div>
                              ) : (
                                filteredDropdownOptions.map(car => (
                                  <button
                                    key={car._id}
                                    onClick={() => handleAddCarToCompare(car)}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:bg-ev-card hover:text-white border-b border-ev-border/30 last:border-b-0 flex items-center space-x-2 transition-colors duration-150"
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
                              className="text-[10px] text-slate-500 hover:text-white underline block mx-auto pt-1 transition-colors duration-150"
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
              {renderSectionHeader('ข้อมูลพื้นฐาน (Basic Information)', '#0ea5e9')}
              {renderSpecRow('ประเภทตัวถัง', (car) => car.bodyType)}
              {renderSpecRow('ระยะเวลาการรับประกันแบตเตอรี่', (car) => car.warrantyYears, (val) => `${val} ปี`, 'higher')}
              {renderSpecRow('ระยะทางรับประกัน (กม.)', (car) => car.warrantyKm, (val) => `${new Intl.NumberFormat('th-TH').format(val)} กม.`, 'higher')}

              {/* === PERFORMANCE === */}
              {renderSectionHeader('สมรรถนะตัวรถ (Performance)', '#05f383')}
              {renderSpecRow('กำลังมอเตอร์ไฟฟ้า (แรงม้า)', (car) => car.horsepower, (val) => `${val} HP`, 'higher')}
              {renderSpecRow('แรงบิดสูงสุด (นิวตันเมตร)', (car) => car.torque, (val) => `${val} Nm`, 'higher')}
              {renderSpecRow('อัตราเร่ง 0-100 กม./ชม.', (car) => car.acceleration0To100, (val) => `${val} วินาที`, 'lower')}
              {renderSpecRow('ความเร็วสูงสุด (กม./ชม.)', (car) => car.topSpeed, (val) => `${val} km/h`, 'higher')}
              {renderSpecRow('ระบบขับเคลื่อน', (car) => car.driveType)}

              {/* === BATTERY & RANGE === */}
              {renderSectionHeader('แบตเตอรี่ & ระยะการเดินทาง (Battery & Range)', '#f59e0b')}
              {renderSpecRow('ความจุแบตเตอรี่ (kWh)', (car) => car.batteryCapacity, (val) => `${val} kWh`, 'higher')}
              {renderSpecRow('ชนิดของแบตเตอรี่', (car) => car.batteryType)}
              {renderSpecRow('ระยะทางวิ่ง WLTP (กม.)', (car) => car.rangeWLTP, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}
              {renderSpecRow('ระยะทางวิ่ง NEDC (กม.)', (car) => car.rangeNEDC, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}
              {renderSpecRow('ระยะทางวิ่ง CLTC (กม.)', (car) => car.rangeCLTC, (val) => val > 0 ? `${val} กม.` : '-', 'higher')}

              {/* === CHARGING & TECH === */}
              {renderSectionHeader('ระบบชาร์จไฟฟ้า & เทคโนโลยี (Charging & Technology)', '#a855f7')}
              {renderSpecRow('การชาร์จกระแสสลับ AC สูงสุด', (car) => car.acChargePower, (val) => `${val} kW`, 'higher')}
              {renderSpecRow('การชาร์จกระแสตรง DC สูงสุด', (car) => car.dcChargePower, (val) => `${val} kW`, 'higher')}
              {renderSpecRow('สถาปัตยกรรมแรงดันระบบ', (car) => car.voltageArchitecture)}
              {renderSpecRow('จ่ายกระแสไฟภายนอก (V2L)', (car) => car.v2lSupport, undefined, undefined, true)}
              {renderSpecRow('กำลังจ่ายไฟ V2L สูงสุด', (car) => car.v2lPower, (val) => val > 0 ? `${val} kW` : '-', 'higher')}

              {/* === DIMENSIONS === */}
              {renderSectionHeader('สัดส่วนและมิติตัวถัง (Body Dimensions)', '#ec4899')}
              {renderSpecRow('ความยาวตัวรถ (มม.)', (car) => car.length, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความกว้างตัวรถ (มม.)', (car) => car.width, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความสูงตัวรถ (มม.)', (car) => car.height, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ระยะความยาวฐานล้อ (มม.)', (car) => car.wheelbase, (val) => `${new Intl.NumberFormat('th-TH').format(val)} มม.`)}
              {renderSpecRow('ความจุห้องสัมภาระท้าย (ลิตร)', (car) => car.cargoVolume, (val) => `${val} ลิตร`, 'higher')}
              {renderSpecRow('ที่เก็บของด้านหน้า Frunk (ลิตร)', (car) => car.frunkVolume, (val) => val > 0 ? `${val} ลิตร` : 'ไม่มี', 'higher')}

              {/* === ADAS === */}
              {renderSectionHeader('ระบบช่วยขับขี่อัจฉริยะ (ADAS)', '#06b6d4')}
              {renderSpecRow('ระดับระบบ ADAS', (car) => car.adasLevel ?? 0, (val) => {
                const labels: Record<number, string> = { 0: 'ไม่มี', 1: 'Level 1 (พื้นฐาน)', 2: 'Level 2 (โหมดกึ่งอัตโนมัติ)', 3: 'Level 2+ (สูงกว่า)' };
                return labels[val] || `Level ${val}`;
              }, 'higher')}
              {renderSpecRow('Adaptive Cruise Control (ACC)', (car) => car.adaptiveCruiseControl ?? false, undefined, undefined, true)}
              {renderSpecRow('Lane Keeping Assist (LKA)', (car) => car.laneKeepAssist ?? false, undefined, undefined, true)}
              {renderSpecRow('Auto Emergency Braking (AEB)', (car) => car.autoEmergencyBraking ?? false, undefined, undefined, true)}
              {renderSpecRow('Blind Spot Monitor (BSM)', (car) => car.blindSpotMonitor ?? false, undefined, undefined, true)}
              {renderSpecRow('จอดรถอัตโนมัติ (Auto Parking)', (car) => car.autoParking ?? false, undefined, undefined, true)}
              {renderSpecRow('ฟีเจอร์ ADAS เพิ่มเติม', (car) => car.adasFeatures || '', (val) => val || '—')}
            </tbody>
          </table>
        </div>

        {/* Popular matchups below table */}
        {popularMatchups.length > 0 && (
          <PopularMatchups matchups={popularMatchups} onSelect={handleMatchupSelect} variant="compact" />
        )}
        </>
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