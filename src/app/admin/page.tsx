'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, LogIn, Plus, Edit, Trash2, CheckCircle, XCircle,
  RefreshCw, Eye, MessageSquare, AlertCircle, Link2, X as XIcon,
  ChevronDown, ChevronRight, Search, Filter, Copy, Car, Users,
  Clock, Shield, Zap, Battery, Newspaper, EyeOff
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  price: number;
  image: string;
  gallery: string[];
  bodyType: 'Sedan' | 'SUV' | 'Hatchback' | 'MPV' | 'Others';
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
  driveType: 'RWD' | 'FWD' | 'AWD';
  batteryCapacity: number;
  batteryType: 'LFP' | 'NMC' | 'Others';
  rangeWLTP: number;
  rangeNEDC: number;
  rangeCLTC: number;
  acChargePower: number;
  dcChargePower: number;
  voltageArchitecture: '400V' | '800V';
  v2lSupport: boolean;
  v2lPower: number;
  adasLevel: number;
  adaptiveCruiseControl: boolean;
  laneKeepAssist: boolean;
  autoEmergencyBraking: boolean;
  blindSpotMonitor: boolean;
  autoParking: boolean;
  adasFeatures: string;
}

interface ReviewSpec {
  _id: string;
  evId: {
    _id: string;
    brand: string;
    model: string;
    trim: string;
  } | null;
  userName: string;
  rating: number;
  ratingBattery: number;
  ratingPerformance: number;
  ratingComfort: number;
  comment: string;
  pros: string;
  cons: string;
  approved: boolean;
  createdAt: string;
}

interface NewsSpec {
  _id: string;
  title: string;
  link: string;
  image: string;
  description: string;
  date: string;
  timestamp: number;
  source: string;
  hidden: boolean;
  isCustom: boolean;
}

interface NewsFormData {
  title: string;
  link: string;
  image: string;
  description: string;
  date: string;
  hidden: boolean;
}

const defaultNewsForm: NewsFormData = {
  title: '',
  link: '',
  image: '',
  description: '',
  date: '',
  hidden: false,
};

// ─── Default Form State ──────────────────────────────────────

type CarFormData = Omit<CarSpec, '_id'>;

const defaultCarForm: CarFormData = {
  brand: '', model: '', trim: '', price: 0, image: '', gallery: [],
  bodyType: 'SUV', warrantyYears: 8, warrantyKm: 160000,
  length: 4500, width: 1850, height: 1600, wheelbase: 2700,
  cargoVolume: 400, frunkVolume: 0,
  horsepower: 200, torque: 300, acceleration0To100: 7.5,
  topSpeed: 160, driveType: 'FWD',
  batteryCapacity: 60, batteryType: 'LFP',
  rangeWLTP: 400, rangeNEDC: 480, rangeCLTC: 0,
  acChargePower: 7, dcChargePower: 88,
  voltageArchitecture: '400V', v2lSupport: true, v2lPower: 3.3,
  adasLevel: 2, adaptiveCruiseControl: true, laneKeepAssist: true,
  autoEmergencyBraking: true, blindSpotMonitor: true, autoParking: false,
  adasFeatures: '',
};

// ─── Helpers ─────────────────────────────────────────────────

function SubRatingBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-slate-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value / 5) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="text-slate-300 w-4 text-right font-bold">{value}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

