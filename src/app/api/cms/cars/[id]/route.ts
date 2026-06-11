import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single car spec
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await dbConnect();
    const car = await EV.findById(id);
    
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    
    return NextResponse.json(car);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update car (Admin only)
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

    // Exclude passcode from vehicle data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passcode: _, ...updateData } = body;

    await dbConnect();
    const updatedCar = await EV.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, car: updatedCar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE car (Admin only)
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
    const deletedCar = await EV.findByIdAndDelete(id);

    if (!deletedCar) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Car deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
