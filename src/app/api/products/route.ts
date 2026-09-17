import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productListQuerySchema } from '@/lib/validation';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = productListQuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { category, search, sort, page, pageSize } = parsed.data;

  const where: Prisma.ProductWhereInput = { active: true };
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags: { has: search.toLowerCase() } },
    ];
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { ratingCount: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };
  // price-asc / price-desc are applied after fetch, since price lives on variants (see below).

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { active: true }, orderBy: { price: 'asc' } },
      },
    }),
  ]);

  let result = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category.slug,
    rating: p.ratingAvg,
    reviewCount: p.ratingCount,
    thumbnail: p.images[0]?.url ?? null,
    startingPrice: p.variants[0]?.price ?? null,
    startingMrp: p.variants[0]?.mrp ?? null,
    cheapestWeightLabel: p.variants[0]?.weightLabel ?? null,
  }));

  if (sort === 'price-asc') result = result.sort((a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0));
  if (sort === 'price-desc') result = result.sort((a, b) => (b.startingPrice ?? 0) - (a.startingPrice ?? 0));

  return NextResponse.json({
    data: result,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
