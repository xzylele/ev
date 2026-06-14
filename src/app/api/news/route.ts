import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News from '@/models/news';
import { runNewsSyncInternal } from '@/app/api/cms/news/sync/route';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if news count is 0, auto-sync if empty
    const count = await News.countDocuments();
    if (count === 0) {
      console.log("No news in DB, triggering auto-sync...");
      await runNewsSyncInternal();
    }

    // Retrieve active (non-hidden) news from MongoDB
    const articles = await News.find({ hidden: { $ne: true } })
                               .sort({ timestamp: -1 })
                               .limit(16)
                               .lean();

    return NextResponse.json(articles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
