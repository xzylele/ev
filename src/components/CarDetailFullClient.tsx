'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Gauge, BatteryCharging, ShieldAlert, ArrowLeftRight, Calculator, Check, Plus, Star, MessageSquarePlus, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface SiblingTrim {
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
}

interface ReviewData {
  _id: string;
  evId: string;
  userName: string;
  rating: number;
  ratingBattery: number;
  ratingPerformance: number;
  ratingComfort: number;
  pros: string;
  cons: string;
  comment: string;
  createdAt: string;
}

interface SelectedCar {
  id: string;
  brand: string;
  model: string;
  trim: string;
  image: string;
  price: number;
}

interface CarDetailFullClientProps {
  initialCarId: string;
  siblingTrims: string; // JSON string
  initialReviews: string; // JSON string
}

const CarDetailFullClient: React.FC<CarDetailFullClientProps> = ({
  initialCarId,
  siblingTrims,
  initialReviews
}) => {
  const trims: SiblingTrim[] = JSON.parse(siblingTrims);
  const allReviews: ReviewData[] = JSON.parse(initialReviews);

  // Active trim index
  const initialIndex = trims.findIndex(t => t._id === initialCarId);
  const [activeTrimIndex, setActiveTrimIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  const activeCar = trims[activeTrimIndex];

  // Compare selection state
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    const checkComparison = () => {
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored) {
        try {
          const parsed: SelectedCar[] = JSON.parse(stored);
          setIsCompared(parsed.some(c => c.id === activeCar._id));
        } catch (e) {
          console.error(e);
        }
      } else {
        setIsCompared(false);
      }
    };

    checkComparison();
    window.addEventListener('ev_compare_updated', checkComparison);
    return () => {
      window.removeEventListener('ev_compare_updated', checkComparison);
    };
  }, [activeCar._id]);

  const handleToggleCompare = () => {
    let currentSelection: SelectedCar[] = [];
    const stored = localStorage.getItem('ev_compare_selection');
    if (stored) {
      try {
        currentSelection = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }

    if (isCompared) {
      const updated = currentSelection.filter(c => c.id !== activeCar._id);
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    } else {
      if (currentSelection.length >= 4) {
        alert('เปรียบเทียบรถได้สูงสุดครั้งละ 4 คันครับ');
        return;
      }
      const newSelect: SelectedCar = {
        id: activeCar._id,
        brand: activeCar.brand,
        model: activeCar.model,
        trim: activeCar.trim,
        image: activeCar.image,
        price: activeCar.price
      };
      const updated = [...currentSelection, newSelect];
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    }

    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  // Review states
  const [reviews, setReviews] = useState<ReviewData[]>(allReviews);
  const [userName, setUserName] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingBattery, setRatingBattery] = useState(5);
  const [ratingPerformance, setRatingPerformance] = useState(5);
  const [ratingComfort, setRatingComfort] = useState(5);
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [comment, setComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Averages for the entire model
  const avgOverall = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const avgBattery = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingBattery, 0) / reviews.length).toFixed(1) : '0.0';
  const avgPerformance = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingPerformance, 0) / reviews.length).toFixed(1) : '0.0';
  const avgComfort = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingComfort, 0) / reviews.length).toFixed(1) : '0.0';

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !pros || !cons || !comment) {
      setSubmitError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/cms/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evId: activeCar._id, // Submit review under the currently active trim
          userName,
          rating,
          ratingBattery,
          ratingPerformance,
          ratingComfort,
          pros,
          cons,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitSuccess(true);
      setReviews(prev => [data.review, ...prev]);

      // Reset
      setUserName('');
      setRating(5);
      setRatingBattery(5);
      setRatingPerformance(5);
      setRatingComfort(5);
      setPros('');
      setCons('');
      setComment('');
      
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
      }, 3000);

    } catch (err: any) {
      setSubmitError(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTrimLabel = (evId: string) => {
    const found = trims.find(t => t._id === evId);
    return found ? found.trim : '';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const range = Math.max(activeCar.rangeWLTP, activeCar.rangeNEDC, activeCar.rangeCLTC);
  const rangeStandard = activeCar.rangeWLTP ? 'WLTP' : activeCar.rangeNEDC ? 'NEDC' : 'CLTC';

  const renderStars = (score: number, setScore?: (val: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            onClick={() => setScore && setScore(star)}
            className={`h-5 w-5 ${
              star <= score 
                ? 'fill-amber-400 text-amber-400' 
                : 'text-slate-600'
            } ${setScore ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
      {/* Back Link */}
      <div className="mb-6">
        <Link href="/cars" className="text-xs text-slate-400 hover:text-electric-green transition-colors">
          ← กลับหน้าค้นหารถทั้งหมด
        </Link>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Image Container */}
        <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-ev-border bg-ev-card/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeCar.image}
            alt={`${activeCar.brand} ${activeCar.model}`}
            className="w-full h-80 sm:h-96 object-cover"
          />
        </div>

        {/* Right: Spec Header & Switcher */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{activeCar.brand}</span>
            <h1 className="text-4xl font-extrabold text-white mt-1 leading-tight">
              {activeCar.model}
            </h1>
            <p className="text-lg text-electric-green font-bold mt-1">รุ่นย่อย: {activeCar.trim}</p>
            
            {/* Trim Switcher Tab buttons */}
            {trims.length > 1 && (
              <div className="mt-5">
                <span className="text-xs text-slate-500 uppercase block font-semibold mb-2">เลือกรุ่นย่อย (Trims)</span>
                <div className="flex flex-wrap gap-2">
                  {trims.map((t, idx) => (
                    <button
                      key={t._id}
                      onClick={() => setActiveTrimIndex(idx)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold text-left transition-all duration-300 flex flex-col justify-center gap-0.5 ${
                        idx === activeTrimIndex
                          ? 'bg-electric-green/10 border-electric-green text-electric-green glow-green'
                          : 'border-ev-border bg-slate-900/40 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{t.trim}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        {formatNumber(t.price)} ฿
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-6 p-4 rounded-xl border border-ev-border bg-slate-900/40">
              <span className="text-xs text-slate-500 uppercase block font-semibold">ราคาจำหน่ายอย่างเป็นทางการ</span>
              <span className="text-3xl font-extrabold text-white">
                {formatNumber(activeCar.price)} <span className="text-sm font-normal text-slate-400">บาท</span>
              </span>
            </div>

            {/* Warranty */}
            <div className="mt-4 flex items-center space-x-2 text-xs text-slate-400 font-semibold">
              <ShieldAlert className="h-4 w-4 text-electric-blue" />
              <span>การรับประกันแบตเตอรี่: <strong className="text-slate-200">{activeCar.warrantyYears} ปี</strong> หรือ <strong className="text-slate-200">{formatNumber(activeCar.warrantyKm)} กม.</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={handleToggleCompare}
              className={`flex items-center justify-center space-x-2 rounded-xl py-3.5 px-6 text-sm font-bold transition-all duration-300 ${
                isCompared
                  ? 'bg-electric-green/10 text-electric-green border border-electric-green/30 glow-green'
                  : 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-[1.01]'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>เลือกไว้เปรียบเทียบแล้ว</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>เพิ่มเข้าเปรียบเทียบ</span>
                </>
              )}
            </button>

            <Link
              href={`/calculators?id=${activeCar._id}`}
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue py-3.5 px-6 text-sm font-bold text-ev-dark transition-all duration-300 hover:opacity-95 hover:scale-[1.01] shadow-lg glow-green"
            >
              <Calculator className="h-4 w-4 fill-current" />
              <span>คำนวณชาร์จ & ความประหยัด</span>
            </Link>
            
            <Link
              href="/compare"
              className="flex items-center justify-center space-x-2 rounded-xl border border-ev-border bg-ev-dark px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>หน้าเปรียบเทียบหลัก</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Detailed Grid Spec Table */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-ev-border pb-3">ข้อมูลรายละเอียดทางเทคนิค (Specifications)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dimensions */}
          <div className="rounded-2xl border border-ev-border bg-ev-card/20 p-6">
            <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-electric-blue" />
              <span>มิติตัวถัง (Dimensions)</span>
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ev-border/40 font-normal">
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความยาวตัวถัง</td>
                  <td className="text-white font-bold">{formatNumber(activeCar.length)} มม.</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความกว้างตัวถัง</td>
                  <td className="text-white font-bold">{formatNumber(activeCar.width)} มม.</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความสูงตัวถัง</td>
                  <td className="text-white font-bold">{formatNumber(activeCar.height)} มม.</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ระยะฐานล้อ</td>
                  <td className="text-white font-bold">{formatNumber(activeCar.wheelbase)} มม.</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความจุเก็บสัมภาระท้าย</td>
                  <td className="text-white font-bold">{activeCar.cargoVolume} ลิตร</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ช่องเก็บของด้านหน้า (Frunk)</td>
                  <td className="text-white font-bold">{activeCar.frunkVolume > 0 ? `${activeCar.frunkVolume} ลิตร` : 'ไม่มี'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Performance */}
          <div className="rounded-2xl border border-ev-border bg-ev-card/20 p-6">
            <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-electric-green" />
              <span>สมรรถนะ (Performance)</span>
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ev-border/40 font-normal">
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">พละกำลังมอเตอร์ไฟฟ้า</td>
                  <td className="text-white font-bold">{activeCar.horsepower} แรงม้า</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">แรงบิดสูงสุด</td>
                  <td className="text-white font-bold">{activeCar.torque} นิวตันเมตร</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">อัตราเร่ง 0-100 กม./ชม.</td>
                  <td className="text-white font-bold text-electric-blue">{activeCar.acceleration0To100} วินาที</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความเร็วสูงสุด</td>
                  <td className="text-white font-bold">{activeCar.topSpeed} กม./ชม.</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ระบบขับเคลื่อน</td>
                  <td className="text-white font-bold uppercase">{activeCar.driveType}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Battery & Charging */}
          <div className="rounded-2xl border border-ev-border bg-ev-card/20 p-6">
            <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>แบตเตอรี่และการชาร์จ (Battery & Charging)</span>
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ev-border/40 font-normal">
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ความจุแบตเตอรี่</td>
                  <td className="text-white font-bold">{activeCar.batteryCapacity} kWh</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ชนิดแบตเตอรี่</td>
                  <td className="text-white font-bold">{activeCar.batteryType}</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ระยะทางสูงสุดต่อชาร์จ</td>
                  <td className="text-white font-bold text-electric-green">{range} กม. ({rangeStandard})</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">อัตราการชาร์จกระแสสลับ (AC)</td>
                  <td className="text-white font-bold">{activeCar.acChargePower} kW</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">อัตราการชาร์จกระแสตรง (DC)</td>
                  <td className="text-white font-bold text-electric-blue">{activeCar.dcChargePower} kW</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">สถาปัตยกรรมแรงดันไฟฟ้า</td>
                  <td className="text-white font-bold">{activeCar.voltageArchitecture}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Smart Technologies */}
          <div className="rounded-2xl border border-ev-border bg-ev-card/20 p-6">
            <h3 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span>ฟังก์ชันพิเศษ & จ่ายกระแสไฟ (V2L / Tech)</span>
            </h3>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-ev-border/40 font-normal">
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ระบบจ่ายไฟให้อุปกรณ์ภายนอก (V2L)</td>
                  <td className="text-white font-bold">
                    {activeCar.v2lSupport ? (
                      <span className="text-electric-green">รองรับ</span>
                    ) : (
                      <span className="text-slate-500">ไม่รองรับ</span>
                    )}
                  </td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">กำลังจ่ายกระแสไฟ V2L สูงสุด</td>
                  <td className="text-white font-bold">{activeCar.v2lSupport ? `${activeCar.v2lPower} kW` : '-'}</td>
                </tr>
                <tr className="py-2.5 flex justify-between">
                  <td className="text-slate-400">ประเภทหัวชาร์จมาตรฐาน</td>
                  <td className="text-white font-bold">CCS Type 2 / Type 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 border-t border-ev-border pt-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">รีวิวและคะแนนสะสมจากผู้ใช้จริง</h2>
            <p className="text-sm text-slate-400 mt-1">แบ่งปันประสบการณ์ตรงจากการขับขี่จริง (ข้อมูลครอบคลุมทุกรุ่นย่อย)</p>
          </div>
          
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue px-4 py-2.5 text-xs font-bold text-ev-dark transition-all duration-300 transform hover:-translate-y-0.5 glow-green"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>เขียนรีวิวของคุณ</span>
            </button>
          )}
        </div>

        {/* Ratings Summary Dash */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 rounded-xl border border-ev-border bg-ev-card/30 p-6">
          <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-ev-border pb-6 md:pb-0">
            <span className="text-5xl font-extrabold text-white">{avgOverall}</span>
            <div className="mt-2">{renderStars(Math.round(Number(avgOverall)))}</div>
            <span className="text-xs text-slate-400 mt-2">จากทั้งหมด {reviews.length} รีวิว</span>
          </div>

          <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-slate-400 mb-1">ประสิทธิภาพแบตเตอรี่</span>
              <span className="text-xl font-bold text-electric-green mb-1">{avgBattery} / 5</span>
              {renderStars(Math.round(Number(avgBattery)))}
            </div>
            <div className="flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-slate-400 mb-1">สมรรถนะการขับขี่</span>
              <span className="text-xl font-bold text-electric-blue mb-1">{avgPerformance} / 5</span>
              {renderStars(Math.round(Number(avgPerformance)))}
            </div>
            <div className="flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-slate-400 mb-1">ความนั่งสบาย & กว้างขวาง</span>
              <span className="text-xl font-bold text-amber-400 mb-1">{avgComfort} / 5</span>
              {renderStars(Math.round(Number(avgComfort)))}
            </div>
          </div>
        </div>

        {/* Review Form */}
        {showForm && (
          <form onSubmit={handleReviewSubmit} className="mb-10 rounded-xl border border-ev-border bg-ev-card p-6 md:p-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-ev-border pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">ส่งความคิดเห็นรถคันนี้ ({activeCar.trim})</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ยกเลิก
              </button>
            </div>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-electric-green mb-3" />
                <span className="text-md font-bold text-white">ขอบคุณสำหรับรีวิวของคุณ!</span>
                <p className="text-xs text-slate-400 mt-1">รีวิวของคุณได้ถูกบันทึกเข้าระบบเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <div className="space-y-6">
                {submitError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">ชื่อผู้รีวิว *</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ขับ EV"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full rounded-sm border border-ev-border bg-ev-card/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-electric-green transition-colors"
                    />
                  </div>
                  
                  {/* Star Ratings Form */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">คะแนนภาพรวม:</span>
                      {renderStars(rating, setRating)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">ด้านแบตเตอรี่/ชาร์จ:</span>
                      {renderStars(ratingBattery, setRatingBattery)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">ด้านสมรรถนะ/ความเร็ว:</span>
                      {renderStars(ratingPerformance, setRatingPerformance)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">ด้านความกว้างขวาง/ห้องโดยสาร:</span>
                      {renderStars(ratingComfort, setRatingComfort)}
                    </div>
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-electric-green" />
                      <span>ข้อดี *</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="เล่าถึงสิ่งที่คุณชอบในรถรุ่นนี้..."
                      value={pros}
                      onChange={(e) => setPros(e.target.value)}
                      className="w-full rounded-sm border border-ev-border bg-ev-card/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-electric-green transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <ThumbsDown className="h-4 w-4 text-red-400" />
                      <span>ข้อสังเกต / ข้อเสีย *</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="ข้อคิดเห็นหรือปัญหาที่พบจากการใช้จริง..."
                      value={cons}
                      onChange={(e) => setCons(e.target.value)}
                      className="w-full rounded-sm border border-ev-border bg-ev-card/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-electric-green transition-colors resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">ความคิดเห็นเพิ่มเติม *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="เขียนรีวิวโดยละเอียดของคุณ..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-sm border border-ev-border bg-ev-card/40 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-electric-green transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-electric-green border border-ev-border px-6 py-2 text-xs font-bold text-ev-dark hover:bg-electric-green/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'กำลังส่งรีวิว...' : 'บันทึกรีวิว'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Reviews Feed */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="text-center rounded-xl border border-dashed border-ev-border py-10 text-slate-400 text-sm">
              ยังไม่มีความคิดเห็นสำหรับรถรุ่นนี้ เขียนเป็นคนแรกได้เลย!
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev._id} className="rounded-xl border border-ev-border bg-ev-card/25 p-6 space-y-4 animate-fade-in">
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-ev-border/40 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {rev.userName.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{rev.userName}</h4>
                        <span className="rounded-md bg-slate-800 text-slate-300 border border-ev-border text-[9px] px-1.5 py-0.5 font-bold">
                          รุ่นย่อย: {getTrimLabel(rev.evId)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400 flex items-center">
                      <Star className="h-3.5 w-3.5 fill-current text-amber-400 mr-1" />
                      <span className="font-bold text-white">{rev.rating}</span>/5
                    </div>
                  </div>
                </div>

                {/* Review Breakdown Ratings */}
                <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                  <span className="rounded-lg bg-electric-green/10 text-electric-green px-2 py-0.5 border border-electric-green/15">
                    แบตเตอรี่: {rev.ratingBattery}★
                  </span>
                  <span className="rounded-lg bg-electric-blue/10 text-electric-blue px-2 py-0.5 border border-electric-blue/15">
                    สมรรถนะ: {rev.ratingPerformance}★
                  </span>
                  <span className="rounded-lg bg-amber-400/10 text-amber-400 px-2 py-0.5 border border-amber-400/15">
                    ความนั่งสบาย: {rev.ratingComfort}★
                  </span>
                </div>

                {/* Review Comment */}
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {rev.comment}
                </p>

                {/* Pros & Cons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div className="rounded-xl bg-electric-green/5 border border-electric-green/10 p-3">
                    <div className="flex items-center text-electric-green font-bold mb-1.5 gap-1">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>ข้อดี</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-normal">{rev.pros}</p>
                  </div>
                  
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
                    <div className="flex items-center text-red-400 font-bold mb-1.5 gap-1">
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>ข้อเสีย / จุดสังเกต</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed font-normal">{rev.cons}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailFullClient;
