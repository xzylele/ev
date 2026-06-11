import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EV from '@/models/ev';

// GET all cars
export async function GET() {
  try {
    await dbConnect();
    const cars = await EV.find({}).sort({ brand: 1, price: 1 });
    return NextResponse.json(cars);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST new car (Admin only)
export async function POST(request: Request) {
  try {
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode');

    const body = await request.json();
    const requestPasscode = passcode || body.passcode;

    if (requestPasscode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    // Exclude passcode from vehicle data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passcode: _, ...carData } = body;

    await dbConnect();
    const newCar = new EV(carData);
    await newCar.save();

    return NextResponse.json({ success: true, car: newCar }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
