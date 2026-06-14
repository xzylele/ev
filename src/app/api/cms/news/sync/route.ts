import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import News from '@/models/news';

const EV_KEYWORDS = [
  'ev', 'ไฟฟ้า', 'electric', 'bev', 'phev', 'hybrid', 'ไฮบริด', 'ชาร์จ',
  'zeekr', 'byd', 'deepal', 'mg ', 'gwm', 'ora', 'tesla', 'neta', 'xpeng', 'changan'
];

function isEVRelated(title: string, description: string): boolean {
  const t = title.toLowerCase();
  const d = description.toLowerCase();
  return EV_KEYWORDS.some(kw => t.includes(kw) || d.includes(kw));
}

function parseThaiDate(dateStr: string): { formatted: string; timestamp: number } {
  let dateObj = new Date();
  if (dateStr) {
    const ts = Date.parse(dateStr);
    if (!isNaN(ts)) {
      dateObj = new Date(ts);
    }
  }

  const day = dateObj.getDate();
  const monthIndex = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  
  return {
    formatted: `${day} ${thaiMonths[monthIndex]} ${year}`,
    timestamp: dateObj.getTime()
  };
}

export async function POST(request: Request) {
  try {
    const adminPasscode = process.env.ADMIN_PASSCODE || 'admin1234';
    const passcode = request.headers.get('x-admin-passcode') || new URL(request.url).searchParams.get('passcode');

    if (passcode !== adminPasscode) {
      return NextResponse.json({ error: 'Unauthorized: Invalid passcode' }, { status: 401 });
    }

    await dbConnect();
    const articles: any[] = [];

    // 1. Fetch Headlightmag RSS feed
    try {
      const hRes = await fetch('https://www.headlightmag.com/feed/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (hRes.ok) {
        const xml = await hRes.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
          const block = match[1];
          const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
          const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
          const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
          const descMatch = block.match(/<description>([\s\S]*?)<\/description>/);
          
          let title = titleMatch ? titleMatch[1] : '';
          let link = linkMatch ? linkMatch[1] : '';
          let pubDate = pubDateMatch ? pubDateMatch[1] : '';
          let description = descMatch ? descMatch[1] : '';
          
          title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
          link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
          pubDate = pubDate.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
          description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
          description = description.replace(/<[^>]+>/g, '').replace(/&#\d+;/g, '').trim();

          if (isEVRelated(title, description)) {
            const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
            const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/i);
            const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i) || block.match(/src=["']([^"']+)["']/i);
            
            let image = '';
            if (enclosureMatch) image = enclosureMatch[1];
            else if (mediaMatch) image = mediaMatch[1];
            else if (imgMatch) image = imgMatch[1];

            const dateInfo = parseThaiDate(pubDate);

            articles.push({
              title,
              link,
              image,
              description: description.substring(0, 160) + (description.length > 160 ? '...' : ''),
              date: dateInfo.formatted,
              timestamp: dateInfo.timestamp,
              source: 'Headlightmag',
              hidden: false,
              isCustom: false
            });
          }
        }
      }
    } catch (err) {
      console.error('Headlightmag sync error:', err);
    }

    // 2. Fetch Autoinfo
    try {
      const aRes = await fetch('https://www.autoinfo.co.th/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (aRes.ok) {
        const html = await aRes.text();
        const postBoxRegex = /<div class="post-box">([\s\S]*?)<\/div>\s*<\/div>/g;
        let match;

        while ((match = postBoxRegex.exec(html)) !== null) {
          const block = match[1];
          const linkMatch = block.match(/href="([^"]*\/article\/[^"]*)"/);
          const titleMatch = block.match(/title="([^"]+)"/);
          const imgMatch = block.match(/data-lazy-src="([^"]+)"/);
          const descMatch = block.match(/<p class="[^"]*"><a[^>]*>([\s\S]*?)<\/a><\/p>/);
          const dateMatch = block.match(/<span class="content_date">([^<]+)<\/span>/);

          if (linkMatch && titleMatch) {
            const link = linkMatch[1];
            const title = titleMatch[1];
            let description = descMatch ? descMatch[1] : '';
            description = description.replace(/<[^>]+>/g, '').trim();

            if (isEVRelated(title, description)) {
              const image = imgMatch ? imgMatch[1] : '';
              const dateStr = dateMatch ? dateMatch[1].trim() : '';
              const dateInfo = parseThaiDate(dateStr);

              articles.push({
                title,
                link,
                image,
                description: description.substring(0, 160) + (description.length > 160 ? '...' : ''),
                date: dateInfo.formatted,
                timestamp: dateInfo.timestamp,
                source: 'Autoinfo',
                hidden: false,
                isCustom: false
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Autoinfo sync error:', err);
    }

    // Upsert items into DB
    let syncedCount = 0;
    if (articles.length > 0) {
      const ops = articles.map(art => ({
        updateOne: {
          filter: { link: art.link },
          update: { $setOnInsert: art },
          upsert: true
        }
      }));
      
      const bulkResult = await News.bulkWrite(ops);
      syncedCount = bulkResult.upsertedCount + bulkResult.modifiedCount;
    }

    return NextResponse.json({ success: true, syncedCount, totalScraped: articles.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Export a sync helper for use in internal auto-sync checks
export async function runNewsSyncInternal() {
  // Simple fetch and write
  const articles: any[] = [];
  try {
    const hRes = await fetch('https://www.headlightmag.com/feed/');
    if (hRes.ok) {
      const xml = await hRes.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch = block.match(/<description>([\s\S]*?)<\/description>/);
        
        let title = titleMatch ? titleMatch[1] : '';
        let link = linkMatch ? linkMatch[1] : '';
        let pubDate = pubDateMatch ? pubDateMatch[1] : '';
        let description = descMatch ? descMatch[1] : '';
        
        title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        pubDate = pubDate.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
        description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();

        if (isEVRelated(title, description)) {
          const enclosureMatch = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          const mediaMatch = block.match(/<media:content[^>]+url=["']([^"']+)["']/i);
          const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i) || block.match(/src=["']([^"']+)["']/i);
          
          let image = '';
          if (enclosureMatch) image = enclosureMatch[1];
          else if (mediaMatch) image = mediaMatch[1];
          else if (imgMatch) image = imgMatch[1];

          const dateInfo = parseThaiDate(pubDate);

          articles.push({
            title, link, image,
            description: description.substring(0, 160) + (description.length > 160 ? '...' : ''),
            date: dateInfo.formatted, timestamp: dateInfo.timestamp,
            source: 'Headlightmag', hidden: false, isCustom: false
          });
        }
      }
    }
  } catch (e) {}

  try {
    const aRes = await fetch('https://www.autoinfo.co.th/');
    if (aRes.ok) {
      const html = await aRes.text();
      const postBoxRegex = /<div class="post-box">([\s\S]*?)<\/div>\s*<\/div>/g;
      let match;
      while ((match = postBoxRegex.exec(html)) !== null) {
        const block = match[1];
        const linkMatch = block.match(/href="([^"]*\/article\/[^"]*)"/);
        const titleMatch = block.match(/title="([^"]+)"/);
        const imgMatch = block.match(/data-lazy-src="([^"]+)"/);
        const descMatch = block.match(/<p class="[^"]*"><a[^>]*>([\s\S]*?)<\/a><\/p>/);
        const dateMatch = block.match(/<span class="content_date">([^<]+)<\/span>/);

        if (linkMatch && titleMatch) {
          const link = linkMatch[1];
          const title = titleMatch[1];
          let description = descMatch ? descMatch[1] : '';
          description = description.replace(/<[^>]+>/g, '').trim();

          if (isEVRelated(title, description)) {
            const image = imgMatch ? imgMatch[1] : '';
            const dateStr = dateMatch ? dateMatch[1].trim() : '';
            const dateInfo = parseThaiDate(dateStr);

            articles.push({
              title, link, image,
              description: description.substring(0, 160) + (description.length > 160 ? '...' : ''),
              date: dateInfo.formatted, timestamp: dateInfo.timestamp,
              source: 'Autoinfo', hidden: false, isCustom: false
            });
          }
        }
      }
    }
  } catch (e) {}

  if (articles.length > 0) {
    const ops = articles.map(art => ({
      updateOne: {
        filter: { link: art.link },
        update: { $setOnInsert: art },
        upsert: true
      }
    }));
    await News.bulkWrite(ops);
  }
}
