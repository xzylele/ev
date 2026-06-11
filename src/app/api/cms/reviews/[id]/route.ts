import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/review';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT moderate review (approve/disapprove) (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode');

    const body = await request.json();
    const requestPasscode = passcode || body.passcode;

    if (requestPasscode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    const { approved } = body;

    await dbConnect();
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { approved: Boolean(approved) },
      { new: true }
    );

    if (!updatedReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE review (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    
    // Check header or search parameters
    const passcode = request.headers.get('x-admin-passcode') || new URL(request.url).searchParams.get('passcode');

    if (passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    await dbConnect();
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
