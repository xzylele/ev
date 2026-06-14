'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Zap, Check, ShieldCheck, HelpCircle, AlertCircle, Plus, LayoutGrid, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import CompareSelector from '@/components/CompareSelector';

interface RecommendedCar {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  price: number;
  image: string;
  bodyType: string;
  rangeWLTP: number;
  rangeNEDC: number;
  rangeCLTC: number;
  horsepower: number;
  dcChargePower: number;
  acChargePower: number;
  voltageArchitecture: string;
  driveType: string;
  v2lSupport: boolean;
  matchScore: number;
  reasons: string[];
}

export default function RecommendPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<RecommendedCar[] | null>(null);

  // Form states
  const [budget, setBudget] = useState<string>('750k-1.2m');
  const [usageType, setUsageType] = useState<string>('mixed');
  const [dailyDistance, setDailyDistance] = useState<string>('50-150');
  const [priority, setPriority] = useState<string>('range');
  const [mustHaves, setMustHaves] = useState<string[]>([]);

  const handleToggleMustHave = (val: string) => {
    if (mustHaves.includes(val)) {
      setMustHaves(mustHaves.filter(v => v !== val));
    } else {
      setMustHaves([...mustHaves, val]);
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setResults(null);
    setStep(1);
    setBudget('750k-1.2m');
    setUsageType('mixed');
    setDailyDistance('50-150');
    setPriority('range');
    setMustHaves([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budget,
          usageType,
          dailyDistance,
          priority,
          mustHaves,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        alert(data.error || 'เกิดข้อผิดพลาดในการคำนวณผลลัพธ์');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCompare = (car: RecommendedCar) => {
    const stored = localStorage.getItem('ev_compare_selection');
    let selection: any[] = [];
    if (stored) {
      try {
        selection = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    if (selection.some(item => item.id === car._id)) {
      alert('มีรถยนต์รุ่นนี้ในตารางเปรียบเทียบแล้วครับ');
      return;
    }
    if (selection.length >= 4) {
      alert('เปรียบเทียบรถได้สูงสุด 4 รุ่นพร้อมกันครับ');
      return;
    }
    const updated = [
      ...selection,
      {
        id: car._id,
        brand: car.brand,
        model: car.model,
        trim: car.trim,
        image: car.image,
        price: car.price,
      },
    ];
    localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    window.dispatchEvent(new Event('ev_compare_updated'));
    alert(`เพิ่ม ${car.brand} ${car.model} เข้าตารางเปรียบเทียบแล้ว`);
  };

  const handleCompareAll = () => {
    if (!results || results.length === 0) return;
    const ids = results.map(c => c._id).join(',');
    router.push(`/compare?ids=${ids}`);
  };

  // Step render configurations
  const renderQuizStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">1. งบประมาณในการจัดหาของคุณเป็นอย่างไร?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'under-750k', label: 'ต่ำกว่า 750,000 บาท', desc: 'เน้นรถเริ่มต้น ขนาดเล็ก คุ้มค่า ประหยัดภาษี' },
                { id: '750k-1.2m', label: '750,000 - 1,200,000 บาท', desc: 'รถยนต์กลุ่มแมสยอดนิยม ตัวถังบอดี้ขนาดกลาง ยอดขายสูงในไทย' },
                { id: '1.2m-2m', label: '1,200,000 - 2,000,000 บาท', desc: 'รถสมรรถนะสูง แบตเตอรี่ใหญ่ขึ้น และฟีเจอร์พรีเมียมครบครัน' },
                { id: 'over-2m', label: 'มากกว่า 2,000,000 บาท ขึ้นไป', desc: 'รถไฟฟ้าระดับหรู สเปคสูงสุด เทคโนโลยีระดับเรือธง' },
                { id: 'any', label: 'ไม่จำกัดงบประมาณ', desc: 'ต้องการหาสเปครถที่ดีที่สุดตรงใจ ไม่จำกัดราคา' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`budget-${opt.id}`}
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    budget === opt.id
                      ? 'border-electric-green bg-electric-green/5'
                      : 'border-ev-border bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={`budget-${opt.id}`}
                    name="budget"
                    value={opt.id}
                    checked={budget === opt.id}
                    onChange={() => setBudget(opt.id)}
                    className="sr-only"
                  />
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                    budget === opt.id ? 'border-electric-green' : 'border-slate-500'
                  }`}>
                    {budget === opt.id && <span className="h-2 w-2 rounded-full bg-electric-green" />}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                    <span className="block text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">2. รูปแบบหรือลักษณะการใช้งานรถหลักของคุณคือข้อใด?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'city', label: '🏙️ ขับขี่ในเมือง คล่องตัว หาที่จอดง่าย', desc: 'ใช้งานเดินทางไปทำงานในเมืองเป็นหลัก ขับระยะสั้นและเจอรถติด' },
                { id: 'highway', label: '🛣️ เดินทางต่างจังหวัด ท่องเที่ยวไกลๆ บ่อย', desc: 'ขับขี่ทางไกลข้ามจังหวัดเป็นประจำ ต้องการชาร์จไวและไม่กังวลระยะทาง' },
                { id: 'family', label: '👨‍👩‍👧‍👦 รถครอบครัว นั่งสบาย เก็บกระเป๋าได้เยอะ', desc: 'มีผู้โดยสารร่วมทางหลายคน มีสัมภาระขนาดใหญ่ เน้นนั่งนุ่มสบาย' },
                { id: 'mixed', label: '🔄 ใช้งานทั่วไป ผสมผสานหลากหลายรูปแบบ', desc: 'ขับในเมืองเป็นปกติ และเดินทางท่องเที่ยวทางไกลในช่วงวันหยุด' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`usage-${opt.id}`}
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    usageType === opt.id
                      ? 'border-electric-green bg-electric-green/5'
                      : 'border-ev-border bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={`usage-${opt.id}`}
                    name="usageType"
                    value={opt.id}
                    checked={usageType === opt.id}
                    onChange={() => setUsageType(opt.id)}
                    className="sr-only"
                  />
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                    usageType === opt.id ? 'border-electric-green' : 'border-slate-500'
                  }`}>
                    {usageType === opt.id && <span className="h-2 w-2 rounded-full bg-electric-green" />}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                    <span className="block text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">3. ระยะทางเฉลี่ยที่ต้องการขับขี่ในแต่ละวัน (กิโลเมตร)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'under-50', label: 'น้อยกว่า 50 กิโลเมตรต่อวัน', desc: 'ขับสั้นๆ ไปตลาด ไปห้าง หรือไปออฟฟิศใกล้บ้าน' },
                { id: '50-150', label: '50 - 150 กิโลเมตรต่อวัน', desc: 'เดินทางข้ามเขตในปริมณฑล หรือชานเมืองปกติ' },
                { id: '150-300', label: '150 - 300 กิโลเมตรต่อวัน', desc: 'สายเดินทางพบปะลูกค้า หรือทำงานที่ต้องสัญจรตลอดวัน' },
                { id: 'over-300', label: 'มากกว่า 300 กิโลเมตรขึ้นไปต่อวัน', desc: 'เดินทางข้ามจังหวัดเป็นประจำ เดินทางระยะไกลต่อเนื่อง' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`distance-${opt.id}`}
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    dailyDistance === opt.id
                      ? 'border-electric-green bg-electric-green/5'
                      : 'border-ev-border bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={`distance-${opt.id}`}
                    name="dailyDistance"
                    value={opt.id}
                    checked={dailyDistance === opt.id}
                    onChange={() => setDailyDistance(opt.id)}
                    className="sr-only"
                  />
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                    dailyDistance === opt.id ? 'border-electric-green' : 'border-slate-500'
                  }`}>
                    {dailyDistance === opt.id && <span className="h-2 w-2 rounded-full bg-electric-green" />}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                    <span className="block text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">4. คุณสมบัติหรือข้อใดที่คุณให้ความสำคัญสูงสุด?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'charge', label: '⚡ ชาร์จไฟเร็วทันใจ (Charging Speed)', desc: 'ต้องการเทคโนโลยีชาร์จเร็ว DC สูงสุด เพื่อลดเวลารอชาร์จตู้สถานี' },
                { id: 'range', label: '🔋 ระยะทางวิ่งได้ไกลที่สุดต่อชาร์จ (Max Range)', desc: 'เน้นความจุแบตเตอรี่ใหญ่สุดเพื่อวิ่งได้ไกล ปราศจากความกังวล' },
                { id: 'performance', label: '🏎️ สมรรถนะการขับขี่ อัตราเร่งแรง (Performance)', desc: 'เน้นแรงม้าสูง อัตราเร่ง 0-100 เร้าใจ ตอบสนองไว' },
                { id: 'safety', label: '🤖 ความปลอดภัยและระบบขับขี่อัจฉริยะ (ADAS)', desc: 'เน้นระบบเตือนภัยเบรกอัตโนมัติ ช่วยคุมรถในเลน และควบคุมความเร็วแปรผัน' },
                { id: 'value', label: '💰 ความคุ้มค่า อุ่นใจในการรับประกัน (Value & Warranty)', desc: 'คุ้มเงินสูงสุด ได้รับประกันตัวถังและแบตเตอรี่ระยะยาวนานเป็นพิเศษ' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`priority-${opt.id}`}
                  className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                    priority === opt.id
                      ? 'border-electric-green bg-electric-green/5'
                      : 'border-ev-border bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    id={`priority-${opt.id}`}
                    name="priority"
                    value={opt.id}
                    checked={priority === opt.id}
                    onChange={() => setPriority(opt.id)}
                    className="sr-only"
                  />
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center mr-3 ${
                    priority === opt.id ? 'border-electric-green' : 'border-slate-500'
                  }`}>
                    {priority === opt.id && <span className="h-2 w-2 rounded-full bg-electric-green" />}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                    <span className="block text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4">5. ฟีเจอร์พิเศษใดที่จำเป็นต้องมีในรถยนต์ไฟฟ้าคันนี้ (เลือกได้หลายข้อ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'v2l', label: '🔌 ระบบ V2L (Vehicle-to-Load)', desc: 'รองรับการจ่ายกระแสไฟ 220V ออกจากตัวรถเพื่อใช้อุปกรณ์ไฟฟ้านอกสถานที่' },
                { id: 'awd', label: '⚙️ ระบบขับเคลื่อน 4 ล้อ (AWD)', desc: 'เพิ่มความยึดเกาะถนน การขับขี่มั่นคง เกาะถนนเปียกได้ดีกว่า RWD/FWD' },
                { id: '800v', label: '⚡ เทคโนโลยีสถาปัตยกรรมไฟฟ้าแรงดันสูง 800V', desc: 'รองรับการรับพลังงานสูงพิเศษ ชาร์จตู้รองรับได้เร็วกว่าระบบ 400V ทั่วไป' },
                { id: 'adas', label: '🤖 ระบบความปลอดภัยอัจฉริยะเลเวล 2 ขึ้นไป', desc: 'มี ACC ที่สามารถขับตามคันหน้า หยุด-ออกตัวอัตโนมัติ และประคองพวงมาลัยตรง' },
              ].map((opt) => {
                const isSelected = mustHaves.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    htmlFor={`must-${opt.id}`}
                    className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-electric-green bg-electric-green/5'
                        : 'border-ev-border bg-slate-900/30 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`must-${opt.id}`}
                      checked={isSelected}
                      onChange={() => handleToggleMustHave(opt.id)}
                      className="sr-only"
                    />
                    <span className={`mt-1 h-4 w-4 shrink-0 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected ? 'border-electric-green bg-electric-green text-ev-dark' : 'border-slate-500 bg-transparent'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                    <div>
                      <span className="block text-sm font-bold text-white leading-tight">{opt.label}</span>
                      <span className="block text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Title */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl" style={{ textWrap: 'balance' }}>
          Smart Recommendation Engine
        </h1>
        <p className="mt-2 text-sm text-slate-400">ตอบคำถามสั้นๆ 5 ข้อเพื่อค้นหาและเปรียบเทียบรถยนต์ไฟฟ้าที่ดีที่สุดสำหรับคุณ</p>
      </div>

      {!results ? (
        /* ─── Quiz Form ─── */
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-xl border border-ev-border bg-ev-card/40 p-6 sm:p-8 space-y-8">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>คำถามข้อที่ {step} จาก 5</span>
              <span>{Math.round((step / 5) * 100)}% เสร็จสิ้น</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-electric-green transition-all duration-300 rounded-full"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Render Active Step */}
          <div className="min-h-[220px]">
            {renderQuizStep()}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-ev-border/50">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1 || loading}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border ${
                step === 1
                  ? 'border-transparent text-slate-600 cursor-not-allowed'
                  : 'border-ev-border text-slate-300 hover:text-white hover:border-slate-500'
              }`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>ย้อนกลับ</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-5 py-2.5 rounded-lg text-xs font-bold bg-slate-800 text-white border border-ev-border hover:bg-slate-700 transition-all"
              >
                <span>ถัดไป</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-electric-green text-ev-dark border border-ev-border hover:bg-electric-green/90 disabled:opacity-50 transition-all font-mono"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>กำลังวิเคราะห์...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>วิเคราะห์และแนะนำผลลัพธ์</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      ) : (
        /* ─── Results View ─── */
        <div className="space-y-8 animate-slide-up">
          {/* Summary / Hero header of results */}
          <div className="rounded-xl border border-ev-border bg-ev-card/30 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-electric-green/10 flex items-center justify-center text-electric-green border border-electric-green/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">วิเคราะห์ผลลัพธ์สำเร็จ</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  เราค้นพบรถยนต์ไฟฟ้า Top 3 รุ่นที่มีคุณสมบัติเหมาะสมที่สุดสำหรับคำถามของคุณเรียบร้อย โดยประเมินความสอดคล้องตามเกณฑ์ทั้งหมด
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleCompareAll}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-electric-blue text-white border border-ev-border hover:bg-electric-blue/90 transition-all"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>เปรียบเทียบทั้ง 3 รุ่นพร้อมกัน</span>
              </button>
              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold border border-ev-border text-slate-300 hover:text-white hover:border-slate-500 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>ทำแบบทดสอบใหม่</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {results.map((car, idx) => {
              const range = Math.max(car.rangeWLTP || 0, car.rangeNEDC || 0, car.rangeCLTC || 0);
              const rangeStd = car.rangeWLTP ? 'WLTP' : car.rangeNEDC ? 'NEDC' : 'CLTC';

              return (
                <div
                  key={car._id}
                  className={`rounded-xl border flex flex-col bg-ev-card relative overflow-hidden transition-all duration-300 ${
                    idx === 0 ? 'border-electric-green/60' : 'border-ev-border'
                  }`}
                >
                  {/* Top Match Badge */}
                  <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase border ${
                      idx === 0
                        ? 'bg-electric-green/10 text-electric-green border-electric-green/20'
                        : idx === 1
                        ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20'
                        : 'bg-slate-800 text-slate-300 border-ev-border'
                    }`}>
                      อันดับที่ {idx + 1}
                    </span>
                    <span className="rounded-md bg-ev-dark/80 px-2 py-1 text-[10px] font-bold text-white border border-ev-border/50">
                      {car.matchScore}% Match
                    </span>
                  </div>

                  {/* Image */}
                  <div className="relative h-44 w-full bg-slate-950/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={car.image}
                      alt={`${car.brand} ${car.model}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 rounded-lg bg-ev-dark/80 px-2 py-0.5 text-[10px] font-bold border border-ev-border text-slate-400">
                      {car.bodyType}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">{car.brand}</span>
                    <h3 className="mt-1 text-md font-extrabold text-white leading-tight">
                      {car.model}
                    </h3>
                    <div className="flex justify-between items-baseline mt-1 mb-4 gap-2">
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{car.trim}</span>
                      <span className="text-sm font-black text-electric-green">
                        {new Intl.NumberFormat('th-TH').format(car.price)} ฿
                      </span>
                    </div>

                    {/* Short specs list */}
                    <div className="grid grid-cols-3 gap-1 py-2.5 px-1 bg-ev-dark/40 border border-ev-border/60 rounded-lg text-center mb-5 font-mono">
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">ระยะทาง</span>
                        <span className="block text-[11px] font-extrabold text-white mt-1 leading-tight">{range} กม.</span>
                        <span className="block text-[8px] text-slate-500 leading-none">({rangeStd})</span>
                      </div>
                      <div className="border-x border-ev-border/30">
                        <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">พละกำลัง</span>
                        <span className="block text-[11px] font-extrabold text-white mt-1 leading-tight">{car.horsepower} HP</span>
                        <span className="block text-[8px] text-slate-500 leading-none">({car.driveType})</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-bold tracking-wider leading-none">ชาร์จ DC</span>
                        <span className="block text-[11px] font-extrabold text-electric-blue mt-1 leading-tight">{car.dcChargePower} kW</span>
                        <span className="block text-[8px] text-slate-500 leading-none">({car.voltageArchitecture})</span>
                      </div>
                    </div>

                    {/* Why this is a match section */}
                    <div className="space-y-2.5 flex-grow mb-6">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-ev-border/40 pb-1">
                        จุดเด่นที่เหมาะสมกับคุณ
                      </span>
                      {car.reasons.map((reason, rIdx) => (
                        <div key={rIdx} className="flex items-start text-xs leading-relaxed text-slate-300">
                          <Check className="h-3.5 w-3.5 text-electric-green shrink-0 mt-0.5 mr-2 stroke-[2.5]" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-4 border-t border-ev-border/40 flex items-center justify-between gap-3">
                      <Link
                        href={`/cars/${car._id}`}
                        className="flex-grow text-center rounded-lg bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition-all border border-ev-border"
                      >
                        ดูข้อมูลรถละเอียด
                      </Link>
                      <button
                        onClick={() => handleAddToCompare(car)}
                        className="p-2.5 rounded-lg border border-ev-border text-slate-400 hover:text-white hover:border-slate-700 transition-all"
                        title="เพิ่มลงคอลัมน์เปรียบเทียบ"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating comparison Selector widget */}
      <CompareSelector />
    </div>
  );
}
