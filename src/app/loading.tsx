import React from 'react';

export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-ev-dark text-slate-100 flex flex-col justify-start">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24 lg:px-8 w-full animate-pulse">
        {/* Hero Section Skeleton */}
        <div className="mx-auto max-w-3xl flex flex-col items-center text-center">
          {/* Badge skeleton */}
          <div className="h-6 w-56 bg-ev-card border border-ev-border rounded-full mb-6" />
          
          {/* H1 header skeleton */}
          <div className="h-10 sm:h-14 w-full max-w-lg bg-ev-card border border-ev-border rounded-lg mb-4" />
          <div className="h-10 sm:h-14 w-2/3 bg-ev-card border border-ev-border rounded-lg mb-6" />
          
          {/* Description paragraphs skeleton */}
          <div className="h-4 w-5/6 bg-ev-card border border-ev-border rounded-md mb-2" />
          <div className="h-4 w-4/5 bg-ev-card border border-ev-border rounded-md mb-10" />
          
          {/* Button CTA skeleton */}
          <div className="flex items-center justify-center gap-x-6">
            <div className="h-12 w-36 bg-ev-card border border-ev-border rounded-xl" />
            <div className="h-6 w-28 bg-ev-card border border-ev-border rounded-md" />
          </div>
        </div>

        {/* Feature Cards Grid Skeleton */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32 lg:mt-40">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-xl border border-ev-border bg-ev-card/40 p-6 h-48"
              >
                {/* Icon block */}
                <div className="h-12 w-12 bg-ev-card border border-ev-border rounded-xl mb-5" />
                {/* Title */}
                <div className="h-5 w-2/3 bg-ev-card border border-ev-border rounded-md mb-3" />
                {/* Text lines */}
                <div className="h-3 w-full bg-ev-card border border-ev-border rounded-sm mb-1.5" />
                <div className="h-3 w-4/5 bg-ev-card border border-ev-border rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Featured Cars Section Skeleton */}
        <div className="mt-24 sm:mt-32 max-w-7xl mx-auto">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="h-7 w-48 bg-ev-card border border-ev-border rounded-md mb-2" />
              <div className="h-4 w-64 bg-ev-card border border-ev-border rounded-sm" />
            </div>
            <div className="h-5 w-28 bg-ev-card border border-ev-border rounded-sm" />
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col overflow-hidden rounded-xl border border-ev-border bg-ev-card/40 h-[400px]"
              >
                {/* Image Placeholder */}
                <div className="h-48 w-full bg-ev-card/60 border-b border-ev-border" />
                {/* Info block */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-4 w-16 bg-ev-card border border-ev-border rounded-sm" />
                      <div className="h-4 w-8 bg-ev-card border border-ev-border rounded-sm" />
                    </div>
                    <div className="h-6 w-3/4 bg-ev-card border border-ev-border rounded-md" />
                  </div>
                  {/* Spec Row */}
                  <div className="grid grid-cols-3 gap-2 border-y border-ev-border/50 py-4 my-4">
                    <div className="h-10 bg-ev-card border border-ev-border rounded-md" />
                    <div className="h-10 bg-ev-card border border-ev-border rounded-md" />
                    <div className="h-10 bg-ev-card border border-ev-border rounded-md" />
                  </div>
                  {/* Buttons */}
                  <div className="flex items-center gap-4">
                    <div className="h-10 bg-ev-card border border-ev-border rounded-xl flex-grow" />
                    <div className="h-10 w-10 bg-ev-card border border-ev-border rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
