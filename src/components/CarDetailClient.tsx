'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, Calculator, Check, Plus } from 'lucide-react';
import { SelectedCar } from './CompareSelector';

interface CarSpec {
  _id: string;
  brand: string;
  model: string;
  trim: string;
  image: string;
  price: number;
  batteryCapacity: number;
  dcChargePower: number;
}

interface CarDetailClientProps {
  car: CarSpec;
}

const CarDetailClient: React.FC<CarDetailClientProps> = ({ car }) => {
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const checkSelection = () => {
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored) {
        try {
          const parsed: SelectedCar[] = JSON.parse(stored);
          setIsSelected(parsed.some(c => c.id === car._id));
        } catch (e) {
          console.error(e);
        }
      }
    };

    checkSelection();
    window.addEventListener('ev_compare_updated', checkSelection);
    return () => {
      window.removeEventListener('ev_compare_updated', checkSelection);
    };
  }, [car._id]);

  const handleToggle = () => {
    let currentSelection: SelectedCar[] = [];
    const stored = localStorage.getItem('ev_compare_selection');
    if (stored) {
      try {
        currentSelection = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }

    if (isSelected) {
      const updated = currentSelection.filter(c => c.id !== car._id);
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    } else {
      if (currentSelection.length >= 4) {
        alert('เปรียบเทียบรถได้สูงสุดครั้งละ 4 คันครับ');
        return;
      }
      const newSelect: SelectedCar = {
        id: car._id,
        brand: car.brand,
        model: car.model,
        trim: car.trim,
        image: car.image,
        price: car.price
      };
      const updated = [...currentSelection, newSelect];
      localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    }

    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <button
        onClick={handleToggle}
        className={`flex items-center justify-center space-x-2 rounded-xl py-3.5 px-6 text-sm font-bold transition-all duration-300 ${
          isSelected
            ? 'bg-electric-green/10 text-electric-green border border-electric-green/30 glow-green'
            : 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-[1.01]'
        }`}
      >
        {isSelected ? (
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
        href={`/calculators?id=${car._id}`}
        className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-electric-green to-electric-blue py-3.5 px-6 text-sm font-bold text-ev-dark transition-all duration-300 hover:opacity-95 hover:scale-[1.01] shadow-lg glow-green"
      >
        <Calculator className="h-4 w-4 fill-current" />
        <span>คำนวณการชาร์จ & ความประหยัด</span>
      </Link>
      
      <Link
        href="/compare"
        className="flex items-center justify-center space-x-2 rounded-xl border border-ev-border bg-ev-dark px-6 py-3.5 text-sm font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span>หน้าเปรียบเทียบหลัก</span>
      </Link>
    </div>
  );
};

export default CarDetailClient;
