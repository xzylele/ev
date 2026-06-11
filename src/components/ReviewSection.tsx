'use client';

import React, { useState } from 'react';
import { Star, MessageSquarePlus, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ReviewData {
  _id: string;
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

interface ReviewSectionProps {
  evId: string;
  initialReviews: string; // Serialized JSON array
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ evId, initialReviews }) => {
  const [reviews, setReviews] = useState<ReviewData[]>(JSON.parse(initialReviews));
  
  // Form state
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

  // Calculate averages
  const avgOverall = reviews.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const avgBattery = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingBattery, 0) / reviews.length).toFixed(1) : '0.0';
  const avgPerformance = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingPerformance, 0) / reviews.length).toFixed(1) : '0.0';
  const avgComfort = reviews.length ? (reviews.reduce((acc, r) => acc + r.ratingComfort, 0) / reviews.length).toFixed(1) : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
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
          evId,
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
      
      // Add new review to local state
      setReviews(prev => [data.review, ...prev]);

      // Reset form
      setUserName('');
      setRating(5);
      setRatingBattery(5);
      setRatingPerformance(5);
      setRatingComfort(5);
      setPros('');
      setCons('');
      setComment('');
      
      // Hide form after a short delay
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

  const renderStarRating = (score: number, setScore?: (val: number) => void) => {
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
    <div className="mt-12 border-t border-ev-border pt-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">รีวิวและคะแนนสะสมจากผู้ใช้จริง</h2>
          <p className="text-sm text-slate-400 mt-1">แบ่งปันประสบการณ์ตรงจากการขับขี่จริง</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 rounded-2xl border border-ev-border bg-ev-card/30 p-6">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-ev-border pb-6 md:pb-0">
          <span className="text-5xl font-extrabold text-white">{avgOverall}</span>
          <div className="mt-2">{renderStarRating(Math.round(Number(avgOverall)))}</div>
          <span className="text-xs text-slate-500 mt-2">จากทั้งหมด {reviews.length} รีวิว</span>
        </div>

        <div className="col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-400 mb-1">ประสิทธิภาพแบตเตอรี่</span>
            <span className="text-xl font-bold text-electric-green mb-1">{avgBattery} / 5</span>
            {renderStarRating(Math.round(Number(avgBattery)))}
          </div>
          <div className="flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-400 mb-1">สมรรถนะการขับขี่</span>
            <span className="text-xl font-bold text-electric-blue mb-1">{avgPerformance} / 5</span>
            {renderStarRating(Math.round(Number(avgPerformance)))}
          </div>
          <div className="flex flex-col justify-center items-center text-center">
            <span className="text-xs font-semibold text-slate-400 mb-1">ความนั่งสบาย & กว้างขวาง</span>
            <span className="text-xl font-bold text-amber-400 mb-1">{avgComfort} / 5</span>
            {renderStarRating(Math.round(Number(avgComfort)))}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-10 rounded-2xl border border-slate-700 bg-ev-card p-6 md:p-8 animate-slide-up">
          <div className="flex items-center justify-between border-b border-ev-border pb-4 mb-6">
            <h3 className="text-lg font-bold text-white">ส่งความคิดเห็นรถคันนี้</h3>
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
                    className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-700 transition-colors"
                  />
                </div>
                
                {/* Star Ratings Form */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">คะแนนภาพรวม:</span>
                    {renderStarRating(rating, setRating)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">ด้านแบตเตอรี่/ชาร์จ:</span>
                    {renderStarRating(ratingBattery, setRatingBattery)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">ด้านสมรรถนะ/ความเร็ว:</span>
                    {renderStarRating(ratingPerformance, setRatingPerformance)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">ด้านความกว้างขวาง/ห้องโดยสาร:</span>
                    {renderStarRating(ratingComfort, setRatingComfort)}
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
                    className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-700 transition-colors resize-none"
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
                    className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-700 transition-colors resize-none"
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
                  className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-slate-700 transition-colors resize-none"
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
                  className="rounded-xl bg-gradient-to-r from-electric-green to-electric-blue px-6 py-2 text-xs font-bold text-ev-dark hover:opacity-90 transition-opacity disabled:opacity-50"
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
          <div className="text-center rounded-2xl border border-dashed border-ev-border py-10 text-slate-500 text-sm">
            ยังไม่มีความคิดเห็นสำหรับรถรุ่นนี้ เขียนเป็นคนแรกได้เลย!
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev._id} className="rounded-2xl border border-ev-border bg-ev-card/25 p-6 space-y-4">
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-ev-border/40 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {rev.userName.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{rev.userName}</h4>
                    <span className="text-[10px] text-slate-500">
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

              {/* Review Breakdown Ratings (small tags) */}
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

              {/* Pros & Cons display */}
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
  );
};

export default ReviewSection;
