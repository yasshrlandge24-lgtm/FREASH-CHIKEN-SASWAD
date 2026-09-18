import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { Search, SlidersHorizontal, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Fresh Chicken in Saswad, Pune | FREASH CHIKEN CENTRE',
  description:
    'Shop fresh chicken in Saswad, Pune from FREASH CHIKEN CENTRE. Explore chicken cuts, boneless chicken, family combos and more. Serving Saswad since 1997.',
  alternates: {
    canonical: '/shop',
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
  };
}) {
  const { category, search, sort } = searchParams;

  const where: Prisma.ProductWhereInput = {
    active: true,
  };

  if (category) where.category = { slug: category };

  if (search)
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        tags: {
          has: search.toLowerCase(),
        },
      },
    ];

  let orderBy: Prisma.ProductOrderByWithRelationInput = {
    createdAt: 'desc',
  };

  if (sort === 'popular') orderBy = { ratingCount: 'desc' };
  if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [categories, products] = await Promise.all([
    db.category.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    }),

    db.product.findMany({
      where,
      orderBy,
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        variants: {
          where: { active: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
    }),
  ]);

  let list = products;

  if (sort === 'price-asc')
    list = [...list].sort(
      (a, b) =>
        (a.variants[0]?.price ?? 0) -
        (b.variants[0]?.price ?? 0),
    );

  if (sort === 'price-desc')
    list = [...list].sort(
      (a, b) =>
        (b.variants[0]?.price ?? 0) -
        (a.variants[0]?.price ?? 0),
    );

  return (
    <main className="page-shell">
      <div className="mobile-category-bar">
        <div>
          <span className="eyebrow">Category</span>
          <strong>
            {category
              ? categories.find((c) => c.slug === category)?.name ??
                'Fresh Chicken'
              : 'All chicken'}
          </strong>
        </div>

        <Link href="/shop" className="mobile-category-clear">
          All
        </Link>
      </div>

      <div className="shop-layout">
        <aside className="filter-panel">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>CATEGORIES</h3>
            <SlidersHorizontal size={15} />
          </div>

          <div className="filter-list">
            <Link
              href="/shop"
              className={!category ? 'active' : ''}
            >
              All chicken
            </Link>

            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className={category === c.slug ? 'active' : ''}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--line)',
              marginTop: 20,
              paddingTop: 20,
            }}
          >
            <h3>POPULAR</h3>

            <div className="filter-list">
              <Link href="/shop?sort=popular">
                Best sellers
              </Link>

              <Link href="/shop?category=boneless">
                Boneless cuts
              </Link>

              <Link href="/shop?category=combo">
                Family combos
              </Link>
            </div>
          </div>
        </aside>

        <section>
          <div className="shop-top">
            <div>
              <span className="eyebrow">
                FREASH CHIKEN CENTRE · Saswad, Pune
              </span>

              <h1>
                {category
                  ? categories.find((c) => c.slug === category)?.name ??
                    'Fresh Chicken in Saswad'
                  : 'Fresh Chicken in Saswad, Pune'}
              </h1>

              <p>
                Shop fresh chicken cuts from FREASH CHIKEN CENTRE,
                serving Saswad since 1997.
              </p>

              <p>{list.length} products available</p>
            </div>

            <form>
              <select
                name="sort"
                defaultValue={sort ?? 'recommended'}
                className="sort-select"
              >
                <option value="recommended">Recommended</option>
                <option value="popular">Popular</option>
                <option value="price-asc">
                  Price: Low to High
                </option>
                <option value="price-desc">
                  Price: High to Low
                </option>
                <option value="newest">Newest</option>
              </select>
            </form>
          </div>

          <form
            action="/shop"
            className="mobile-search"
            style={{ marginBottom: 18 }}
          >
            <Search size={17} />

            <input
              name="search"
              defaultValue={search ?? ''}
              placeholder="Search chicken, cuts, combos..."
            />

            <button className="text-link" type="submit">
              Search
            </button>
          </form>

          {list.length === 0 ? (
            <div
              className="admin-card"
              style={{
                textAlign: 'center',
                padding: 60,
              }}
            >
              <h2>No cuts found</h2>

              <p style={{ color: 'var(--muted)' }}>
                Fresh chicken products will appear here when available.
                Try another search or browse all chicken cuts.
              </p>

              <Link
                href="/shop"
                className="btn btn-dark"
                style={{ marginTop: 14 }}
              >
                View all
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {list.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="product-card"
                >
                  <div
                    className="product-media"
                    style={
                      p.images[0]?.url
                        ? {
                            backgroundImage: `url(${p.images[0].url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                  >
                    <span className="badge">FRESH</span>
                  </div>

                  <div className="product-info">
                    <h3>{p.name}</h3>

                    <p>{p.description}</p>

                    <div className="price-row">
                      <div>
                        <span className="price">
                          ₹{p.variants[0]?.price ?? 0}
                        </span>

                        {p.variants[0]?.mrp ? (
                          <span className="mrp">
                            ₹{p.variants[0].mrp}
                          </span>
                        ) : null}
                      </div>

                      <span className="rating">
                        <Star
                          size={11}
                          fill="currentColor"
                        />{' '}
                        {p.ratingAvg.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}