const AdminPage = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Data
  const [cars, setCars] = useState<CarSpec[]>([]);
  const [reviews, setReviews] = useState<ReviewSpec[]>([]);
  const [news, setNews] = useState<NewsSpec[]>([]);
  const [activeTab, setActiveTab] = useState<'cars' | 'reviews' | 'news'>('cars');
  const [isLoading, setIsLoading] = useState(false);

  // Search / Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [newsFilter, setNewsFilter] = useState<'all' | 'custom' | 'synced' | 'hidden'>('all');

  // ─ A. Consolidated Form State ─
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [carForm, setCarForm] = useState<CarFormData>({ ...defaultCarForm });
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // News Form States
  const [isNewsFormOpen, setIsNewsFormOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<NewsFormData>({ ...defaultNewsForm });
  const [isSyncingNews, setIsSyncingNews] = useState(false);

  const updateField = useCallback(<K extends keyof CarFormData>(key: K, value: CarFormData[K]) => {
    setCarForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateNewsField = useCallback(<K extends keyof NewsFormData>(key: K, value: NewsFormData[K]) => {
    setNewsForm(prev => ({ ...prev, [key]: value }));
  }, []);

  // Brand accordion
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set());
  const toggleBrand = (b: string) => {
    setCollapsedBrands(prev => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  };

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ─ F. Batch Review State ─
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const toggleReviewSelect = (id: string) => {
    setSelectedReviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllReviews = (ids: string[]) => {
    setSelectedReviews(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  };

  // Alert
  const [alertMsg, setAlertMsg] = useState({ text: '', type: 'success' });
  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: 'success' }), 4000);
  };

  // ─── Auth ────────────────────────────────────────────────

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_passcode');
    if (stored) { setPasscode(stored); verifyAndLoad(stored); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyAndLoad = async (code: string) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/cms/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      if (res.ok) {
        sessionStorage.setItem('admin_passcode', code);
        setPasscode(code);
        setIsAuthorized(true);
        loadDashboardData();
      } else {
        const data = await res.json();
        sessionStorage.removeItem('admin_passcode');
        setAuthError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch {
      setAuthError('ระบบขัดข้องกรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) { setAuthError('กรุณากรอกรหัสผ่าน'); return; }
    verifyAndLoad(passcode);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_passcode');
    setPasscode('');
    setIsAuthorized(false);
  };

  const getPasscode = () => passcode || sessionStorage.getItem('admin_passcode') || '';

  // ─── Data Loading ─────────────────────────────────────────

  const loadDashboardData = async () => {
    setIsLoading(true);
    const pc = getPasscode();
    try {
      const [carsRes, revRes, newsRes] = await Promise.all([
        fetch('/api/cms/cars'),
        fetch('/api/cms/reviews'),
        fetch(`/api/cms/news?passcode=${pc}`),
      ]);
      const carsData = await carsRes.json();
      const revData = await revRes.json();
      const newsData = await newsRes.json();
      if (carsRes.ok) setCars(carsData);
      if (revRes.ok) setReviews(revData);
      if (newsRes.ok) setNews(newsData);
    } catch {
      showAlert('โหลดข้อมูลขัดข้อง', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Car CRUD ─────────────────────────────────────────────

  const resetCarForm = () => {
    setEditingCarId(null);
    setCarForm({ ...defaultCarForm });
    setImagePreviewError(false);
  };

  const openAddForm = (prefillBrand?: string) => {
    resetCarForm();
    if (prefillBrand) updateField('brand', prefillBrand);
    setIsCarFormOpen(true);
  };

  // ─ D. Duplicate Trim ─
  const handleDuplicateCar = (car: CarSpec) => {
    const { _id, ...rest } = car;
    setEditingCarId(null);
    setCarForm({ ...rest, trim: '' });
    setImagePreviewError(false);
    setIsCarFormOpen(true);
  };

  const handleEditCarClick = (car: CarSpec) => {
    const { _id, ...rest } = car;
    setEditingCarId(_id);
    setCarForm({ ...rest });
    setImagePreviewError(false);
    setIsCarFormOpen(true);
  };

  const handleSubmitCarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const pc = getPasscode();
    const carData = {
      ...carForm,
      gallery: (carForm.gallery || []).map(u => u.trim()).filter(u => u !== ''),
      v2lPower: carForm.v2lSupport ? carForm.v2lPower : 0,
    };

    try {
      const url = editingCarId ? `/api/cms/cars/${editingCarId}` : '/api/cms/cars';
      const method = editingCarId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': pc },
        body: JSON.stringify(carData),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(editingCarId ? 'แก้ไขข้อมูลรถสำเร็จ' : 'เพิ่มรถรุ่นใหม่สำเร็จ', 'success');
        setIsCarFormOpen(false);
        resetCarForm();
        loadDashboardData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'บันทึกข้อมูลล้มเหลว', 'error');
    }
  };

  const handleDeleteCar = (id: string) => { setConfirmDeleteId(id); };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const pc = getPasscode();
    if (!pc) { showAlert('ไม่พบรหัสผ่าน กรุณา logout แล้ว login ใหม่', 'error'); return; }
    try {
      const res = await fetch(`/api/cms/cars/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-passcode': pc },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('ลบข้อมูลรถยนต์ไฟฟ้าสำเร็จ', 'success');
        setCars(prev => prev.filter(c => c._id !== id));
      } else {
        showAlert('ลบไม่สำเร็จ: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e: any) {
      showAlert(e.message || 'ลบข้อมูลล้มเหลว', 'error');
    }
  };

  // ─── Review CRUD ──────────────────────────────────────────

  const handleToggleReviewApprove = async (id: string, currentApproved: boolean) => {
    const pc = getPasscode();
    try {
      const res = await fetch(`/api/cms/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': pc },
        body: JSON.stringify({ approved: !currentApproved }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('อัปเดตสถานะรีวิวสำเร็จ', 'success');
        setReviews(prev => prev.map(r => r._id === id ? { ...r, approved: !currentApproved } : r));
      } else { throw new Error(data.error); }
    } catch (e: any) {
      showAlert(e.message || 'บันทึกสถานะล้มเหลว', 'error');
    }
  };

  const handleDeleteReview = async (id: string) => {
    const pc = getPasscode();
    try {
      const res = await fetch(`/api/cms/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-passcode': pc },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('ลบความคิดเห็นสำเร็จ', 'success');
        setReviews(prev => prev.filter(r => r._id !== id));
        setSelectedReviews(prev => { const n = new Set(prev); n.delete(id); return n; });
      } else { throw new Error(data.error); }
    } catch (e: any) {
      showAlert(e.message || 'ลบความคิดเห็นล้มเหลว', 'error');
    }
  };

  // ─ F. Batch Actions ─
  const handleBatchApprove = async () => {
    if (selectedReviews.size === 0) return;
    setIsBatchProcessing(true);
    const pc = getPasscode();
    let successCount = 0;
    for (const id of selectedReviews) {
      try {
        const res = await fetch(`/api/cms/reviews/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-passcode': pc },
          body: JSON.stringify({ approved: true }),
        });
        if (res.ok) {
          successCount++;
          setReviews(prev => prev.map(r => r._id === id ? { ...r, approved: true } : r));
        }
      } catch { /* skip */ }
    }
    setSelectedReviews(new Set());
    setIsBatchProcessing(false);
    showAlert(`อนุมัติสำเร็จ ${successCount} รายการ`, 'success');
  };

  const handleBatchDelete = async () => {
    if (selectedReviews.size === 0) return;
    setIsBatchProcessing(true);
    const pc = getPasscode();
    let successCount = 0;
    for (const id of selectedReviews) {
      try {
        const res = await fetch(`/api/cms/reviews/${id}`, {
          method: 'DELETE',
          headers: { 'x-admin-passcode': pc },
        });
        if (res.ok) {
          successCount++;
          setReviews(prev => prev.filter(r => r._id !== id));
        }
      } catch { /* skip */ }
    }
    setSelectedReviews(new Set());
    setIsBatchProcessing(false);
    showAlert(`ลบสำเร็จ ${successCount} รายการ`, 'success');
  };

  // ─── Seed Reset ───────────────────────────────────────────

  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const handleTriggerSeedReset = async () => {
    setShowSeedConfirm(false);
    setIsLoading(true);
    try {
      const res = await fetch('/api/cms/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('รีเซ็ตล้างฐานข้อมูลสำเร็จ', 'success');
        loadDashboardData();
      } else { throw new Error(data.error); }
    } catch (e: any) {
      showAlert(e.message || 'รีเซ็ตขัดข้อง', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── News CRUD & Sync ────────────────────────────────────

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsForm({ ...defaultNewsForm });
  };

  const openAddNewsForm = () => {
    resetNewsForm();
    setIsNewsFormOpen(true);
  };

  const handleEditNewsClick = (article: NewsSpec) => {
    setEditingNewsId(article._id);
    setNewsForm({
      title: article.title,
      link: article.isCustom ? article.link : '',
      image: article.image,
      description: article.description,
      date: article.date,
      hidden: article.hidden
    });
    setIsNewsFormOpen(true);
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('คุณต้องการลบข่าวสารนี้ออกจากระบบใช่หรือไม่?')) return;
    const pc = getPasscode();
    try {
      const res = await fetch(`/api/cms/news/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-passcode': pc },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('ลบข่าวสารสำเร็จ', 'success');
        setNews(prev => prev.filter(n => n._id !== id));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'ลบข้อมูลล้มเหลว', 'error');
    }
  };

  const handleToggleNewsHidden = async (article: NewsSpec) => {
    const pc = getPasscode();
    try {
      const res = await fetch(`/api/cms/news/${article._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': pc },
        body: JSON.stringify({ hidden: !article.hidden }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert(article.hidden ? 'เปิดแสดงผลข่าวสารแล้ว' : 'ซ่อนข่าวสารเรียบร้อย', 'success');
        setNews(prev => prev.map(n => n._id === article._id ? { ...n, hidden: !article.hidden } : n));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'ดำเนินการล้มเหลว', 'error');
    }
  };

  const handleSubmitNewsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const pc = getPasscode();
    try {
      const url = editingNewsId ? `/api/cms/news/${editingNewsId}` : '/api/cms/news';
      const method = editingNewsId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-passcode': pc },
        body: JSON.stringify({
          ...newsForm,
          passcode: pc
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(editingNewsId ? 'แก้ไขข้อมูลข่าวสำเร็จ' : 'เพิ่มข่าวใหม่สำเร็จ', 'success');
        setIsNewsFormOpen(false);
        resetNewsForm();
        loadDashboardData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'บันทึกข้อมูลล้มเหลว', 'error');
    }
  };

  const handleSyncNews = async () => {
    setIsSyncingNews(true);
    const pc = getPasscode();
    try {
      const res = await fetch('/api/cms/news/sync', {
        method: 'POST',
        headers: { 'x-admin-passcode': pc },
      });
      const data = await res.json();
      if (res.ok) {
        showAlert(`ซิงค์ข้อมูลข่าวสำเร็จ ดึงข่าวใหม่ได้ ${data.syncedCount} ข่าว (Scraped: ${data.totalScraped})`, 'success');
        loadDashboardData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'ซิงค์ข้อมูลล้มเหลว', 'error');
    } finally {
      setIsSyncingNews(false);
    }
  };

  // ─── Computed Data ────────────────────────────────────────

  const filteredCars = cars.filter(car =>
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.trim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(rev => {
    if (reviewFilter === 'approved') return rev.approved;
    if (reviewFilter === 'pending') return !rev.approved;
    return true;
  });

  const filteredNews = news.filter(n => {
    const titleMatch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       n.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!titleMatch) return false;
    
    if (newsFilter === 'custom') return n.isCustom;
    if (newsFilter === 'synced') return !n.isCustom;
    if (newsFilter === 'hidden') return n.hidden;
    return true;
  });

  const uniqueBrands = new Set(cars.map(c => c.brand));
  const pendingReviewCount = reviews.filter(r => !r.approved).length;

  // ─── Login Screen ─────────────────────────────────────────

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 min-h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full rounded-xl border border-ev-border bg-ev-card p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-green text-ev-dark mb-4">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-white text-center">เข้าสู่ระบบแอดมินหลังบ้าน</h1>
            <p className="text-xs text-slate-500 mt-1 text-center">ป้อนรหัสผ่านผู้ดูแลระบบเพื่อเข้าจัดการฐานข้อมูล</p>
          </div>

          {authError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">รหัสผ่าน (Passcode)</label>
              <input
                type="password"
                required
                placeholder="ป้อนรหัสผ่าน"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-lg border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-electric-green transition-colors text-center font-bold tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-electric-green py-3 px-4 text-sm font-bold text-ev-dark hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'กำลังตรวจสอบ...' : 'ลงชื่อเข้าใช้'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Dashboard (Authorized) ───────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Status Alerts */}
      {alertMsg.text && (
        <div className={`fixed top-20 right-6 z-50 rounded-lg border p-4 text-xs font-bold transition-all ${
          alertMsg.type === 'success' ? 'bg-electric-green/10 border-electric-green text-electric-green' : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Delete Car Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-ev-card p-6 mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">ยืนยันการลบ</h3>
                <p className="text-xs text-slate-400">คุณแน่ใจหรือไม่ว่าต้องการลบรถยนต์ไฟฟ้ารุ่นนี้ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-lg border border-ev-border bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white">ยกเลิก</button>
                <button onClick={confirmDelete} className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600">ยืนยันลบ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seed Reset Confirmation Modal */}
      {showSeedConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-ev-card p-6 mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <RefreshCw className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">ยืนยันรีเซ็ตฐานข้อมูล</h3>
                <p className="text-xs text-slate-400">ข้อมูลรถยนต์และรีวิวทั้งหมดจะถูกลบ แล้วเติมข้อมูลเริ่มต้นใหม่ การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowSeedConfirm(false)} className="flex-1 rounded-lg border border-ev-border bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white">ยกเลิก</button>
                <button onClick={handleTriggerSeedReset} className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600">ยืนยันรีเซ็ต</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── B. Modal Form Overlay ───────────────────────── */}
      {isCarFormOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
          <form
            onSubmit={handleSubmitCarForm}
            className="w-full max-w-4xl my-8 mx-4 rounded-xl border border-ev-border bg-ev-dark flex flex-col overflow-hidden text-sm"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ev-border p-5 bg-ev-card sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-extrabold text-white">{editingCarId ? '✏️ แก้ไขสเปครถยนต์' : '✨ เพิ่มรถยนต์รุ่นใหม่'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">กรอกข้อมูลทั้ง 5 หมวดให้ครบถ้วน</p>
              </div>
              <button type="button" onClick={() => setIsCarFormOpen(false)} className="p-2 rounded-lg border border-ev-border text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">

              {/* 1. ข้อมูลพื้นฐาน */}
              <section>
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-electric-blue pl-3">
                  1. ข้อมูลพื้นฐาน
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InputField label="แบรนด์ *" value={carForm.brand} onChange={v => updateField('brand', v)} placeholder="เช่น Tesla, BYD" />
                  <InputField label="รุ่น (Model) *" value={carForm.model} onChange={v => updateField('model', v)} placeholder="เช่น Model Y" />
                  <InputField label="รุ่นย่อย (Trim) *" value={carForm.trim} onChange={v => updateField('trim', v)} placeholder="เช่น Long Range" />
                  <InputField label="ราคา (บาท) *" type="number" value={carForm.price} onChange={v => updateField('price', Number(v))} />
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1"><Link2 className="h-3 w-3" /> ลิงก์ภาพรถหลัก *</label>
                    <input type="text" required value={carForm.image} onChange={e => { updateField('image', e.target.value); setImagePreviewError(false); }}
                      className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white outline-none focus:border-electric-green transition-colors" placeholder="URL รูปภาพหลัก" />
                    {carForm.image && !imagePreviewError && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={carForm.image} alt="Preview" className="h-20 rounded-lg border border-ev-border object-cover" onError={() => setImagePreviewError(true)} />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3 mt-2">
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1"><Link2 className="h-3 w-3" /> แกลเลอรีภาพเพิ่มเติม (1 บรรทัดต่อ 1 ลิงก์)</label>
                    <textarea value={carForm.gallery?.join('\n') || ''} onChange={e => updateField('gallery', e.target.value.split('\n'))}
                      className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white outline-none focus:border-electric-green transition-colors text-xs resize-y" placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" rows={3} />
                    {carForm.gallery && carForm.gallery.length > 0 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                        {carForm.gallery.map((url, i) => url.trim() ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img key={i} src={url} alt={`Gallery ${i+1}`} className="h-16 w-24 rounded border border-ev-border object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : null)}
                      </div>
                    )}
                  </div>
                  <SelectField label="ประเภทตัวถัง *" value={carForm.bodyType} onChange={v => updateField('bodyType', v as CarFormData['bodyType'])}
                    options={[['Sedan','Sedan (เก๋ง)'],['SUV','SUV'],['Hatchback','Hatchback'],['MPV','MPV'],['Others','อื่นๆ']]} />
                  <InputField label="ประกัน (ปี) *" type="number" value={carForm.warrantyYears} onChange={v => updateField('warrantyYears', Number(v))} />
                  <InputField label="ประกัน (กม.) *" type="number" value={carForm.warrantyKm} onChange={v => updateField('warrantyKm', Number(v))} />
                </div>
              </section>

              {/* 2. มิติตัวถัง */}
              <section>
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-slate-500 pl-3">
                  2. มิติตัวถัง
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-ev-card p-4 rounded-xl border border-ev-border">
                  <InputField label="ยาว (มม.)" type="number" value={carForm.length} onChange={v => updateField('length', Number(v))} compact />
                  <InputField label="กว้าง (มม.)" type="number" value={carForm.width} onChange={v => updateField('width', Number(v))} compact />
                  <InputField label="สูง (มม.)" type="number" value={carForm.height} onChange={v => updateField('height', Number(v))} compact />
                  <InputField label="ฐานล้อ (มม.)" type="number" value={carForm.wheelbase} onChange={v => updateField('wheelbase', Number(v))} compact />
                  <InputField label="ท้ายรถ (ลิตร)" type="number" value={carForm.cargoVolume} onChange={v => updateField('cargoVolume', Number(v))} compact />
                  <InputField label="Frunk (ลิตร)" type="number" value={carForm.frunkVolume} onChange={v => updateField('frunkVolume', Number(v))} compact />
                </div>
              </section>

              {/* 3. สมรรถนะ */}
              <section>
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-red-500 pl-3">
                  3. สมรรถนะ
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-ev-card p-4 rounded-xl border border-ev-border">
                  <InputField label="แรงม้า (HP)" type="number" value={carForm.horsepower} onChange={v => updateField('horsepower', Number(v))} compact />
                  <InputField label="แรงบิด (Nm)" type="number" value={carForm.torque} onChange={v => updateField('torque', Number(v))} compact />
                  <InputField label="0-100 (วินาที)" type="number" step="0.1" value={carForm.acceleration0To100} onChange={v => updateField('acceleration0To100', Number(v))} compact />
                  <InputField label="Max Speed" type="number" value={carForm.topSpeed} onChange={v => updateField('topSpeed', Number(v))} compact />
                  <SelectField label="ขับเคลื่อน" value={carForm.driveType} onChange={v => updateField('driveType', v as CarFormData['driveType'])}
                    options={[['FWD','ล้อหน้า (FWD)'],['RWD','ล้อหลัง (RWD)'],['AWD','4 ล้อ (AWD)']]} compact />
                </div>
              </section>

              {/* 4. แบตเตอรี่ & การชาร์จ */}
              <section>
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-electric-green pl-3">
                  4. แบตเตอรี่ & การชาร์จ
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-ev-card p-4 rounded-xl border border-ev-border">
                  <InputField label="ความจุ (kWh)" type="number" value={carForm.batteryCapacity} onChange={v => updateField('batteryCapacity', Number(v))} compact />
                  <SelectField label="เซลล์แบต" value={carForm.batteryType} onChange={v => updateField('batteryType', v as CarFormData['batteryType'])}
                    options={[['LFP','LFP'],['NMC','NMC'],['Others','Others']]} compact />
                  <InputField label="WLTP (กม.)" type="number" value={carForm.rangeWLTP} onChange={v => updateField('rangeWLTP', Number(v))} compact />
                  <InputField label="NEDC (กม.)" type="number" value={carForm.rangeNEDC} onChange={v => updateField('rangeNEDC', Number(v))} compact />
                  <InputField label="CLTC (กม.)" type="number" value={carForm.rangeCLTC} onChange={v => updateField('rangeCLTC', Number(v))} compact />
                  <SelectField label="สถาปัตยกรรมไฟ" value={carForm.voltageArchitecture} onChange={v => updateField('voltageArchitecture', v as CarFormData['voltageArchitecture'])}
                    options={[['400V','400V'],['800V','800V']]} compact />
                  <InputField label="AC Max (kW)" type="number" value={carForm.acChargePower} onChange={v => updateField('acChargePower', Number(v))} compact />
                  <InputField label="DC Max (kW)" type="number" value={carForm.dcChargePower} onChange={v => updateField('dcChargePower', Number(v))} compact />
                  <div className="flex items-end col-span-1">
                    <label className="flex items-center text-xs font-bold text-electric-green cursor-pointer select-none bg-electric-green/10 px-3 py-2 rounded-lg border border-electric-green/20 w-full justify-center gap-2">
                      <input type="checkbox" checked={carForm.v2lSupport} onChange={e => updateField('v2lSupport', e.target.checked)} className="h-4 w-4 accent-electric-green rounded" />
                      V2L
                    </label>
                  </div>
                  {carForm.v2lSupport && (
                    <InputField label="V2L Max (kW)" type="number" step="0.1" value={carForm.v2lPower} onChange={v => updateField('v2lPower', Number(v))} compact />
                  )}
                </div>
              </section>

              {/* ─ C. 5. ADAS Section ─ */}
              <section>
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-ev-highlight pl-3">
                  5. ระบบช่วยขับขี่ (ADAS)
                </h4>
                <div className="bg-ev-card p-4 rounded-xl border border-ev-border space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <SelectField label="ระดับ ADAS" value={String(carForm.adasLevel)} onChange={v => updateField('adasLevel', Number(v))}
                      options={[['0','0 — ไม่มี'],['1','1 — พื้นฐาน'],['2','2 — ขั้นสูง'],['3','3 — กึ่งอัตโนมัติ']]} compact />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    <ToggleChip label="Adaptive Cruise" checked={carForm.adaptiveCruiseControl} onChange={v => updateField('adaptiveCruiseControl', v)} />
                    <ToggleChip label="Lane Keep Assist" checked={carForm.laneKeepAssist} onChange={v => updateField('laneKeepAssist', v)} />
                    <ToggleChip label="Auto Braking" checked={carForm.autoEmergencyBraking} onChange={v => updateField('autoEmergencyBraking', v)} />
                    <ToggleChip label="Blind Spot" checked={carForm.blindSpotMonitor} onChange={v => updateField('blindSpotMonitor', v)} />
                    <ToggleChip label="Auto Parking" checked={carForm.autoParking} onChange={v => updateField('autoParking', v)} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">ฟีเจอร์ ADAS เพิ่มเติม</label>
                    <textarea
                      value={carForm.adasFeatures}
                      onChange={e => updateField('adasFeatures', e.target.value)}
                      placeholder="เช่น DiPilot, LCC, TJA, FCW, RCW, RCTA, LDA"
                      rows={2}
                      className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white text-xs outline-none focus:border-electric-green transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Modal Footer — sticky */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t border-ev-border bg-ev-card sticky bottom-0">
              <button type="button" onClick={() => setIsCarFormOpen(false)} className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full sm:w-auto">
                ยกเลิก
              </button>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-electric-green px-8 py-2.5 text-sm font-extrabold text-ev-dark hover:opacity-90 transition-all w-full sm:w-auto">
                <CheckCircle className="h-4 w-4" />
                {editingCarId ? 'บันทึกการแก้ไข' : 'เพิ่มรถเข้าระบบ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── News Form Modal Overlay ───────────────────────── */}
      {isNewsFormOpen && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
          <form
            onSubmit={handleSubmitNewsForm}
            className="w-full max-w-2xl my-8 mx-4 rounded-xl border border-ev-border bg-ev-dark flex flex-col overflow-hidden text-sm animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ev-border p-5 bg-ev-card sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-extrabold text-white">{editingNewsId ? '✏️ แก้ไขข้อมูลข่าวสาร' : '✍️ เพิ่มข่าวสารใหม่'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">กรอกข้อมูลข่าวสาร EV ให้ครบถ้วน</p>
              </div>
              <button type="button" onClick={() => setIsNewsFormOpen(false)} className="p-2 rounded-lg border border-ev-border text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <InputField label="หัวข้อข่าวสาร (Title)" value={newsForm.title} onChange={v => updateNewsField('title', v)} placeholder="เช่น BYD เปิดตัวรถสปอร์ตรุ่นใหม่..." />
              
              {!editingNewsId && (
                <InputField label="ลิงก์บทความต้นทาง (Link/URL - เลือกกรอกหรือไม่กรอกก็ได้)" value={newsForm.link} onChange={v => updateNewsField('link', v)} placeholder="เช่น https://www.headlightmag.com/... (หากไม่กรอก ระบบจะสร้างลิงก์จำลองให้)" />
              )}

              <InputField label="URL รูปภาพประกอบข่าวสาร (Image URL)" value={newsForm.image} onChange={v => updateNewsField('image', v)} placeholder="เช่น https://www.headlightmag.com/image.jpg..." />
              
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-bold">เนื้อหาย่อ / บทคัดย่อ (Description)</label>
                <textarea
                  value={newsForm.description}
                  onChange={e => updateNewsField('description', e.target.value)}
                  placeholder="ป้อนรายละเอียดเนื้อหาข่าวอย่างย่อ..."
                  className="w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white outline-none focus:border-electric-green transition-colors text-xs h-28 resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="วันที่ลงข่าว (ระบุเอง หรือเว้นว่างให้เป็นวันนี้)" value={newsForm.date} onChange={v => updateNewsField('date', v)} placeholder="เช่น 14 มิ.ย. 2026" />
                <div className="flex flex-col justify-end pt-5">
                  <ToggleChip label="ซ่อนข่าวนี้ทันที (Hidden)" checked={newsForm.hidden} onChange={v => updateNewsField('hidden', v)} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 border-t border-ev-border bg-ev-card sticky bottom-0">
              <button type="button" onClick={() => setIsNewsFormOpen(false)} className="rounded-lg px-6 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full sm:w-auto">
                ยกเลิก
              </button>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-8 py-2.5 text-sm font-extrabold text-ev-dark hover:opacity-90 transition-all w-full sm:w-auto">
                <CheckCircle className="h-4 w-4" />
                {editingNewsId ? 'บันทึกการแก้ไข' : 'บันทึกและสร้างข่าว'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-ev-border pb-6 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-electric-green" />
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">จัดการฐานข้อมูลรถยนต์ไฟฟ้าและระบบรีวิว</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSeedConfirm(true)} className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>รีเซ็ตฐานข้อมูล</span>
          </button>
          <button onClick={handleLogout} className="rounded-lg border border-ev-border bg-ev-dark px-3 py-2 text-xs font-bold text-slate-400 hover:text-white">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* ─── E. Summary Stats Cards ─────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard icon={<Car className="h-5 w-5" />} label="รถ EV ทั้งหมด" value={cars.length} color="text-electric-green" />
        <StatCard icon={<Users className="h-5 w-5" />} label="จำนวนแบรนด์" value={uniqueBrands.size} color="text-electric-blue" />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="รีวิวทั้งหมด" value={reviews.length} color="text-slate-300" />
        <StatCard icon={<Newspaper className="h-5 w-5" />} label="ข่าวสาร EV" value={news.length} color="text-amber-400" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="รอตรวจสอบ" value={pendingReviewCount} color={pendingReviewCount > 0 ? 'text-amber-400' : 'text-slate-500'} highlight={pendingReviewCount > 0} />
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────── */}
      <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar border-b border-ev-border mb-8">
        <button
          onClick={() => setActiveTab('cars')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 font-bold text-sm transition-all shrink-0 ${activeTab === 'cars' ? 'border-electric-green text-electric-green' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Eye className="h-4 w-4" />
          <span>ฐานข้อมูลรถ EV ({cars.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 font-bold text-sm transition-all shrink-0 ${activeTab === 'reviews' ? 'border-electric-blue text-electric-blue' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>คัดกรองรีวิว ({reviews.length})</span>
          {pendingReviewCount > 0 && (
            <span className="ml-1 bg-amber-500 text-ev-dark text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">{pendingReviewCount}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`flex items-center gap-2 py-3.5 px-6 border-b-2 font-bold text-sm transition-all shrink-0 ${activeTab === 'news' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Newspaper className="h-4 w-4" />
          <span>จัดการข่าวสาร EV ({news.length})</span>
        </button>
      </div>

      {/* ─── Tab: Cars Management ───────────────────────────── */}
      {activeTab === 'cars' && (
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาแบรนด์ รุ่น หรือ trim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-ev-border rounded-lg text-sm text-white outline-none focus:border-electric-green transition-colors"
              />
            </div>
            <button
              onClick={() => openAddForm()}
              className="flex items-center gap-1.5 rounded-lg bg-electric-green px-4 py-2.5 text-xs font-bold text-ev-dark hover:opacity-90 transition-all w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มรุ่นรถใหม่</span>
            </button>
          </div>

          {filteredCars.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-ev-border rounded-xl text-sm">
              ไม่พบข้อมูลรถยนต์ที่ค้นหา
            </div>
          ) : (() => {
            const brandMap = new Map<string, typeof filteredCars>();
            filteredCars.forEach(car => {
              if (!brandMap.has(car.brand)) brandMap.set(car.brand, []);
              brandMap.get(car.brand)!.push(car);
            });
            const brandEntries = Array.from(brandMap.entries()).sort(([a], [b]) => a.localeCompare(b));

            return (
              <div className="space-y-3">
                {brandEntries.map(([brand, brandCars]) => {
                  const isCollapsed = collapsedBrands.has(brand);
                  const brandImage = brandCars[0]?.image;
                  return (
                    <div key={brand} className="rounded-xl border border-ev-border bg-ev-card/30 overflow-hidden">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleBrand(brand)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={brandImage} alt={brand} className="h-9 w-14 rounded-lg object-cover border border-ev-border/50 bg-slate-900 shrink-0" />
                          <div>
                            <p className="text-sm font-extrabold text-white">{brand}</p>
                            <p className="text-[11px] text-slate-400">{brandCars.length} รุ่นย่อย</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); openAddForm(brand); }}
                            className="flex items-center gap-1 rounded-lg border border-electric-green/30 bg-electric-green/10 px-2.5 py-1 text-[11px] font-bold text-electric-green hover:bg-electric-green/20"
                          >
                            <Plus className="h-3 w-3" /> เพิ่ม
                          </button>
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="overflow-x-auto border-t border-ev-border/40">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/40 text-slate-400 font-semibold">
                                <th className="px-4 py-2.5">โมเดล / รุ่นย่อย</th>
                                <th className="px-4 py-2.5">ราคา (บาท)</th>
                                <th className="px-4 py-2.5">แบตเตอรี่</th>
                                <th className="px-4 py-2.5">ระยะทาง</th>
                                <th className="px-4 py-2.5">ขับเคลื่อน</th>
                                <th className="px-4 py-2.5 text-center">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ev-border/20">
                              {brandCars.map(car => {
                                const range = Math.max(car.rangeWLTP, car.rangeNEDC, car.rangeCLTC);
                                return (
                                  <tr key={car._id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-1 rounded-full bg-electric-green/50" />
                                        <div>
                                          <p className="font-bold text-white text-[13px]">{car.model}</p>
                                          <p className="text-[10px] text-slate-400">{car.trim}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-2.5 font-bold text-white">{new Intl.NumberFormat('th-TH').format(car.price)}</td>
                                    <td className="px-4 py-2.5 text-slate-300">{car.batteryCapacity} kWh <span className="text-[10px] text-slate-500">({car.batteryType})</span></td>
                                    <td className="px-4 py-2.5 text-electric-green font-bold">{range} กม.</td>
                                    <td className="px-4 py-2.5">
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${car.driveType === 'AWD' ? 'bg-electric-blue/15 text-electric-blue' : 'bg-slate-800 text-slate-400'}`}>
                                        {car.driveType}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                      <div className="flex justify-center gap-1.5">
                                        {/* D. Duplicate */}
                                        <button onClick={() => handleDuplicateCar(car)} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-electric-blue hover:border-electric-blue/50 hover:bg-electric-blue/10 transition-colors" title="คัดลอกรุ่นนี้">
                                          <Copy className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleEditCarClick(car)} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="แก้ไข">
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteCar(car._id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="ลบ">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Tab: Reviews Moderation ─────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Review Filter Bar + Batch Actions */}
          <div className="flex flex-col gap-4 bg-ev-card/30 p-4 rounded-xl border border-ev-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Filter className="h-4 w-4 text-electric-blue" /> ตัวกรองรีวิว
              </h3>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-ev-border w-full sm:w-auto">
                {(['all', 'pending', 'approved'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setReviewFilter(filter); setSelectedReviews(new Set()); }}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      reviewFilter === filter
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {filter === 'all' ? `ทั้งหมด (${reviews.length})` :
                     filter === 'pending' ? `รอตรวจสอบ (${pendingReviewCount})` :
                     `อนุมัติแล้ว (${reviews.filter(r => r.approved).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* F. Batch Action Bar */}
            {filteredReviews.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-ev-border/40">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={filteredReviews.length > 0 && filteredReviews.every(r => selectedReviews.has(r._id))}
                    onChange={() => toggleAllReviews(filteredReviews.map(r => r._id))}
                    className="h-3.5 w-3.5 accent-electric-green rounded"
                  />
                  เลือกทั้งหมด ({selectedReviews.size}/{filteredReviews.length})
                </label>
                {selectedReviews.size > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleBatchApprove}
                      disabled={isBatchProcessing}
                      className="flex items-center gap-1 rounded-lg border border-electric-green/30 bg-electric-green/10 px-3 py-1.5 text-[11px] font-bold text-electric-green hover:bg-electric-green/20 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3 w-3" />
                      อนุมัติที่เลือก ({selectedReviews.size})
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={isBatchProcessing}
                      className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      ลบที่เลือก ({selectedReviews.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-ev-border rounded-xl text-sm">
              ไม่มีข้อมูลรีวิวในหมวดหมู่นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredReviews.map((rev) => (
                <div key={rev._id} className={`rounded-xl border p-4 relative transition-all ${rev.approved ? 'border-ev-border bg-ev-card/30' : 'border-amber-500/30 bg-amber-500/5'}`}>

                  {/* Checkbox + Actions Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(rev._id)}
                        onChange={() => toggleReviewSelect(rev._id)}
                        className="mt-1 h-3.5 w-3.5 accent-electric-green rounded shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-sm font-bold text-white">{rev.userName}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">{new Date(rev.createdAt).toLocaleDateString('th-TH')}</span>
                          {!rev.approved && <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full">รอตรวจสอบ</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          รถ: <span className="text-electric-blue">{rev.evId ? `${rev.evId.brand} ${rev.evId.model} (${rev.evId.trim})` : 'ไม่พบข้อมูล'}</span>
                          <span className="mx-1.5">·</span>
                          คะแนน: <span className="text-amber-400 font-bold">{rev.rating} ★</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleReviewApprove(rev._id, rev.approved)}
                        className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 text-[11px] font-bold ${
                          rev.approved
                            ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                            : 'border-electric-green/50 bg-electric-green/20 text-electric-green hover:bg-electric-green/30'
                        }`}
                      >
                        {rev.approved ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                        <span className="hidden sm:inline">{rev.approved ? 'ซ่อน' : 'อนุมัติ'}</span>
                      </button>
                      <button onClick={() => handleDeleteReview(rev._id)} className="p-1.5 rounded-lg border border-red-500/20 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/50" title="ลบทิ้ง">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-white mb-3 leading-relaxed">&quot;{rev.comment}&quot;</p>

                  {/* G. Sub-ratings */}
                  {(rev.ratingBattery || rev.ratingPerformance || rev.ratingComfort) && (
                    <div className="space-y-1.5 mb-3 bg-slate-900/50 p-3 rounded-lg border border-ev-border/30">
                      <SubRatingBar label="แบตเตอรี่" value={rev.ratingBattery || 0} color="#05f383" />
                      <SubRatingBar label="สมรรถนะ" value={rev.ratingPerformance || 0} color="#0ea5e9" />
                      <SubRatingBar label="ความสะดวก" value={rev.ratingComfort || 0} color="#f59e0b" />
                    </div>
                  )}

                  {/* Pros / Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-electric-green/5 border border-electric-green/10 text-[11px]">
                      <strong className="text-electric-green flex items-center gap-1 mb-1"><Plus className="h-3 w-3"/> ข้อดี</strong>
                      <span className="text-slate-300 leading-relaxed">{rev.pros}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-[11px]">
                      <strong className="text-red-400 flex items-center gap-1 mb-1"><XIcon className="h-3 w-3"/> จุดสังเกต</strong>
                      <span className="text-slate-300 leading-relaxed">{rev.cons}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: News Management ───────────────────────────── */}
      {activeTab === 'news' && (
        <div className="space-y-5 animate-slide-up">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามหัวข้อหรือบทคัดย่อ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-ev-border bg-slate-900 px-4 pl-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-electric-green transition-colors"
                />
              </div>
              <select
                value={newsFilter}
                onChange={(e) => setNewsFilter(e.target.value as any)}
                className="rounded-lg border border-ev-border bg-slate-900 px-3 py-2.5 text-xs text-white outline-none focus:border-electric-green"
              >
                <option value="all">ข่าวทั้งหมด</option>
                <option value="custom">ข่าวแอดมินเขียน</option>
                <option value="synced">ข่าวฟีดเว็บนอก</option>
                <option value="hidden">ข่าวที่ซ่อนไว้</option>
              </select>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={openAddNewsForm}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-bold text-ev-dark hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>เขียนข่าวสารใหม่</span>
              </button>
              <button
                onClick={handleSyncNews}
                disabled={isSyncingNews}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-lg border border-ev-border bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncingNews ? 'animate-spin' : ''}`} />
                <span>{isSyncingNews ? 'กำลังดึงข่าว...' : 'ซิงค์ข่าวฟีดล่าสุด'}</span>
              </button>
            </div>
          </div>

          {/* Table / List */}
          {filteredNews.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-ev-border rounded-xl text-sm">
              ไม่พบรายการข่าวสารตามฟิลเตอร์หรือการค้นหาปัจจุบัน
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-ev-border bg-ev-card/10">
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-ev-card font-bold border-b border-ev-border text-slate-400">
                  <tr>
                    <th className="p-4 w-[80px]">รูปภาพ</th>
                    <th className="p-4">รายละเอียดข่าว</th>
                    <th className="p-4 w-[120px]">แหล่งข่าว</th>
                    <th className="p-4 w-[110px] text-center">วันที่ลงข่าว</th>
                    <th className="p-4 w-[100px] text-center">สถานะซ่อน</th>
                    <th className="p-4 w-[140px] text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ev-border/40">
                  {filteredNews.map((art) => (
                    <tr
                      key={art._id}
                      className={`hover:bg-ev-card/30 transition-colors ${
                        art.hidden ? 'bg-slate-900/40 text-slate-500 border-l-2 border-l-red-500/20' : ''
                      }`}
                    >
                      <td className="p-4">
                        {art.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={art.image}
                            alt=""
                            className="h-10 w-16 rounded object-cover border border-ev-border/50"
                          />
                        ) : (
                          <div className="h-10 w-16 bg-slate-900 rounded flex items-center justify-center text-[8px] uppercase text-slate-600 font-bold border border-ev-border/30">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-4 max-w-md">
                        <div className="font-bold text-white text-sm line-clamp-1 leading-tight mb-0.5">{art.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{art.description || 'ไม่มีคำอธิบายข่าวสารย่อ...'}</div>
                        <a
                          href={art.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-[10px] text-electric-blue hover:underline font-mono"
                        >
                          <Link2 className="h-3 w-3" />
                          <span>เปิดดูบทความต้นทาง</span>
                        </a>
                      </td>
                      <td className="p-4">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                          art.source === 'Headlightmag'
                            ? 'bg-electric-green/10 text-electric-green border-electric-green/20'
                            : art.source === 'Autoinfo'
                            ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {art.source} {art.isCustom && '(เขียนเอง)'}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">{art.date}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleNewsHidden(art)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                            art.hidden
                              ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {art.hidden ? 'ซ่อนอยู่' : 'แสดงปกติ'}
                        </button>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleEditNewsClick(art)}
                            className="p-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                            title="แก้ไขข่าวสาร"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(art._id)}
                            className="p-2 rounded-lg border border-red-500/20 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/50"
                            title="ลบข่าวสาร"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Reusable Sub-Components ────────────────────────────────

function StatCard({ icon, label, value, color, highlight }: { icon: React.ReactNode; label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${highlight ? 'border-amber-500/30 bg-amber-500/5' : 'border-ev-border bg-ev-card/30'}`}>
      <div className={`${color}`}>{icon}</div>
      <div>
        <p className={`text-xl font-extrabold ${color}`}>{value}</p>
        <p className="text-[11px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder, step, compact }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; step?: string; compact?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs text-slate-400 mb-1 ${compact ? '' : 'font-bold'}`}>{label}</label>
      <input
        type={type}
        required
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white outline-none focus:border-electric-green transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, compact }: {
  label: string; value: string; onChange: (v: string) => void; options: string[][]; compact?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs text-slate-400 mb-1 ${compact ? '' : 'font-bold'}`}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-lg border border-ev-border bg-slate-900 px-3 py-2 text-white outline-none focus:border-electric-green transition-colors ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

function ToggleChip({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer select-none px-3 py-2 rounded-lg border transition-all ${
      checked ? 'bg-electric-green/10 border-electric-green/30 text-electric-green' : 'bg-slate-900 border-ev-border text-slate-500'
    }`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-electric-green rounded" />
      {label}
    </label>
  );
}

export default AdminPage;