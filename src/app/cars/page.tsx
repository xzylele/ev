import React from 'react';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';
import Review from '@/models/review';
import CarsCatalogClient from '@/components/CarsCatalogClient';

// Disable dynamic caching to fetch fresh data if edited by admin
export const revalidate = 0;

export default async function CarsPage() {
  let cars = [];
  try {
    await dbConnect();
    // Fetch cars sorted by brand then price
    const dbCars = await EV.find({}).sort({ brand: 1, price: 1 }).lean();

    // Batch fetch all approved reviews for retrieved cars in a single query
    const carIds = dbCars.map((car: any) => car._id);
    const allReviews = await Review.find({ evId: { $in: carIds }, approved: true }).lean();

    // Group reviews by evId in-memory
    const reviewsMap: { [key: string]: any[] } = {};
    allReviews.forEach((review: any) => {
      const evIdStr = review.evId.toString();
      if (!reviewsMap[evIdStr]) {
        reviewsMap[evIdStr] = [];
      }
      reviewsMap[evIdStr].push(review);
    });

    // Compute average ratings and mapping results
    cars = dbCars.map((car: any) => {
      const carIdStr = car._id.toString();
      const carReviews = reviewsMap[carIdStr] || [];
      if (carReviews.length > 0) {
        const avgRating = carReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / carReviews.length;
        return {
          ...car,
          _id: carIdStr,
          avgRating: parseFloat(avgRating.toFixed(1)),
          reviewCount: carReviews.length
        };
      }
      return {
        ...car,
        _id: carIdStr,
        avgRating: null,
        reviewCount: 0
      };
    });
  } catch (error) {
    console.error('Failed to load cars from MongoDB:', error);
  }

  // Serialize to JSON string to securely pass MongoDB documents to Client Component
  const serializedCars = JSON.stringify(cars);

  return (
    <div className="bg-ev-dark min-h-screen">
      <CarsCatalogClient initialCars={serializedCars} />
    </div>
  );
}
