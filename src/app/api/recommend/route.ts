import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EV, { IEV } from '@/models/ev';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { budget, usageType, dailyDistance, priority, mustHaves = [] } = body;

    await dbConnect();
    const cars = await EV.find({}).lean();

    // Map daily distance string to numeric values for checks
    let dailyKmValue = 50;
    if (dailyDistance === '50-150') dailyKmValue = 150;
    else if (dailyDistance === '150-300') dailyKmValue = 300;
    else if (dailyDistance === 'over-300') dailyKmValue = 400;

    const scoredCars = cars.map((car: any) => {
      let score = 50; // Base score
      const reasons: string[] = [];

      // 1. Budget scoring & filtering
      // Under 750k: Price <= 750,000, 5% buffer allows up to 787,500
      if (budget === 'under-750k') {
        if (car.price <= 750000) {
          score += 20;
          reasons.push(`ราคาคุ้มค่าและประหยัดงบ (เพียง ${new Intl.NumberFormat('th-TH').format(car.price)} บาท)`);
        } else if (car.price <= 787500) {
          score += 12;
          reasons.push(`ราคาสูงเกินงบเล็กน้อยแต่จัดอยู่ในกลุ่มราคาเข้าถึงง่าย`);
        } else {
          score -= 40;
        }
      } 
      // 750k - 1.2M: Price 750,000 to 1,200,000, buffer allows 700,000 to 1,260,000
      else if (budget === '750k-1.2m') {
        if (car.price >= 750000 && car.price <= 1200000) {
          score += 20;
          reasons.push(`ช่วงราคา ${new Intl.NumberFormat('th-TH').format(car.price)} บาท อยู่ในช่วงงบประมาณที่คุณตั้งไว้พอดี`);
        } else if (car.price >= 700000 && car.price <= 1260000) {
          score += 10;
        } else {
          score -= 40;
        }
      } 
      // 1.2M - 2.0M: Price 1,200,000 to 2,000,000, buffer allows 1,150,000 to 2,100,000
      else if (budget === '1.2m-2m') {
        if (car.price >= 1200000 && car.price <= 2000000) {
          score += 20;
          reasons.push(`สเปครถระดับกลางถึงพรีเมียมในงบประมาณ ${new Intl.NumberFormat('th-TH').format(car.price)} บาท`);
        } else if (car.price >= 1150000 && car.price <= 2100000) {
          score += 10;
        } else {
          score -= 40;
        }
      } 
      // Over 2M: Price > 2,000,000, buffer allows from 1,900,000
      else if (budget === 'over-2m') {
        if (car.price >= 2000000) {
          score += 20;
          reasons.push(`ตอบโจทย์รถยนต์ไฟฟ้าระดับหรูหรา/สเปคเรือธงในงบตามต้องการ`);
        } else if (car.price >= 1900000) {
          score += 10;
        } else {
          score -= 40;
        }
      } else {
        score += 20; // Unlimited budget
      }

      // Extract best range from specs
      const range = Math.max(car.rangeWLTP || 0, car.rangeNEDC || 0, car.rangeCLTC || 0);
      const rangeStd = car.rangeWLTP ? 'WLTP' : car.rangeNEDC ? 'NEDC' : 'CLTC';

      // 2. Daily Distance & Range scoring
      let requiredRange = 250;
      if (dailyDistance === '50-150') requiredRange = 350;
      else if (dailyDistance === '150-300') requiredRange = 450;
      else if (dailyDistance === 'over-300') requiredRange = 550;

      if (range >= requiredRange) {
        score += 20;
        if (range >= requiredRange * 1.3) {
          score += 5;
          reasons.push(`ระยะทางวิ่งสูงสุด ${range} กม. (${rangeStd}) วิ่งครอบคลุมระยะทางขับขี่ต่อวันของคุณได้เหลือเฟือชาร์จ 1 ครั้งวิ่งได้หลายวัน`);
        } else {
          reasons.push(`ระยะทางวิ่งได้สูงสุด ${range} กม. (${rangeStd}) เพียงพอและปลอดภัยต่อการขับขี่ประจำวัน ${dailyKmValue} กม.`);
        }
      } else {
        const rangeRatio = range / requiredRange;
        score += Math.max(-30, Math.round(rangeRatio * 15) - 15);
        if (range < dailyKmValue * 1.2) {
          score -= 30; // Severe penalty if range is too low for daily trip
        }
      }

      // 3. Usage Type Match
      if (usageType === 'city') {
        if (car.bodyType === 'Hatchback') {
          score += 20;
          reasons.push(`ตัวถังแบบ Hatchback คล่องตัวสูงขับและลัดเลาะในเมืองได้ง่าย`);
        } else if (car.bodyType === 'Sedan') {
          score += 15;
          if (car.length < 4700) reasons.push(`ตัวถังซีดานขนาดกลางกำลังดี ขับขี่และหาที่จอดในเมืองได้สบาย`);
        } else if (car.bodyType === 'SUV' && car.length < 4600) {
          score += 15;
          reasons.push(`SUV ขนาดกะทัดรัด (ความยาว ${car.length} มม.) ทัศนวิสัยสูงแต่มุมมองกระชับใช้งานในเมืองสะดวก`);
        } else {
          score += 5;
        }
        if (car.length >= 4850) {
          score -= 15; // penalize very large cars for city drive
        }
      } 
      else if (usageType === 'highway') {
        if (range >= 500) {
          score += 20;
          reasons.push(`เดินทางไกลอุ่นใจด้วยแบตเตอรี่ใหญ่และระยะทางวิ่งสูงสุดถึง ${range} กม. ต่อการชาร์จ`);
        } else if (range >= 420) {
          score += 12;
        }
        if (car.dcChargePower >= 150) {
          score += 15;
          reasons.push(`รองรับหัวชาร์จเร็ว DC สูงสุด ${car.dcChargePower} kW ชาร์จพลังงานกลับได้อย่างรวดเร็วขณะแวะจุดพักรถ`);
        } else if (car.dcChargePower >= 100) {
          score += 10;
        }
      } 
      else if (usageType === 'family') {
        if (car.bodyType === 'MPV') {
          score += 25;
          reasons.push(`ห้องโดยสารแบบ MPV รองรับการเดินทางแบบครอบครัวใหญ่ได้อย่างนั่งสบายเป็นพิเศษ`);
        } else if (car.bodyType === 'SUV') {
          score += 20;
          reasons.push(`รูปโฉม SUV ใช้งานได้อเนกประสงค์ ห้องโดยสารกว้างขวาง เหมาะกับครอบครัว`);
        } else if (car.bodyType === 'Sedan' && car.length >= 4800) {
          score += 12;
          reasons.push(`ตัวถังซีดานพรีเมียมขนาดใหญ่ ห้องโดยสารตอนหลังกว้างขวาง นั่งสบายตลอดการเดินทาง`);
        } else {
          score += 5;
        }
        if (car.cargoVolume >= 450) {
          score += 10;
          reasons.push(`มีพื้นที่เก็บของท้ายขนาดใหญ่ความจุถึง ${car.cargoVolume} ลิตร บรรทุกสัมภาระครอบครัวได้เต็มที่`);
        }
      } 
      else if (usageType === 'mixed') {
        if (car.bodyType === 'SUV' || car.bodyType === 'Sedan') {
          score += 20;
          reasons.push(`ตัวถังอเนกประสงค์ขับขี่ไปทำงานในเมืองก็ได้ หรือขับเที่ยวต่างจังหวัดก็พร้อม`);
        } else {
          score += 12;
        }
      }

      // 4. Priority Feature Match
      if (priority === 'charge') {
        if (car.dcChargePower >= 150) {
          score += 25;
          reasons.push(`ระบบชาร์จด่วนทรงพลัง รองรับ DC สูงสุดถึง ${car.dcChargePower} kW ชาร์จจาก 10% ถึง 80% ในเวลาประมาณ 20-30 นาที`);
        } else if (car.dcChargePower >= 100) {
          score += 18;
          reasons.push(`ระบบชาร์จด่วน DC ความเร็วสูง ${car.dcChargePower} kW เหมาะกับไลฟ์สไตล์ที่ต้องการความรวดเร็ว`);
        } else {
          score += 5;
        }
        if (car.voltageArchitecture === '800V') {
          score += 10;
          reasons.push(`เทคโนโลยีแรงดันไฟระดับ 800V ช่วยให้ชาร์จไฟเต็มประสิทธิภาพสูงและลดความร้อนสะสม`);
        }
      } 
      else if (priority === 'range') {
        if (range >= 600) {
          score += 25;
          reasons.push(`จัดอยู่ในกลุ่มรถ EV ระยะทางวิ่งพรีเมียมสูงสุดถึง ${range} กม. ต่อการชาร์จ ไม่ต้องแวะสถานีชาร์จบ่อย`);
        } else if (range >= 500) {
          score += 18;
          reasons.push(`ระยะเดินทางไกลกว่าปกติ (${range} กม.) ตอบโจทย์ความต้องการระยะวิ่งระดับสูง`);
        } else {
          score += 8;
        }
      } 
      else if (priority === 'performance') {
        if (car.acceleration0To100 <= 4.5) {
          score += 25;
          reasons.push(`สมรรถนะระดับสปอร์ต อัตราเร่ง 0-100 กม./ชม. ในเวลาเพียง ${car.acceleration0To100} วินาที สนุกเร้าใจเป็นพิเศษ`);
        } else if (car.acceleration0To100 <= 6.5) {
          score += 18;
          reasons.push(`กำลังเครื่องขับสนุกติดเท้า อัตราเร่ง 0-100 กม./ชม. ในเวลาเพียง ${car.acceleration0To100} วินาที เร่งแซงทันใจปลอดภัย`);
        } else {
          score += 8;
        }
        if (car.horsepower >= 350) {
          score += 8;
          reasons.push(`ขุมพลังมอเตอร์ประสิทธิภาพสูงขับแรงถึง ${car.horsepower} แรงม้า`);
        }
      } 
      else if (priority === 'safety') {
        if (car.adasLevel >= 2) {
          score += 20;
          reasons.push(`ระบบขับขี่อัจฉริยะ ADAS เลเวล ${car.adasLevel} ช่วยผ่อนคลายการควบคุมและประคองเส้นทางขับขี่อย่างปลอดภัย`);
        } else {
          score += 8;
        }
        let safetyFeaturesCount = 0;
        if (car.adaptiveCruiseControl) safetyFeaturesCount++;
        if (car.laneKeepAssist) safetyFeaturesCount++;
        if (car.autoEmergencyBraking) safetyFeaturesCount++;
        if (car.blindSpotMonitor) safetyFeaturesCount++;
        if (car.autoParking) safetyFeaturesCount++;

        if (safetyFeaturesCount >= 4) {
          score += 10;
          reasons.push(`ติดตั้งฟีเจอร์ความปลอดภัยเชิงป้องกันครบชุด ทั้งกล้องรอบคัน ระบบเบรกฉุกเฉิน และเตือนมุมอับสายตา`);
        }
      } 
      else if (priority === 'value') {
        // Lower price within the pool gets bonus
        if (car.price <= 900000) {
          score += 15;
          reasons.push(`ราคาเบาคุ้มค่า เป็นเจ้าของได้ง่าย ลดภาระค่าผ่อนและดอกเบี้ยรายเดือน`);
        }
        if (car.warrantyYears >= 8) {
          score += 15;
          reasons.push(`อุ่นใจการรับประกันตัวรถนานยาวถึง ${car.warrantyYears} ปี หรือ ${new Intl.NumberFormat('th-TH').format(car.warrantyKm)} กม. ดูแลดีครอบคลุมยาวนาน`);
        } else if (car.warrantyYears >= 5) {
          score += 8;
        }
      }

      // 5. Must-Have Checkboxes
      if (mustHaves.includes('v2l')) {
        if (car.v2lSupport) {
          score += 12;
          reasons.push(`รองรับฟังก์ชัน V2L จ่ายไฟให้กับอุปกรณ์ไฟฟ้าภายนอกตัวรถด้วยพละกำลังไฟ ${car.v2lPower} kW`);
        } else {
          score -= 25; // Deduct points if must-have feature is missing
        }
      }
      if (mustHaves.includes('awd')) {
        if (car.driveType === 'AWD') {
          score += 12;
          reasons.push(`ระบบขับเคลื่อน 4 ล้อ (AWD) ให้แรงเกาะถนนที่ดีเยี่ยมในทุกสภาพอากาศ`);
        } else {
          score -= 25;
        }
      }
      if (mustHaves.includes('800v')) {
        if (car.voltageArchitecture === '800V') {
          score += 12;
          reasons.push(`สถาปัตยกรรมไฟ 800V เทคโนโลยีขั้นสูงชาร์จไวสุดยอดและมีประสิทธิภาพการใช้พลังงานดีเยี่ยม`);
        } else {
          score -= 25;
        }
      }
      if (mustHaves.includes('adas')) {
        if (car.adasLevel >= 2) {
          score += 12;
        } else {
          score -= 25;
        }
      }

      // Normalize score to range [0-100]
      const finalScore = Math.max(0, Math.min(100, Math.round(score)));

      // Keep only unique reasons
      const uniqueReasons = Array.from(new Set(reasons));

      return {
        ...car,
        matchScore: finalScore,
        reasons: uniqueReasons.slice(0, 4) // Return max 4 best reasons
      };
    });

    // Sort by matchScore descending, then price ascending (cheaper is tie-breaker)
    scoredCars.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.price - b.price;
    });

    // Return top 3 recommendations
    const top3 = scoredCars.slice(0, 3);

    return NextResponse.json(top3);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
