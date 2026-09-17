import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import { adminProductSchema } from '@/lib/validation';

export async function GET() {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const products = await db.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: { category: true, variants: { include: { inventory: true } } },
  });
  return NextResponse.json({ data: products });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const body = await req.json();
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;

  const product = await db.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      categoryId: data.categoryId,
      sku: data.sku,
      tags: data.tags,
      sourcingInfo: data.sourcingInfo,
      processingInfo: data.processingInfo,
      hygieneInfo: data.hygieneInfo,
      storageInfo: data.storageInfo,
      deliveryInfo: data.deliveryInfo,
      active: data.active,
      variants: {
        create: data.variants.map((v) => ({
          weightLabel: v.weightLabel,
          weightGrams: v.weightGrams,
          cutOption: v.cutOption ?? null,
          price: v.price,
          mrp: v.mrp,
          sku: v.sku,
          inventory: { create: { availableStock: v.initialStock } },
        })),
      },
    },
    include: { variants: { include: { inventory: true } } },
  });

  return NextResponse.json({ data: product }, { status: 201 });
}
