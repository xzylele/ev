import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News from '@/models/news';

// GET all news for admin dashboard
export async function GET(request: Request) {
  try {
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode') || new URL(request.url).searchParams.get('passcode');

    if (passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    await dbConnect();
    const news = await News.find({}).sort({ timestamp: -1 });
    return NextResponse.json(news);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create custom news (Admin manually writes news)
export async function POST(request: Request) {
  try {
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode');

    const body = await request.json();
    const requestPasscode = passcode || body.passcode;

    if (requestPasscode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    // Exclude passcode from news data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passcode: _, ...newsData } = body;

    await dbConnect();

    // If link is not provided, generate a unique one
    let finalLink = newsData.link;
    if (!finalLink || finalLink.trim() === '') {
      finalLink = `https://evcompare.co.th/news/custom-${Date.now()}`;
    }

    // Check link duplication
    const existing = await News.findOne({ link: finalLink });
    if (existing) {
      return NextResponse.json({ error: 'ลิงก์หรือหัวข้อข่าวนี้มีอยู่ในระบบแล้ว' }, { status: 400 });
    }

    const newNews = new News({
      ...newsData,
      link: finalLink,
      source: 'Admin',
      isCustom: true,
      timestamp: newsData.timestamp || Date.now(),
      date: newsData.date || new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    });

    await newNews.save();
    return NextResponse.json({ success: true, news: newNews }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
