'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Search, ShoppingBag, UserRound, Heart, MapPin, Menu, X, Phone, ChevronRight, Home, Store } from 'lucide-react';

const BUSINESS_PHONE = '+91 87666 52688';
const WHATSAPP_NUMBER = '918766652688';

export default function StoreHeader() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCartCount = () => {
      fetch('/api/cart', { credentials: 'include' })
        .then(async (r) => r.ok ? r.json() : null)
        .then((b) => { if (b) { setCartCount((b?.data?.items ?? []).reduce((n: number, i: any) => n + i.quantity, 0)); return; } const guest=JSON.parse(localStorage.getItem('freash_guest_cart')||'[]'); setCartCount(guest.reduce((n:number,i:any)=>n+i.quantity,0)); })
        .catch(() => undefined);
    };
    loadCartCount();
    window.addEventListener('cart-updated', loadCartCount);
    return () => window.removeEventListener('cart-updated', loadCartCount);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) { setOpen(false); window.location.href = `/shop?search=${encodeURIComponent(q)}`; }
  }

  const close = () => setOpen(false);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Freash Chiken home" onClick={close}>
            <span className="brand-logo-wrap"><Image src="/brand/logo.png" alt="Freash Chiken Centre logo" width={54} height={54} priority /></span>
            <span><strong>FREASH CHIKEN</strong><small>CHICKEN &amp; MORE · SINCE 1997</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/shop?category=boneless">Boneless</Link><Link href="/shop?category=curry">Curry Cut</Link><Link href="/shop?category=combo">Combos</Link>
          </nav>
          <form onSubmit={submit} className="header-search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search chicken, cuts, combos..." aria-label="Search products"/></form>
          <div className="header-actions">
            <a href={`tel:${BUSINESS_PHONE.replace(/\s/g,'')}`} className="header-call" aria-label={`Call ${BUSINESS_PHONE}`}><Phone size={17}/><span>Order by phone</span></a>
            <Link href="/wishlist" aria-label="Wishlist"><Heart size={19}/></Link>
            <Link href="/profile" aria-label="Account"><UserRound size={19}/></Link>
            <Link href="/cart" className="cart-action" aria-label="Cart"><ShoppingBag size={20}/><b>{cartCount}</b></Link>
            <button type="button" className="mobile-menu" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu/></button>
          </div>
        </div>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
        <Link href="/" onClick={close}><Home size={18}/><small>Home</small></Link>
        <Link href="/shop" onClick={close}><Store size={18}/><small>Shop</small></Link>
        <Link href="/cart" onClick={close} className="mobile-bottom-cart"><ShoppingBag size={18}/><small>Cart{cartCount ? ` · ${cartCount}` : ''}</small></Link>
        <Link href="/profile" onClick={close}><UserRound size={18}/><small>Account</small></Link>
        <button type="button" onClick={()=>setOpen(true)}><Menu size={18}/><small>Menu</small></button>
      </nav>

      {open && <>
        <button className="mobile-overlay" aria-label="Close menu" onClick={close}/>
        <aside className="mobile-drawer" aria-label="Mobile navigation">
          <div className="drawer-head">
            <div className="drawer-brand"><Image src="/brand/logo.png" alt="Freash Chiken Centre" width={42} height={42}/><div><strong>FREASH CHIKEN</strong><small>SASWAD · SINCE 1997</small></div></div>
            <button type="button" onClick={close} aria-label="Close menu"><X/></button>
          </div>
          <form onSubmit={submit} className="mobile-search"><Search size={18}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search fresh chicken..." aria-label="Search fresh chicken"/></form>
          <div className="drawer-links">
            {[['Home','/'],['Shop all','/shop'],['Boneless','/shop?category=boneless'],['Curry Cut','/shop?category=curry'],['Combos','/shop?category=combo'],['My account','/profile'],['My orders','/orders'],['Wishlist','/wishlist'],['Addresses','/addresses']].map(([label,href])=><Link key={href} href={href} onClick={close}>{label}<ChevronRight size={16}/></Link>)}
          </div>
          <div className="drawer-contact">
            <div><span className="contact-kicker">ORDER DIRECT</span><strong>{BUSINESS_PHONE}</strong><small>Call us for quick order assistance.</small></div>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="drawer-whatsapp">WhatsApp us</a>
          </div>
          <div className="drawer-heritage"><b>Serving Saswad &amp; Pune</b><span>Trusted locally since 1997</span></div>
        </aside>
      </>}
    </>
  );
}
