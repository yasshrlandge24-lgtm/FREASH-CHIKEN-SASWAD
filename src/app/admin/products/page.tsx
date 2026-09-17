'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Variant = { id: string; weightLabel: string; cutOption: string | null; price: number; mrp: number; inventory: { availableStock: number } | null };
type Product = { id: string; name: string; slug: string; sku: string; active: boolean; category: { name: string }; variants: Variant[] };
type Category = { id: string; name: string };

const emptyForm = {
  name: '', slug: '', description: '', categoryId: '', sku: '',
  weightLabel: '500g', weightGrams: 500, price: 0, mrp: 0, variantSku: '', initialStock: 50,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [pRes, cRes] = await Promise.all([
      fetch('/api/admin/products', { credentials: 'include' }),
      fetch('/api/categories', { credentials: 'include' }),
    ]);
    const pBody = await pRes.json();
    const cBody = await cRes.json();
    setProducts(pBody.data);
    setCategories(cBody.data);
    if (cBody.data[0]) setForm((f) => ({ ...f, categoryId: f.categoryId || cBody.data[0].id }));
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(product: Product) {
    await fetch(`/api/admin/products/${product.id}`, {
      method: product.active ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: product.active ? undefined : JSON.stringify({ active: true }),
    });
    load();
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        description: form.description,
        categoryId: form.categoryId,
        sku: form.sku,
        tags: [],
        active: true,
        variants: [{
          weightLabel: form.weightLabel,
          weightGrams: Number(form.weightGrams),
          cutOption: null,
          price: Number(form.price),
          mrp: Number(form.mrp),
          sku: form.variantSku || `${form.sku}-${form.weightLabel}`,
          initialStock: Number(form.initialStock),
        }],
      }),
    });
    setSaving(false);
    const body = await res.json();
    if (!res.ok) { setError(JSON.stringify(body.error)); return; }
    setShowForm(false);
    setForm(emptyForm);
    load();
  }

  if (!products) return <p>Loading…</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button onClick={() => setShowForm((s) => !s)} className="bg-ink text-white rounded-lg px-5 py-2 font-semibold text-sm">
          {showForm ? 'Cancel' : '+ New Product'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProduct} className="bg-white border border-black/10 rounded-2xl p-6 mb-8 grid grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2 col-span-2" />
          <input required placeholder="Slug (e.g. spicy-wings)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2" />
          <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2 col-span-2" />
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2 col-span-2">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Weight label (e.g. 500g)" value={form.weightLabel} onChange={(e) => setForm({ ...form, weightLabel: e.target.value })} className="border border-black/15 rounded-lg px-3 py-2" />
          <input type="number" placeholder="Weight (grams)" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: Number(e.target.value) })} className="border border-black/15 rounded-lg px-3 py-2" />
          <input type="number" required placeholder="Price (₹)" value={form.price || ''} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="border border-black/15 rounded-lg px-3 py-2" />
          <input type="number" required placeholder="MRP (₹)" value={form.mrp || ''} onChange={(e) => setForm({ ...form, mrp: Number(e.target.value) })} className="border border-black/15 rounded-lg px-3 py-2" />
          <input type="number" placeholder="Initial stock" value={form.initialStock} onChange={(e) => setForm({ ...form, initialStock: Number(e.target.value) })} className="border border-black/15 rounded-lg px-3 py-2 col-span-2" />
          {error && <p className="text-barn text-sm col-span-2">{error}</p>}
          <button disabled={saving} className="bg-ink text-white rounded-lg py-3 font-semibold col-span-2 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create Product'}
          </button>
        </form>
      )}

      <div className="bg-white border border-black/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Variants</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-black/5">
                <td className="px-4 py-3 font-semibold">{p.name}<div className="text-xs text-inkSoft font-normal">{p.sku}</div></td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">
                  {p.variants.map((v) => (
                    <div key={v.id} className="text-xs">
                      {v.weightLabel}{v.cutOption ? ` · ${v.cutOption}` : ''} — ₹{v.price} ({v.inventory?.availableStock ?? 0} in stock)
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.active ? 'bg-[#EAF1E9] text-sageDark' : 'bg-[#F5E7E3] text-barn'}`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className="text-xs font-semibold border border-black/15 rounded-lg px-3 py-1.5">
                    {p.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
