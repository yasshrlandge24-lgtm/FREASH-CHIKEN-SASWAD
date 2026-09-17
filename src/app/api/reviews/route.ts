import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { createReviewSchema } from '@/lib/validation';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'productId query param is required' }, { status: 400 });

  const reviews = await db.review.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json({ data: reviews });
}

export async function POST(req: NextRequest) {
  const session = requireAuth();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { productId, rating, text } = parsed.data;

  // Only allow a review if this user has a DELIVERED order containing this product.
  const eligibleOrder = await db.order.findFirst({
    where: {
      userId: session.userId,
      status: 'DELIVERED',
      items: { some: { productId } },
    },
  });
  if (!eligibleOrder) {
    return NextResponse.json({ error: 'You can review a product after it has been delivered to you.' }, { status: 403 });
  }

  const existing = await db.review.findFirst({ where: { productId, userId: session.userId } });
  if (existing) {
    return NextResponse.json({ error: "You've already reviewed this product." }, { status: 409 });
  }

  const review = await db.review.create({
    data: { productId, userId: session.userId, rating, text, verified: true },
  });

  // Recompute the product's aggregate rating.
  const agg = await db.review.aggregate({ where: { productId, approved: true }, _avg: { rating: true }, _count: true });
  await db.product.update({
    where: { id: productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
  });

  return NextResponse.json({ data: review }, { status: 201 });
}
