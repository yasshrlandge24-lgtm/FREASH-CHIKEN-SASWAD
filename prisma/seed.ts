import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // ---------- Demo accounts ----------
  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  const admin = await db.user.upsert({
    where: { email: 'admin@freash-chiken.example' },
    update: {},
    create: {
      name: 'Store Admin',
      email: 'admin@freash-chiken.example',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const customerPassword = await bcrypt.hash('Customer@1234', 10);
  const customer = await db.user.upsert({
    where: { email: 'customer@freash-chiken.example' },
    update: {},
    create: {
      name: 'Demo Customer',
      email: 'customer@freash-chiken.example',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });

  // ---------- Categories ----------
  const categoryDefs = [
    { name: 'Whole Chicken', slug: 'whole' },
    { name: 'Curry Cut', slug: 'curry' },
    { name: 'Boneless', slug: 'boneless' },
    { name: 'Breast', slug: 'breast' },
    { name: 'Thigh', slug: 'thigh' },
    { name: 'Drumsticks', slug: 'drumstick' },
    { name: 'Wings', slug: 'wings' },
    { name: 'Lollipop', slug: 'lollipop' },
    { name: 'Mince', slug: 'mince' },
    { name: 'Liver', slug: 'liver' },
    { name: 'Combo Packs', slug: 'combo' },
  ];
  const categories: Record<string, string> = {};
  for (const [i, c] of categoryDefs.entries()) {
    const cat = await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { name: c.name, slug: c.slug, displayOrder: i },
    });
    categories[c.slug] = cat.id;
  }

  // ---------- Products ----------
  type SeedVariant = { weightLabel: string; weightGrams: number; cutOption: string | null; price: number; mrp: number };
  function makeVariants(perKg: number, grams: number[]): SeedVariant[] {
    return grams.map((g) => {
      const price = Math.round((perKg * g) / 1000);
      const mrp = Math.round((price * 1.2) / 5) * 5;
      return { weightLabel: g >= 1000 ? `${g / 1000}kg` : `${g}g`, weightGrams: g, cutOption: null, price, mrp };
    });
  }

  const productDefs = [
    { slug: 'farmhouse-curry-cut', name: 'Farmhouse Curry Cut', category: 'curry', perKg: 320, grams: [250, 500, 1000, 2000], cuts: ['Curry Cut (Bone-in)', 'Small Pieces', 'Large Pieces'], desc: 'Classic bone-in curry pieces, cut fresh to order.' },
    { slug: 'boneless-breast-fillets', name: 'Boneless Breast Fillets', category: 'breast', perKg: 430, grams: [250, 500, 1000, 2000], cuts: ['Whole Fillet', 'Sliced', 'Cubed'], desc: 'Lean, thick-cut fillets — great for grilling or curries.' },
    { slug: 'boneless-thigh', name: 'Boneless Thigh', category: 'thigh', perKg: 400, grams: [250, 500, 1000, 2000], cuts: ['Boneless', 'Cubed'], desc: 'Juicier than breast, trimmed and deboned by hand.' },
    { slug: 'classic-drumsticks', name: 'Classic Drumsticks', category: 'drumstick', perKg: 340, grams: [250, 500, 1000, 2000], cuts: ['With Skin', 'Skinless'], desc: 'Everyday drumsticks, skin-on or skinless.' },
    { slug: 'party-wings', name: 'Party Wings', category: 'wings', perKg: 360, grams: [250, 500, 1000, 2000], cuts: ['Whole Wings', 'Drumettes Only', 'Flats Only'], desc: 'Full wings split into drumettes and flats on request.' },
    { slug: 'chicken-lollipop', name: 'Chicken Lollipop', category: 'lollipop', perKg: 460, grams: [250, 500, 1000], cuts: null, desc: 'Frenched drumettes, ready to marinate and fry.' },
    { slug: 'fresh-mince-keema', name: 'Fresh Mince (Keema)', category: 'mince', perKg: 380, grams: [250, 500, 1000], cuts: ['Regular Grind', 'Fine Grind'], desc: 'Ground fresh in-house, no fillers or additives.' },
    { slug: 'chicken-liver', name: 'Chicken Liver', category: 'liver', perKg: 260, grams: [250, 500], cuts: null, desc: 'Cleaned and trimmed, packed same-day.' },
    { slug: 'whole-chicken-skin-on', name: 'Whole Chicken — Skin On', category: 'whole', perKg: 300, grams: [1000, 2000], cuts: null, desc: 'A full bird, classic prep, skin intact for roasting.' },
    { slug: 'whole-chicken-skinless', name: 'Whole Chicken — Skinless', category: 'whole', perKg: 320, grams: [1000, 2000], cuts: null, desc: 'A full bird with skin removed for lighter cooking.' },
    { slug: 'biryani-cut-special', name: 'Biryani Cut Special', category: 'curry', perKg: 340, grams: [500, 1000, 2000], cuts: ['Bone-in', 'Boneless'], desc: 'Medium bone-in pieces sized specifically for biryani.' },
    { slug: 'tikka-cubes', name: 'Tikka Cubes', category: 'boneless', perKg: 440, grams: [250, 500, 1000], cuts: null, desc: 'Even cubes cut for skewers and tikka marinades.' },
    { slug: 'leg-quarters', name: 'Leg Quarters', category: 'drumstick', perKg: 310, grams: [500, 1000, 2000], cuts: null, desc: 'Thigh and drumstick together, bone-in.' },
    { slug: 'weekly-family-combo', name: 'Weekly Family Combo', category: 'combo', perKg: 345, grams: [2000], cuts: null, desc: 'Curry cut, breast fillets and drumsticks — one weekly pack.' },
    { slug: 'grill-night-combo', name: 'Grill Night Combo', category: 'combo', perKg: 400, grams: [1500], cuts: null, desc: 'Wings, thigh and tikka cubes, portioned for a cookout.' },
  ];

  for (const p of productDefs) {
    const baseVariants = makeVariants(p.perKg, p.grams);
    const variantsToCreate: SeedVariant[] = p.cuts
      ? baseVariants.flatMap((v) => p.cuts!.map((cut) => ({ ...v, cutOption: cut })))
      : baseVariants;

    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        categoryId: categories[p.category],
        sku: `SKU-${p.slug.toUpperCase()}`,
        tags: [p.category, ...(p.cuts ?? []).map((c) => c.toLowerCase())],
        sourcingInfo: 'Sourced through selected suppliers using defined sourcing and quality standards.',
        processingInfo: 'Cleaned, cut to your selected style, and trimmed by hand in a temperature-controlled prep room.',
        hygieneInfo: 'All prep surfaces and tools are sanitized between batches; each pack is sealed immediately after cutting.',
        storageInfo: 'Refrigerate at 0–4°C and use within 2 days of delivery, or freeze immediately.',
        deliveryInfo: 'Delivered in an insulated cold pack within your chosen slot.',
        nutritionInfo: { servingSize: '100g', energyKcal: 165, proteinG: 31, fatG: 3.6, carbsG: 0, sodiumMg: 70 },
        ratingAvg: 4.3 + Math.random() * 0.5,
        ratingCount: 30 + Math.floor(Math.random() * 250),
      },
    });

    const imageUrls = [
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=1200&q=85',
    ];
    for (const [idx, url] of imageUrls.entries()) {
      const exists = await db.productImage.findFirst({ where: { productId: product.id, url } });
      if (!exists) await db.productImage.create({ data: { productId: product.id, url, altText: `${product.name} fresh chicken`, sortOrder: idx } });
    }

    for (const v of variantsToCreate) {
      const sku = `${product.sku}-${v.weightLabel}${v.cutOption ? '-' + v.cutOption.replace(/\s+/g, '') : ''}`;
      const createData = {
        productId: product.id,
        weightLabel: v.weightLabel,
        weightGrams: v.weightGrams,
        cutOption: v.cutOption,
        price: v.price,
        mrp: v.mrp,
        sku,
        inventory: { create: { availableStock: 50 + Math.floor(Math.random() * 150) } },
      };

      // Prisma cannot use null inside a compound unique selector.
      // For variants without a cut option, find the existing row first.
      if (v.cutOption === null) {
        const existing = await db.productVariant.findFirst({
          where: { productId: product.id, weightLabel: v.weightLabel, cutOption: null },
          select: { id: true },
        });
        if (!existing) await db.productVariant.create({ data: createData });
      } else {
        await db.productVariant.upsert({
          where: { productId_weightLabel_cutOption: { productId: product.id, weightLabel: v.weightLabel, cutOption: v.cutOption } },
          update: {},
          create: createData,
        });
      }
    }
  }

  // ---------- Coupons ---------- (all amounts in whole rupees, matching the pricing convention)
  await db.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENT', value: 10, minOrderAmount: 299, maxDiscount: 150, perUserLimit: 1 },
  });
  await db.coupon.upsert({
    where: { code: 'FRESH50' },
    update: {},
    create: { code: 'FRESH50', type: 'FLAT', value: 50, minOrderAmount: 499, maxDiscount: 50, perUserLimit: 5 },
  });
  await db.coupon.upsert({
    where: { code: 'FIRSTORDER' },
    update: {},
    create: { code: 'FIRSTORDER', type: 'PERCENT', value: 15, minOrderAmount: 399, maxDiscount: 200, perUserLimit: 1 },
  });

  // ---------- Service areas (demo: a handful of real-looking Pune/Mumbai/Bangalore pincodes) ----------
  const pincodes = ['411001', '411004', '411014', '411038', '400001', '400058', '560001', '560034'];
  for (const pin of pincodes) {
    await db.serviceArea.upsert({
      where: { pincode: pin },
      update: {},
      create: { pincode: pin, city: 'Demo City', active: true },
    });
  }

  // ---------- Delivery slots for today and tomorrow ----------
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const slotDefs = [
    { label: '12 PM – 2 PM', startTime: '12:00', endTime: '14:00' },
    { label: '2 PM – 4 PM', startTime: '14:00', endTime: '16:00' },
    { label: '4 PM – 6 PM', startTime: '16:00', endTime: '18:00' },
    { label: '6 PM – 8 PM', startTime: '18:00', endTime: '20:00' },
  ];
  for (const day of [today, tomorrow]) {
    for (const s of slotDefs) {
      await db.deliverySlot.create({
        data: { ...s, date: day, capacity: 50, bookedCount: 0, deliveryFee: 40 },
      });
    }
  }

  console.log('Seed complete.');
  console.log('Admin login:    admin@freash-chiken.example / Admin@1234');
  console.log('Customer login: customer@freash-chiken.example / Customer@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
