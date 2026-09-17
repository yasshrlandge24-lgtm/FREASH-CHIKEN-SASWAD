import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const pincode = req.nextUrl.searchParams.get('pincode') ?? '';
  if (!/^[0-9]{6}$/.test(pincode)) {
    return NextResponse.json({ data: { serviceable: false, message: 'Enter a valid 6-digit pincode.' } });
  }

  const area = await db.serviceArea.findUnique({ where: { pincode } });
  if (!area || !area.active) {
    return NextResponse.json({
      data: { serviceable: false, message: 'Sorry, delivery is currently unavailable in this area.' },
    });
  }

  return NextResponse.json({ data: { serviceable: true, message: 'Great! We deliver to your area.', city: area.city } });
}
