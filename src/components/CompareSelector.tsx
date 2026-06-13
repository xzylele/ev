'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowLeftRight, Trash2 } from 'lucide-react';

export interface SelectedCar {
  id: string;
  brand: string;
  model: string;
  trim: string;
  image: string;
  price: number;
}

const CompareSelector = () => {
  const [selectedCars, setSelectedCars] = useState<SelectedCar[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load from localStorage
    const loadSelection = () => {
      const stored = localStorage.getItem('ev_compare_selection');
      if (stored) {
        try {
          setSelectedCars(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadSelection();

    // Listen to custom event for updates
    window.addEventListener('ev_compare_updated', loadSelection);
    return () => {
      window.removeEventListener('ev_compare_updated', loadSelection);
    };
  }, []);

  const handleRemove = (id: string) => {
    const updated = selectedCars.filter((c) => c.id !== id);
    localStorage.setItem('ev_compare_selection', JSON.stringify(updated));
    setSelectedCars(updated);
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  const handleClear = () => {
    localStorage.removeItem('ev_compare_selection');
    setSelectedCars([]);
    window.dispatchEvent(new Event('ev_compare_updated'));
  };

  if (!mounted || selectedCars.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 z-40 w-full max-w-4xl -translate-x-1/2 px-4 transition-all duration-500 animate-slide-up pointer-events-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-ev-border bg-ev-card/95 p-4 backdrop-blur-md pointer-events-auto">
        {/* Left: Selected cars list */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-electric-green" />
            <span>เปรียบเทียบ ({selectedCars.length}/4):</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {selectedCars.map((car) => (
              <div
                key={car.id}
                className="flex items-center space-x-2 rounded-xl border border-ev-border bg-ev-card px-2.5 py-1.5 pr-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={car.image}
                  alt={car.model}
                  className="h-6 w-8 rounded object-cover"
                />
                <span className="text-xs font-semibold text-white">
                  {car.brand} {car.model}
                </span>
                <button
                  onClick={() => handleRemove(car.id)}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end border-t border-ev-border/50 sm:border-t-0 pt-3 sm:pt-0">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 transition-colors"
            title="ล้างทั้งหมด"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden md:inline">ล้างทั้งหมด</span>
          </button>
          
          <Link
            href="/compare"
            className="flex items-center space-x-2 rounded-xl bg-electric-green px-4 py-2 text-xs font-bold text-ev-dark hover:bg-electric-green/90 transition-all duration-300"
          >
            <span>เริ่มเปรียบเทียบ</span>
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CompareSelector;
