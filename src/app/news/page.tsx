'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Calendar, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import CompareSelector from '@/components/CompareSelector';

interface NewsArticle {
  title: string;
  link: string;
  image: string;
  description: string;
  date: string;
  timestamp: number;
  source: 'Headlightmag' | 'Autoinfo';
}

const NewsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border border-ev-border bg-ev-card/40 p-4 flex flex-col justify-between h-[380px] animate-pulse"
      >
        <div>
          <div className="h-44 w-full bg-slate-800 rounded-lg mb-4" />
          <div className="h-4 w-24 bg-slate-800 rounded mb-2" />
          <div className="h-6 w-full bg-slate-800 rounded mb-2" />
          <div className="h-4 w-2/3 bg-slate-800 rounded" />
        </div>
        <div className="h-10 w-full bg-slate-800 rounded-lg mt-4" />
      </div>
    ))}
  </div>
);

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Headlightmag' | 'Autoinfo'>('all');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) {
          setArticles(data);
        } else {
          setError('รูปแบบข้อมูลไม่ถูกต้อง');
        }
      } else {
        setError(data.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลข่าวสาร');
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredArticles = articles.filter((art) => {
    if (filter === 'all') return true;
    return art.source === filter;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight" style={{ textWrap: 'balance' }}>
            EV News Feed
          </h1>
          <p className="text-sm text-slate-400 mt-1">รวบรวมและคัดกรองเฉพาะข่าวสารยานยนต์ไฟฟ้าไทยล่าสุดจาก Headlightmag และ Autoinfo</p>
        </div>

        {/* Action button + Filter tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-ev-border bg-ev-dark/80 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white border border-ev-border/50'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('Headlightmag')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filter === 'Headlightmag'
                  ? 'bg-electric-green/10 text-electric-green border border-electric-green/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              HeadLight
            </button>
            <button
              onClick={() => setFilter('Autoinfo')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filter === 'Autoinfo'
                  ? 'bg-electric-blue/10 text-electric-blue border border-electric-blue/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              AutoInfo
            </button>
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-ev-border text-slate-300 hover:text-white hover:border-slate-500 disabled:opacity-50 transition-all text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข่าว</span>
          </button>
        </div>
      </div>

      {loading ? (
        <NewsSkeleton />
      ) : error ? (
        /* ─── Error state ─── */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-500/30 py-16 text-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-center mb-5 text-red-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="text-md font-bold text-white">เกิดข้อผิดพลาดในการโหลดข่าว</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm px-4 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchNews}
            className="mt-6 rounded-lg bg-slate-800 hover:bg-slate-700 border border-ev-border px-5 py-2.5 text-xs font-bold text-white transition-all"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        /* ─── Empty state ─── */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ev-border py-16 text-center max-w-lg mx-auto">
          <div className="h-14 w-14 rounded-xl border border-ev-border bg-ev-card flex items-center justify-center mb-5 text-slate-500">
            <Newspaper className="h-7 w-7" />
          </div>
          <h2 className="text-md font-bold text-white">ไม่พบข่าวสาร EV ในกลุ่มนี้</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-sm px-4 leading-relaxed">
            ไม่พบบทความหรือข่าวสารที่มีคำสำคัญเกี่ยวข้องกับยานยนต์ไฟฟ้าในช่องทางที่คุณเลือกชั่วคราว
          </p>
        </div>
      ) : (
        /* ─── News Grid ─── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {filteredArticles.map((article, idx) => {
            const isHeadlight = article.source === 'Headlightmag';
            return (
              <div
                key={article.link + '-' + idx}
                className="group flex flex-col rounded-xl border border-ev-border bg-ev-card overflow-hidden hover:border-slate-600 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden shrink-0">
                  {article.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/40">
                      <Newspaper className="h-10 w-10 mb-2 stroke-[1.5]" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                    </div>
                  )}
                  {/* Source tag overlay */}
                  <div className="absolute top-4 right-4">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold uppercase border ${
                      isHeadlight
                        ? 'bg-electric-green/10 text-electric-green border-electric-green/20'
                        : 'bg-electric-blue/10 text-electric-blue border-electric-blue/20'
                    }`}>
                      {article.source}
                    </span>
                  </div>
                </div>

                {/* Article Info */}
                <div className="p-5 flex flex-col flex-grow">
                  {/* Date */}
                  <div className="flex items-center text-slate-500 text-[10px] font-semibold mb-2.5">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    <span>{article.date || 'ไม่ระบุวันที่'}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-extrabold text-white leading-snug group-hover:text-electric-green transition-colors line-clamp-2 mb-3">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-400 leading-relaxed font-normal line-clamp-3 mb-6">
                    {article.description || 'ไม่มีคำอธิบายข่าวสารประกอบหัวข้อนี้...'}
                  </p>

                  {/* CTA link */}
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center space-x-1.5 w-full rounded-lg bg-slate-900 border border-ev-border py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <span>อ่านข่าวต่อบนเว็บหลัก</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating comparison Selector widget */}
      <CompareSelector />
    </div>
  );
}
