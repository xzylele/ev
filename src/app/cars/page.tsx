import React from 'react';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';
import CarsCatalogClient from '@/components/CarsCatalogClient';

// Disable dynamic caching to fetch fresh data if edited by admin
export const revalidate = 0;

export default async function CarsPage() {
  let cars = [];
  try {
    await dbConnect();
    // Fetch cars sorted by brand then price
    cars = await EV.find({}).sort({ brand: 1, price: 1 });
  } catch (error) {
    console.error('Failed to load cars from MongoDB:', error);
  }

  // Serialize to JSON string to securely pass MongoDB documents (with ObjectID, timestamps) to Client Component
  const serializedCars = JSON.stringify(cars);

  return (
    <div className="bg-ev-dark min-h-screen">
      <CarsCatalogClient initialCars={serializedCars} />
    </div>
  );
}
