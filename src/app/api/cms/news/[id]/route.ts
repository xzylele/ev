import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News from '@/models/news';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT update news (edit or toggle hidden)
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passcode: _, ...updateData } = body;

    await dbConnect();
    const updatedNews = await News.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedNews) {
      return NextResponse.json({ error: 'ไม่พบรายการข่าวสาร' }, { status: 404 });
    }

    return NextResponse.json({ success: true, news: updatedNews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE news
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode') || new URL(request.url).searchParams.get('passcode');

    if (passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    await dbConnect();
    const deletedNews = await News.findByIdAndDelete(id);

    if (!deletedNews) {
      return NextResponse.json({ error: 'ไม่พบรายการข่าวสาร' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'ลบรายการข่าวสารเรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
