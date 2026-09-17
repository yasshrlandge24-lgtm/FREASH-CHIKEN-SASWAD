import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const product = await db.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        where: { active: true },
        orderBy: { price: 'asc' },
        include: { inventory: true },
      },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product || !product.active) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const relatedRaw = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, active: true },
    take: 4,
    include: { variants: { where: { active: true }, orderBy: { price: 'asc' }, take: 1 } },
  });

  return NextResponse.json({
    data: {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        inStock: (v.inventory?.availableStock ?? 0) - (v.inventory?.reservedStock ?? 0) > 0,
      })),
      related: relatedRaw.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        startingPrice: r.variants[0]?.price ?? null,
        startingMrp: r.variants[0]?.mrp ?? null,
      })),
    },
  });
}
