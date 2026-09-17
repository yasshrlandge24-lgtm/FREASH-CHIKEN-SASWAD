import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

export async function GET() {
  const session = requireAdmin();
  if (!isSession(session)) return session;

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const startOf30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalSalesAgg,
    todaysOrders,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    lowStockVariants,
    statusCounts,
    recentOrders,
  ] = await Promise.all([
    db.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: 'CANCELLED' } } }),
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count(),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.product.count({ where: { active: true } }),
    db.order.count({ where: { status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } } }),
    db.inventory.findMany({
      // Prisma can't compare two columns of the same row in a `where` clause directly,
      // so fetch and filter in JS. Fine at this scale; move to `$queryRaw` if the table grows large.
      include: { variant: { include: { product: true } } },
    }),
    db.order.groupBy({ by: ['status'], _count: true }),
    db.order.findMany({
      where: { createdAt: { gte: startOf30Days } },
      select: { createdAt: true, grandTotal: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const lowStockFiltered = lowStockVariants.filter((v) => v.availableStock <= v.lowStockThreshold);

  // Bucket the last 30 days of orders into a simple daily revenue series for charting.
  const dailySeries: Record<string, number> = {};
  for (const o of recentOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    dailySeries[day] = (dailySeries[day] ?? 0) + o.grandTotal;
  }

  const topProductsRaw = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true, lineTotal: true },
    orderBy: { _sum: { lineTotal: 'desc' } },
    take: 10,
  });
  const topProductIds = topProductsRaw.map((t) => t.productId);
  const topProductRecords = await db.product.findMany({ where: { id: { in: topProductIds } } });
  const topProducts = topProductsRaw.map((t) => ({
    product: topProductRecords.find((p) => p.id === t.productId)?.name ?? 'Unknown',
    unitsSold: t._sum.quantity ?? 0,
    revenue: t._sum.lineTotal ?? 0,
  }));

  return NextResponse.json({
    data: {
      totalSales: totalSalesAgg._sum.grandTotal ?? 0,
      todaysOrders,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockCount: lowStockFiltered.length,
      lowStockItems: lowStockFiltered.map((v) => ({
        product: v.variant.product.name,
        variant: v.variant.weightLabel,
        available: v.availableStock,
        threshold: v.lowStockThreshold,
      })),
      orderStatusDistribution: statusCounts.map((s) => ({ status: s.status, count: s._count })),
      dailyRevenue: Object.entries(dailySeries).map(([date, revenue]) => ({ date, revenue })),
      topProducts,
    },
  });
}
