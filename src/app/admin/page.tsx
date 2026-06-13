'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, LogIn, Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Eye, MessageSquare, AlertCircle, Link2, X as XIcon, ImageOff, ChevronDown, ChevronRight, Car, Search, Filter } from 'lucide-react';

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  price: number;
  image: string;
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
  comment: string;
  pros: string;
  cons: string;
  approved: boolean;
  createdAt: string;
}

const AdminPage = () => {
  const [passcode, setPasscode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Data
  const [cars, setCars] = useState<CarSpec[]>([]);
  const [reviews, setReviews] = useState<ReviewSpec[]>([]);
  const [activeTab, setActiveTab] = useState<'cars' | 'reviews'>('cars');
  const [isLoading, setIsLoading] = useState(false);

  // New Features State
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Form State for Car
  const [isCarFormOpen, setIsCarFormOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  
  // Form fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [bodyType, setBodyType] = useState<'Sedan' | 'SUV' | 'Hatchback' | 'MPV' | 'Others'>('SUV');
  const [warrantyYears, setWarrantyYears] = useState(8);
  const [warrantyKm, setWarrantyKm] = useState(160000);
  
  const [length, setLength] = useState(4500);
  const [width, setWidth] = useState(1850);
  const [height, setHeight] = useState(1600);
  const [wheelbase, setWheelbase] = useState(2700);
  const [cargoVolume, setCargoVolume] = useState(400);
  const [frunkVolume, setFrunkVolume] = useState(0);
  
  const [horsepower, setHorsepower] = useState(200);
  const [torque, setTorque] = useState(300);
  const [acceleration0To100, setAcceleration0To100] = useState(7.5);
  const [topSpeed, setTopSpeed] = useState(160);
  const [driveType, setDriveType] = useState<'RWD' | 'FWD' | 'AWD'>('FWD');
  
  const [batteryCapacity, setBatteryCapacity] = useState(60);
  const [batteryType, setBatteryType] = useState<'LFP' | 'NMC' | 'Others'>('LFP');
  const [rangeWLTP, setRangeWLTP] = useState(400);
  const [rangeNEDC, setRangeNEDC] = useState(480);
  const [rangeCLTC, setRangeCLTC] = useState(0);
  
  const [acChargePower, setAcChargePower] = useState(7);
  const [dcChargePower, setDcChargePower] = useState(88);
  const [voltageArchitecture, setVoltageArchitecture] = useState<'400V' | '800V'>('400V');
  const [v2lSupport, setV2lSupport] = useState(true);
  const [v2lPower, setV2lPower] = useState(3.3);

  // Image preview state
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Brand accordion collapse state
  const [collapsedBrands, setCollapsedBrands] = useState<Set<string>>(new Set());
  const toggleBrand = (brand: string) => {
    setCollapsedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  };

  // Custom confirm delete state (replaces window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status Alerts
  const [alertMsg, setAlertMsg] = useState({ text: '', type: 'success' });

  // Load passcode from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_passcode');
    if (stored) {
      setPasscode(stored);
      verifyAndLoad(stored);
    }
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
    } catch (err) {
      setAuthError('ระบบขัดข้องกรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setAuthError('กรุณากรอกรหัสผ่าน');
      return;
    }
    verifyAndLoad(passcode);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_passcode');
    setPasscode('');
    setIsAuthorized(false);
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const carsRes = await fetch('/api/cms/cars');
      const carsData = await carsRes.json();
      if (carsRes.ok) setCars(carsData);

      const revRes = await fetch('/api/cms/reviews');
      const revData = await revRes.json();
      if (revRes.ok) setReviews(revData);
    } catch (e) {
      showAlert('โหลดข้อมูลขัดข้อง', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (text: string, type: 'success' | 'error') => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg({ text: '', type: 'success' }), 4000);
  };

  const getPasscode = () => passcode || sessionStorage.getItem('admin_passcode') || '';

  const handleDeleteCar = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    const pc = getPasscode();
    if (!pc) {
      showAlert('ไม่พบรหัสผ่าน กรุณา logout แล้ว login ใหม่', 'error');
      return;
    }
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

  const handleToggleReviewApprove = async (id: string, currentApproved: boolean) => {
    try {
      const res = await fetch(`/api/cms/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode
        },
        body: JSON.stringify({ approved: !currentApproved })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('อัปเดตสถานะการอนุมัติรีวิวสำเร็จ', 'success');
        setReviews(prev => prev.map(r => r._id === id ? { ...r, approved: !currentApproved } : r));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'บันทึกสถานะล้มเหลว', 'error');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้ทิ้งอย่างถาวร?')) return;

    try {
      const res = await fetch(`/api/cms/reviews/${id}?passcode=${passcode}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('ลบความคิดเห็นสำเร็จ', 'success');
        setReviews(prev => prev.filter(r => r._id !== id));
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'ลบความคิดเห็นล้มเหลว', 'error');
    }
  };

  const handleSubmitCarForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const pc = getPasscode();

    const carData = {
      brand, model, trim, price, image, bodyType, warrantyYears, warrantyKm,
      length, width, height, wheelbase, cargoVolume, frunkVolume,
      horsepower, torque, acceleration0To100, topSpeed, driveType,
      batteryCapacity, batteryType, rangeWLTP, rangeNEDC, rangeCLTC,
      acChargePower, dcChargePower, voltageArchitecture, v2lSupport, v2lPower: v2lSupport ? v2lPower : 0,
    };

    try {
      const url = editingCarId ? `/api/cms/cars/${editingCarId}` : '/api/cms/cars';
      const method = editingCarId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': pc
        },
        body: JSON.stringify(carData)
      });

      const data = await res.json();

      if (res.ok) {
        showAlert(editingCarId ? 'แก้ไขข้อมูลรถสำเร็จ' : 'เพิ่มรถรุ่นใหม่สำเร็จ', 'success');
        setIsCarFormOpen(false);
        setEditingCarId(null);
        loadDashboardData();
        resetCarForm();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'บันทึกข้อมูลล้มเหลว', 'error');
    }
  };

  const handleEditCarClick = (car: CarSpec) => {
    setEditingCarId(car._id);
    setBrand(car.brand);
    setModel(car.model);
    setTrim(car.trim);
    setPrice(car.price);
    setImage(car.image);
    setImagePreviewError(false);
    setBodyType(car.bodyType);
    setWarrantyYears(car.warrantyYears);
    setWarrantyKm(car.warrantyKm);
    setLength(car.length);
    setWidth(car.width);
    setHeight(car.height);
    setWheelbase(car.wheelbase);
    setCargoVolume(car.cargoVolume);
    setFrunkVolume(car.frunkVolume);
    setHorsepower(car.horsepower);
    setTorque(car.torque);
    setAcceleration0To100(car.acceleration0To100);
    setTopSpeed(car.topSpeed);
    setDriveType(car.driveType);
    setBatteryCapacity(car.batteryCapacity);
    setBatteryType(car.batteryType);
    setRangeWLTP(car.rangeWLTP);
    setRangeNEDC(car.rangeNEDC);
    setRangeCLTC(car.rangeCLTC);
    setAcChargePower(car.acChargePower);
    setDcChargePower(car.dcChargePower);
    setVoltageArchitecture(car.voltageArchitecture);
    setV2lSupport(car.v2lSupport);
    setV2lPower(car.v2lPower);
    setIsCarFormOpen(true);
  };

  const resetCarForm = () => {
    setEditingCarId(null);
    setBrand('');
    setModel('');
    setTrim('');
    setPrice(0);
    setImage('');
    setImagePreviewError(false);
    setBodyType('SUV');
    setWarrantyYears(8);
    setWarrantyKm(160000);
    setLength(4500);
    setWidth(1850);
    setHeight(1600);
    setWheelbase(2700);
    setCargoVolume(400);
    setFrunkVolume(0);
    setHorsepower(200);
    setTorque(300);
    setAcceleration0To100(7.5);
    setTopSpeed(160);
    setDriveType('FWD');
    setBatteryCapacity(60);
    setBatteryType('LFP');
    setRangeWLTP(400);
    setRangeNEDC(480);
    setRangeCLTC(0);
    setAcChargePower(7);
    setDcChargePower(88);
    setVoltageArchitecture('400V');
    setV2lSupport(true);
    setV2lPower(3.3);
  };

  const handleTriggerSeedReset = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับไปเป็นค่าเริ่มต้นโรงงานหรือไม่?')) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/cms/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showAlert('รีเซ็ตล้างฐานข้อมูลสำเร็จเรียบร้อย', 'success');
        loadDashboardData();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showAlert(e.message || 'รีเซ็ตขัดข้อง', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Data Logic
  const filteredCars = cars.filter(car => 
    car.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    car.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(rev => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'approved') return rev.approved;
    if (reviewFilter === 'pending') return !rev.approved;
    return true;
  });

  if (!isAuthorized) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 min-h-screen flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full rounded-2xl border border-ev-border bg-ev-card/50 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-green to-electric-blue text-ev-dark mb-4">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-extrabold text-white text-center">เข้าสู่ระบบแอดมินหลังบ้าน</h1>
            <p className="text-xs text-slate-500 mt-1 text-center">ป้อนรหัสผ่านผู้ดูแลระบบเพื่อเข้าจัดการฐานข้อมูล</p>
          </div>

          {authError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4" />
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
                className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-electric-blue transition-colors text-center font-bold tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue py-3 px-4 text-sm font-bold text-ev-dark hover:opacity-90 transition-opacity"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'กำลังตรวจสอบ...' : 'ลงชื่อเข้าใช้'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-32">
      {/* Status Alerts */}
      {alertMsg.text && (
        <div className={`fixed top-20 right-6 z-50 rounded-xl border p-4 shadow-xl text-xs font-bold transition-all ${
          alertMsg.type === 'success' ? 'bg-electric-green/10 border-electric-green text-electric-green' : 'bg-red-500/10 border-red-500 text-red-400'
        }`}>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-ev-card p-6 shadow-2xl mx-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">ยืนยันการลบ</h3>
                <p className="text-xs text-slate-400">คุณแน่ใจหรือไม่ว่าต้องการลบรถยนต์ไฟฟ้ารุ่นนี้ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-xl border border-ev-border bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-300 hover:text-white">ยกเลิก</button>
                <button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600">ยืนยันลบ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-ev-border pb-6 mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <LayoutDashboard className="h-7 w-7 text-electric-green" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">จัดการฐานข้อมูลรถยนต์ไฟฟ้าและระบบรีวิว</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleTriggerSeedReset} className="flex items-center space-x-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>ล้างฐานข้อมูลเริ่มต้น</span>
          </button>
          <button onClick={handleLogout} className="rounded-xl border border-ev-border bg-ev-dark px-3 py-2 text-xs font-bold text-slate-400 hover:text-white">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar border-b border-ev-border mb-8">
        <button
          onClick={() => { setActiveTab('cars'); setIsCarFormOpen(false); }}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 shrink-0 ${activeTab === 'cars' ? 'border-electric-green text-electric-green' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <Eye className="h-4 w-4" />
          <span>ฐานข้อมูลรถ EV ({cars.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('reviews'); setIsCarFormOpen(false); }}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 shrink-0 ${activeTab === 'reviews' ? 'border-electric-blue text-electric-blue' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>คัดกรองรีวิว ({reviews.length})</span>
        </button>
      </div>

      {/* Tab: Cars Management */}
      {activeTab === 'cars' && !isCarFormOpen && (
        <div className="space-y-6 animate-slide-up">
          {/* Action Bar (Search & Add Button) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาแบรนด์ หรือ รุ่นรถ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-ev-border rounded-xl text-sm text-white outline-none focus:border-electric-green transition-colors"
              />
            </div>
            <button
              onClick={() => { resetCarForm(); setIsCarFormOpen(true); }}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue px-4 py-2.5 text-xs font-bold text-ev-dark hover:scale-105 transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มรุ่นรถใหม่</span>
            </button>
          </div>

          {filteredCars.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-ev-border rounded-2xl text-sm">
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
              <div className="space-y-4">
                {brandEntries.map(([brand, brandCars]) => {
                  const isCollapsed = collapsedBrands.has(brand);
                  const brandImage = brandCars[0]?.image;
                  return (
                    <div key={brand} className="rounded-2xl border border-ev-border bg-slate-900/40 overflow-hidden shadow-sm">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleBrand(brand)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={brandImage} alt={brand} className="h-10 w-16 rounded-lg object-cover border border-ev-border/50 bg-slate-900 flex-shrink-0" />
                          <div>
                            <p className="text-base font-extrabold text-white">{brand}</p>
                            <p className="text-[11px] text-slate-400">{brandCars.length} รุ่นย่อย</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); resetCarForm(); setBrand(brand); setIsCarFormOpen(true); }}
                            className="flex items-center gap-1 rounded-lg border border-electric-green/30 bg-electric-green/10 px-3 py-1.5 text-[11px] font-bold text-electric-green hover:bg-electric-green/20"
                          >
                            <Plus className="h-3 w-3" /> เพิ่มรุ่น
                          </button>
                          {isCollapsed ? <ChevronRight className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="overflow-x-auto border-t border-ev-border/40">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-950/40 text-slate-400 font-semibold">
                                <th className="px-5 py-3">โมเดล / รุ่นย่อย</th>
                                <th className="px-5 py-3">ราคา (บาท)</th>
                                <th className="px-5 py-3">แบตเตอรี่</th>
                                <th className="px-5 py-3">ระยะทาง</th>
                                <th className="px-5 py-3 text-center">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-ev-border/20">
                              {brandCars.map(car => {
                                const range = Math.max(car.rangeWLTP, car.rangeNEDC, car.rangeCLTC);
                                return (
                                  <tr key={car._id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-3">
                                        <div className="h-8 w-1.5 rounded-full bg-electric-green/50"></div>
                                        <div>
                                          <p className="font-bold text-white text-[13px]">{car.model}</p>
                                          <p className="text-[10px] text-slate-400">{car.trim}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 font-bold text-white">{new Intl.NumberFormat('th-TH').format(car.price)}</td>
                                    <td className="px-5 py-3 text-slate-300">{car.batteryCapacity} kWh <span className="text-[10px] text-slate-500">({car.batteryType})</span></td>
                                    <td className="px-5 py-3 text-electric-green font-bold">{range} กม.</td>
                                    <td className="px-5 py-3">
                                      <div className="flex justify-center gap-2">
                                        <button onClick={() => handleEditCarClick(car)} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800" title="แก้ไข">
                                          <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleDeleteCar(car._id)} className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10" title="ลบ">
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

      {/* Car Form: Add/Edit */}
      {isCarFormOpen && (
        <form onSubmit={handleSubmitCarForm} className="rounded-2xl border border-slate-700 bg-ev-card shadow-2xl animate-slide-up flex flex-col overflow-hidden text-sm">
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ev-border p-6 bg-slate-900/50 gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{editingCarId ? '✏️ แก้ไขสเปครถยนต์' : '✨ เพิ่มรถยนต์รุ่นใหม่'}</h3>
              <p className="text-xs text-slate-400 mt-1">กรอกข้อมูลพื้นฐาน มิติ สมรรถนะ และแบตเตอรี่ให้ครบถ้วน</p>
            </div>
            <button type="button" onClick={() => setIsCarFormOpen(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors w-full sm:w-auto text-center">
              ย้อนกลับ
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 md:p-8 space-y-10 bg-slate-950/20">
            
            {/* 1. ข้อมูลทั่วไป */}
            <section>
              <h4 className="text-base font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-electric-blue pl-3">
                1. ข้อมูลพื้นฐาน (General Info)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">แบรนด์ / ยี่ห้อ *</label>
                  <input type="text" required placeholder="เช่น Tesla, BYD" value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none focus:border-electric-blue transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">รุ่น (Model) *</label>
                  <input type="text" required placeholder="เช่น Model Y, Dolphin" value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none focus:border-electric-blue transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">รุ่นย่อย (Trim) *</label>
                  <input type="text" required placeholder="เช่น Long Range" value={trim} onChange={e => setTrim(e.target.value)} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none focus:border-electric-blue transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">ราคา (บาท) *</label>
                  <input type="number" required placeholder="เช่น 1599000" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none focus:border-electric-blue transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" /> ลิงก์ภาพประกอบรถยนต์ *
                  </label>
                  <div className="relative">
                    <input type="text" required placeholder="URL รูปภาพ" value={image} onChange={e => { setImage(e.target.value); setImagePreviewError(false); }} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 pr-10 text-white outline-none focus:border-electric-blue transition-all" />
                  </div>
                  {image && !imagePreviewError && (
                    <div className="mt-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="Preview" className="h-24 rounded-lg border border-ev-border object-cover" onError={() => setImagePreviewError(true)} />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">ประเภทตัวถัง *</label>
                  <select value={bodyType} onChange={e => setBodyType(e.target.value as any)} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none">
                    <option value="Sedan">Sedan (เก๋ง 4 ประตู)</option>
                    <option value="SUV">SUV (อเนกประสงค์)</option>
                    <option value="Hatchback">Hatchback (5 ประตูท้ายตัด)</option>
                    <option value="MPV">MPV (ครอบครัว)</option>
                    <option value="Others">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">ประกันแบตเตอรี่ (ปี) *</label>
                  <input type="number" required value={warrantyYears} onChange={e => setWarrantyYears(Number(e.target.value))} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">ระยะรับประกัน (กม.) *</label>
                  <input type="number" required value={warrantyKm} onChange={e => setWarrantyKm(Number(e.target.value))} className="w-full rounded-xl border border-ev-border bg-slate-900 px-4 py-2 text-white outline-none" />
                </div>
              </div>
            </section>

            {/* 2. มิติตัวถัง */}
            <section>
              <h4 className="text-base font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-slate-500 pl-3">
                2. มิติตัวถัง (Dimensions)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-900/50 p-5 rounded-2xl border border-ev-border/50">
                <div><label className="block text-xs text-slate-400 mb-1">ความยาว (มม.)</label><input type="number" required value={length} onChange={e => setLength(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">ความกว้าง (มม.)</label><input type="number" required value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">ความสูง (มม.)</label><input type="number" required value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">ฐานล้อ (มม.)</label><input type="number" required value={wheelbase} onChange={e => setWheelbase(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">ท้ายรถ (ลิตร)</label><input type="number" required value={cargoVolume} onChange={e => setCargoVolume(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Frunk หน้า (ลิตร)</label><input type="number" required value={frunkVolume} onChange={e => setFrunkVolume(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
              </div>
            </section>

            {/* 3. สมรรถนะ */}
            <section>
              <h4 className="text-base font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-red-500 pl-3">
                3. สมรรถนะ (Performance)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-900/50 p-5 rounded-2xl border border-ev-border/50">
                <div><label className="block text-xs text-slate-400 mb-1">แรงม้า (HP)</label><input type="number" required value={horsepower} onChange={e => setHorsepower(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">แรงบิด (Nm)</label><input type="number" required value={torque} onChange={e => setTorque(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">0-100 (วินาที)</label><input type="number" step="0.1" required value={acceleration0To100} onChange={e => setAcceleration0To100(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Max Speed</label><input type="number" required value={topSpeed} onChange={e => setTopSpeed(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ขับเคลื่อน</label>
                  <select value={driveType} onChange={e => setDriveType(e.target.value as any)} className="w-full rounded-lg border border-ev-border bg-slate-800 px-2 py-2 text-white outline-none">
                    <option value="FWD">ล้อหน้า (FWD)</option><option value="RWD">ล้อหลัง (RWD)</option><option value="AWD">4 ล้อ (AWD)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 4. แบตเตอรี่และการชาร์จ */}
            <section>
              <h4 className="text-base font-extrabold text-white mb-4 flex items-center gap-2 border-l-4 border-electric-green pl-3">
                4. แบตเตอรี่ & การชาร์จ (Battery & Charging)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-900/50 p-5 rounded-2xl border border-ev-border/50">
                <div><label className="block text-xs text-slate-400 mb-1">ความจุ (kWh)</label><input type="number" required value={batteryCapacity} onChange={e => setBatteryCapacity(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">เซลล์แบต</label>
                  <select value={batteryType} onChange={e => setBatteryType(e.target.value as any)} className="w-full rounded-lg border border-ev-border bg-slate-800 px-2 py-2 text-white outline-none"><option value="LFP">LFP</option><option value="NMC">NMC</option><option value="Others">Others</option></select>
                </div>
                <div><label className="block text-xs text-slate-400 mb-1">WLTP (กม.)</label><input type="number" required value={rangeWLTP} onChange={e => setRangeWLTP(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">NEDC (กม.)</label><input type="number" required value={rangeNEDC} onChange={e => setRangeNEDC(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">CLTC (กม.)</label><input type="number" required value={rangeCLTC} onChange={e => setRangeCLTC(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">สถาปัตยกรรมไฟ</label>
                  <select value={voltageArchitecture} onChange={e => setVoltageArchitecture(e.target.value as any)} className="w-full rounded-lg border border-ev-border bg-slate-800 px-2 py-2 text-white outline-none"><option value="400V">400V</option><option value="800V">800V</option></select>
                </div>
                <div><label className="block text-xs text-slate-400 mb-1">AC Max (kW)</label><input type="number" required value={acChargePower} onChange={e => setAcChargePower(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">DC Max (kW)</label><input type="number" required value={dcChargePower} onChange={e => setDcChargePower(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white" /></div>
                <div className="flex items-center pt-5 col-span-2 md:col-span-1">
                  <label className="flex items-center text-xs font-bold text-electric-green cursor-pointer select-none bg-electric-green/10 px-3 py-2 rounded-lg border border-electric-green/20 w-full justify-center">
                    <input type="checkbox" checked={v2lSupport} onChange={e => setV2lSupport(e.target.checked)} className="mr-2 h-4 w-4 accent-electric-green rounded" />
                    รองรับจ่ายไฟ (V2L)
                  </label>
                </div>
                {v2lSupport && (
                  <div><label className="block text-xs text-slate-400 mb-1">V2L Max (kW)</label><input type="number" step="0.1" value={v2lPower} onChange={e => setV2lPower(Number(e.target.value))} className="w-full rounded-lg border border-ev-border bg-slate-800 px-3 py-2 text-white border-electric-green/50" /></div>
                )}
              </div>
            </section>
          </div>

          {/* Form Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-ev-border bg-slate-900/80 w-full">
            <button type="button" onClick={() => setIsCarFormOpen(false)} className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full sm:w-auto">
              ยกเลิก
            </button>
            <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue px-8 py-2.5 text-sm font-extrabold text-ev-dark hover:shadow-[0_0_15px_rgba(0,255,170,0.4)] transition-all w-full sm:w-auto">
              <CheckCircle className="h-4 w-4" />
              {editingCarId ? 'บันทึกการแก้ไข' : 'เพิ่มรถเข้าระบบ'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Reviews Moderation */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-slide-up">
          {/* Review Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-ev-border">
            <h3 className="text-md font-bold text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-electric-blue" /> ตัวกรองรีวิว
            </h3>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-ev-border w-full sm:w-auto">
              {(['all', 'pending', 'approved'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setReviewFilter(filter)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    reviewFilter === filter 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {filter === 'all' ? `ทั้งหมด (${reviews.length})` : 
                   filter === 'pending' ? `รอตรวจสอบ (${reviews.filter(r => !r.approved).length})` : 
                   `อนุมัติแล้ว (${reviews.filter(r => r.approved).length})`}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-20 text-slate-500 border border-dashed border-ev-border rounded-2xl text-sm">
              ไม่มีข้อมูลรีวิวในหมวดหมู่นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredReviews.map((rev) => (
                <div key={rev._id} className={`rounded-2xl border p-5 relative transition-all ${rev.approved ? 'border-ev-border bg-ev-card/30' : 'border-amber-500/30 bg-amber-500/5'}`}>
                  
                  {/* Approval Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleToggleReviewApprove(rev._id, rev.approved)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-[11px] font-bold ${
                        rev.approved 
                          ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' 
                          : 'border-electric-green/50 bg-electric-green/20 text-electric-green hover:bg-electric-green/30'
                      }`}
                    >
                      {rev.approved ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      <span>{rev.approved ? 'ซ่อนรีวิว' : 'อนุมัติรีวิว'}</span>
                    </button>
                    <button onClick={() => handleDeleteReview(rev._id)} className="p-1.5 rounded-lg border border-red-500/20 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-500/50" title="ลบทิ้ง">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="pr-40">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{rev.userName}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full">{new Date(rev.createdAt).toLocaleDateString('th-TH')}</span>
                      {!rev.approved && <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-full animate-pulse">รอการตรวจสอบ</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      รถยนต์: <span className="text-electric-blue">{rev.evId ? `${rev.evId.brand} ${rev.evId.model} (${rev.evId.trim})` : 'ไม่พบข้อมูล'}</span>
                      <span className="mx-2">|</span> 
                      ให้คะแนน: <span className="text-amber-400 font-bold">{rev.rating} ★</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-ev-border/30 text-sm">
                    <p className="font-medium text-white mb-3">"{rev.comment}"</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-electric-green/5 border border-electric-green/10 text-[12px]">
                        <strong className="text-electric-green flex items-center gap-1 mb-1"><Plus className="h-3 w-3"/> ข้อดี</strong>
                        <span className="text-slate-300 leading-relaxed">{rev.pros}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-[12px]">
                        <strong className="text-red-400 flex items-center gap-1 mb-1"><XIcon className="h-3 w-3"/> จุดสังเกต</strong>
                        <span className="text-slate-300 leading-relaxed">{rev.cons}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;