import { db } from '@/lib/db';

export default async function AdminDashboardPage() {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    totalSalesAgg,
    todaysOrders,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    inventories,
    statusCounts,
    topProductsRaw,
  ] = await Promise.all([
    db.order.aggregate({ _sum: { grandTotal: true }, where: { status: { not: 'CANCELLED' } } }),
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count(),
    db.user.count({ where: { role: 'CUSTOMER' } }),
    db.product.count({ where: { active: true } }),
    db.order.count({ where: { status: { in: ['PLACED', 'CONFIRMED', 'PREPARING'] } } }),
    db.inventory.findMany({ include: { variant: { include: { product: true } } } }),
    db.order.groupBy({ by: ['status'], _count: true }),
    db.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { lineTotal: 'desc' } }, take: 5 }),
  ]);

  const lowStock = inventories.filter((v) => v.availableStock <= v.lowStockThreshold);
  const topProductIds = topProductsRaw.map((t) => t.productId);
  const topProductRecords = await db.product.findMany({ where: { id: { in: topProductIds } } });

  const stats = [
    { label: 'Total Sales', value: `₹${(totalSalesAgg._sum.grandTotal ?? 0).toLocaleString('en-IN')}` },
    { label: "Today's Orders", value: todaysOrders },
    { label: 'Total Orders', value: totalOrders },
    { label: 'Total Customers', value: totalCustomers },
    { label: 'Total Products', value: totalProducts },
    { label: 'Pending Orders', value: pendingOrders },
    { label: 'Low Stock Items', value: lowStock.length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-black/10 rounded-2xl p-5">
            <p className="text-xs text-inkSoft font-semibold mb-1">{s.label.toUpperCase()}</p>
            <p className="text-2xl font-bold font-display">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Order Status Distribution</h3>
          <div className="space-y-2">
            {statusCounts.map((s) => (
              <div key={s.status} className="flex justify-between text-sm">
                <span className="text-inkSoft">{s.status}</span>
                <span className="font-semibold">{s._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Top Products</h3>
          <div className="space-y-2">
            {topProductsRaw.map((t) => (
              <div key={t.productId} className="flex justify-between text-sm">
                <span className="text-inkSoft">{topProductRecords.find((p) => p.id === t.productId)?.name ?? 'Unknown'}</span>
                <span className="font-semibold">₹{t._sum.lineTotal} ({t._sum.quantity} units)</span>
              </div>
            ))}
            {topProductsRaw.length === 0 && <p className="text-inkSoft text-sm">No sales yet.</p>}
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-white border border-black/10 rounded-2xl p-5 md:col-span-2">
            <h3 className="font-semibold mb-3 text-barn">Low Stock Alerts</h3>
            <div className="space-y-2">
              {lowStock.map((v) => (
                <div key={v.id} className="flex justify-between text-sm">
                  <span>{v.variant.product.name} · {v.variant.weightLabel}</span>
                  <span className="font-semibold text-barn">{v.availableStock} left (threshold {v.lowStockThreshold})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
