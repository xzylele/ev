import { NextResponse } from 'next/server';

// POST: verify admin passcode
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const { passcode } = body;

    if (!passcode || passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
