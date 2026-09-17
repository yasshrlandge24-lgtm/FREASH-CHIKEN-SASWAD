import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json({ data: [] });

  const products = await db.product.findMany({
    where: {
      active: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { variants: { some: { cutOption: { contains: q, mode: 'insensitive' } } } },
      ],
    },
    take: 20,
    include: {
      category: true,
      variants: { where: { active: true }, orderBy: { price: 'asc' }, take: 1 },
    },
  });

  return NextResponse.json({
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category.name,
      startingPrice: p.variants[0]?.price ?? null,
    })),
  });
}
