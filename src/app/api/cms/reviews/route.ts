import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/review';
import EV from '@/models/ev';

// GET reviews
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const evId = searchParams.get('evId');

    await dbConnect();

    // Ensure models are registered (sometimes model is not registered yet when populate runs)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ev = EV;

    let query: any = {};
    if (evId) {
      query.evId = evId;
    }

    const reviews = await Review.find(query)
      .populate('evId', 'brand model trim')
      .sort({ createdAt: -1 });

    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST submit review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { evId, userName, rating, ratingBattery, ratingPerformance, ratingComfort, pros, cons, comment } = body;

    // Basic validation
    if (!evId || !userName || !rating || !ratingBattery || !ratingPerformance || !ratingComfort || !pros || !cons || !comment) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await dbConnect();

    // Check if the car exists
    const carExists = await EV.findById(evId);
    if (!carExists) {
      return NextResponse.json({ error: 'EV model not found' }, { status: 404 });
    }

    const newReview = new Review({
      evId,
      userName,
      rating: Number(rating),
      ratingBattery: Number(ratingBattery),
      ratingPerformance: Number(ratingPerformance),
      ratingComfort: Number(ratingComfort),
      pros,
      cons,
      comment,
      approved: true, // Auto-approve by default, can be toggled by admin
    });

    await newReview.save();

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
