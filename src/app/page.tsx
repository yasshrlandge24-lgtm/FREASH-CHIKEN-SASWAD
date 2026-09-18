import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowRight, Check, Clock3, ShieldCheck, Snowflake, Star, Truck } from 'lucide-react';

export default async function HomePage() {
  const [categories, bestsellers] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, take: 12 }),
    db.product.findMany({
      where: { active: true },
      orderBy: { ratingCount: 'desc' },
      take: 8,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { active: true }, orderBy: { price: 'asc' }, take: 1 },
      },
    }),
  ]);

  const categoryNames = [
    'Curry Cut',
    'Boneless',
    'Breast',
    'Thigh',
    'Drumsticks',
    'Wings',
    'Lollipop',
    'Mince',
    'Whole Chicken',
    'Liver',
    'Combo Packs',
  ];

  const categoryImages = [
    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=900&q=85',
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=900&q=85',
  ];

  const journeyImages = [
    'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1604908177522-040c9a1e8d8c?auto=format&fit=crop&w=1000&q=85',
  ];

  return (
    <main>
      <section className="page-shell">
        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              FREASH CHIKEN CENTRE · Saswad &amp; Pune · Since 1997
            </span>

            <h1>
              FREASH CHIKEN CENTRE
              <br />
              <em>Fresh Chicken in Saswad, Pune</em>
            </h1>

            <p>
              FREASH CHIKEN CENTRE brings fresh chicken, clean cuts and
              hygienically packed chicken to customers in Saswad, Pune.
              Serving the local community since 1997.
            </p>

            <div className="hero-actions">
              <Link href="/shop" className="btn btn-dark">
                Shop fresh chicken <ArrowRight size={16} />
              </Link>

              <a href="#quality" className="btn btn-light">
                See our quality promise
              </a>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true" />
        </div>
      </section>

      <section className="trust-strip">
        <Trust
          icon={<Snowflake />}
          title="Prepared fresh"
          sub="Cut for your order"
        />
        <Trust
          icon={<ShieldCheck />}
          title="Quality checked"
          sub="Care at every step"
        />
        <Trust
          icon={<Truck />}
          title="Cold delivered"
          sub="Insulated packaging"
        />
        <Trust
          icon={<Clock3 />}
          title="Chosen slot"
          sub="Convenient delivery"
        />
      </section>

      <div className="page-shell">
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Explore the counter</span>
              <h2>Fresh Chicken Cuts in Saswad</h2>
              <p>
                Shop fresh chicken in Saswad with everyday curry pieces,
                boneless cuts and popular chicken cuts prepared for your
                recipe.
              </p>
            </div>

            <Link className="text-link" href="/shop">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="category-grid">
            {categoryNames.slice(0, 6).map((n, i) => (
              <Link
                key={n}
                href={`/shop?category=${[
                  'curry',
                  'boneless',
                  'breast',
                  'thigh',
                  'drumstick',
                  'wings',
                ][i]}`}
                className="category-card"
                style={{ backgroundImage: `url(${categoryImages[i]})` }}
              >
                <b>{n}</b>
                <span>Freshly prepared</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Customer favourites</span>
              <h2>Best Sellers</h2>
              <p>
                Explore popular fresh chicken cuts available from FREASH
                CHIKEN CENTRE in Saswad.
              </p>
            </div>

            <Link className="text-link" href="/shop?sort=popular">
              Shop popular <ArrowRight size={13} />
            </Link>
          </div>

          <div className="product-grid">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        <section className="section">
          <div className="offer-banner">
            <div>
              <span
                className="eyebrow"
                style={{ color: '#dbe8dc' }}
              >
                Established locally · Since 1997
              </span>

              <h2>Fresh cuts for the whole table.</h2>

              <p>
                Build your basket with family packs and save on delivery
                over ₹499.
              </p>
            </div>

            <Link
              href="/shop?category=combo"
              className="btn btn-light"
            >
              Explore combos <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Our promise</span>
              <h2>Fresh Chicken From Source to Doorstep</h2>
              <p>
                A simple, visible journey designed around freshness,
                consistency and careful handling for customers in Saswad.
              </p>
            </div>
          </div>

          <div className="visual-process">
            {[
              [
                '01',
                'Source',
                'Selected suppliers and defined sourcing standards.',
              ],
              [
                '02',
                'Check',
                'Incoming batches are checked before preparation.',
              ],
              [
                '03',
                'Prepare',
                'Your chosen cut is cleaned, portioned and packed.',
              ],
              [
                '04',
                'Deliver',
                'Orders move through a chilled delivery workflow.',
              ],
            ].map(([n, t, d], i) => (
              <div
                key={n}
                className="visual-process-card"
                style={{
                  backgroundImage: `url(${journeyImages[i]})`,
                }}
              >
                <div>
                  <span className="process-num">{n}</span>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="quality" className="section">
          <div className="quality">
            <div>
              <span className="eyebrow">Why FREASH CHIKEN</span>

              <h2>
                Why Choose FREASH CHIKEN CENTRE in Saswad?
              </h2>

              <p>
                We keep the experience simple: clear product information,
                thoughtful preparation, secure packing and a delivery flow
                you can understand.
              </p>

              <Link href="/shop" className="btn btn-dark">
                Start shopping <ArrowRight size={15} />
              </Link>
            </div>

            <div className="quality-list">
              <Quality
                t="Clear product details"
                d="Weight, cut and preparation options are visible before checkout."
              />

              <Quality
                t="Hygienic preparation"
                d="Clean preparation routines and immediate sealing are part of the workflow."
              />

              <Quality
                t="Chilled packaging"
                d="Orders are packed to help maintain appropriate cold conditions during delivery."
              />

              <Quality
                t="Reliable service"
                d="Select a delivery slot and keep your order status visible."
              />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Real feedback</span>
              <h2>What Customers Say</h2>
            </div>
          </div>

          <div className="reviews">
            <Review
              text="The cut selector makes ordering exactly what I need really easy."
              name="Aarav · Pune"
            />

            <Review
              text="Clean interface, clear pricing and the order tracking is straightforward."
              name="Neha · Pune"
            />

            <Review
              text="The family combo is convenient when I am planning meals for the week."
              name="Rohan · Pune"
            />
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">Frequently asked</span>
              <h2>Fresh Chicken Saswad — Quick Answers</h2>
            </div>
          </div>

          <div className="info-grid">
            <Info
              title="Where is FREASH CHIKEN CENTRE located?"
              text="FREASH CHIKEN CENTRE serves customers in Saswad, Pune, with fresh chicken, clean cuts and hygienic packing."
            />

            <Info
              title="How is my chicken prepared?"
              text="Choose the available weight and cut options on the product page. Your selection is attached to the order."
            />

            <Info
              title="How do I know if you deliver to me?"
              text="Enter your pincode during checkout. Serviceability and available delivery slots are checked before an order is placed."
            />

            <Info
              title="Can I reorder?"
              text="Yes. Your completed orders are saved in My Orders so you can review them and build a new basket."
            />

            <Info
              title="How should I store it?"
              text="Follow the storage information shown on each product and refrigerate promptly after delivery."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Trust({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="trust-card">
      <div className="trust-icon">{icon}</div>
      <div>
        <b>{title}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

function Process({
  n,
  t,
  d,
}: {
  n: string;
  t: string;
  d: string;
}) {
  return (
    <div className="process-card">
      <span className="process-num">{n}</span>
      <h3>{t}</h3>
      <p>{d}</p>
    </div>
  );
}

function Quality({ t, d }: { t: string; d: string }) {
  return (
    <div className="quality-item">
      <Check size={17} />
      <div>
        <b>{t}</b>
        <span>{d}</span>
      </div>
    </div>
  );
}

function Review({
  text,
  name,
}: {
  text: string;
  name: string;
}) {
  return (
    <div className="review-card">
      <div className="review-stars">★★★★★</div>
      <p>“{text}”</p>
      <small>{name}</small>
    </div>
  );
}

function Info({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="info-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ProductCard({ p }: { p: any }) {
  const v = p.variants[0];
  const image = p.images?.[0]?.url;

  return (
    <Link
      href={`/products/${p.slug}`}
      className="product-card"
    >
      <div
        className="product-media"
        style={
          image
            ? {
                backgroundImage: `url(${image})`,
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
            <span className="price">₹{v?.price ?? 0}</span>

            {v?.mrp && (
              <span className="mrp">₹{v.mrp}</span>
            )}
          </div>

          <span className="rating">
            <Star size={11} fill="currentColor" />{' '}
            {p.ratingAvg.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}