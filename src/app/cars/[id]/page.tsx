import React from 'react';
import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';
import Review from '@/models/review';
import CarDetailFullClient from '@/components/CarDetailFullClient';
import CompareSelector from '@/components/CompareSelector';

export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function CarDetailPage({ params }: RouteParams) {
  const { id } = await params;
  let car: any = null;
  let siblingTrims: any[] = [];
  let reviews: any[] = [];

  try {
    await dbConnect();
    
    // Fetch car spec
    car = await EV.findById(id);
    if (!car) {
      return notFound();
    }

    // Fetch sibling trims
    siblingTrims = await EV.find({ brand: car.brand, model: car.model }).sort({ price: 1 });

    // Fetch reviews of ALL trims under this model
    const trimIds = siblingTrims.map(t => t._id);
    reviews = await Review.find({ evId: { $in: trimIds }, approved: true }).sort({ createdAt: -1 });

  } catch (error) {
    console.error('Error fetching EV detail:', error);
    return notFound();
  }

  return (
    <div className="bg-ev-dark min-h-screen pb-24">
      <CarDetailFullClient 
        initialCarId={id}
        siblingTrims={JSON.stringify(siblingTrims)}
        initialReviews={JSON.stringify(reviews)}
      />
      {/* Floating comparison selector */}
      <CompareSelector />
    </div>
  );
}
