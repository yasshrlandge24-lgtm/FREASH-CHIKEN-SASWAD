'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, Heart, LogIn, MapPin, Package, UserRound } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(async (r) => {
        if (r.status === 401) return null;
        const body = await r.json();
        return r.ok ? body.data : null;
      })
      .then((data) => {
        if (data) {
          setUser(data);
          setName(data.name ?? '');
          setPhone(data.phone ?? '');
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const r = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, phone }),
    });
    const body = await r.json();
    if (r.ok) {
      setUser(body.data);
      setMessage('Profile saved.');
    } else setMessage(body.error || 'Could not save profile.');
  }

  if (loading) return <main className="page-shell"><div className="section">Loading…</div></main>;
  if (!user) return <main className="auth-page"><div className="auth-card"><span className="eyebrow">Freash Chiken · Since 1997</span><h1>Your account.</h1><p className="auth-sub">Sign in to manage your profile, saved addresses, wishlist and orders.</p><Link href="/login?next=/profile" className="btn btn-dark auth-submit"><LogIn size={16}/> Sign in</Link><p className="auth-footer">New customer? <Link href="/register?next=/profile" className="auth-link-button inline">Create an account</Link></p></div></main>;

  const cards = [
    ['/orders', Package, 'My orders', 'View orders and track deliveries.'],
    ['/addresses', MapPin, 'Addresses', 'Save and manage delivery locations.'],
    ['/wishlist', Heart, 'Wishlist', 'Keep your favourite cuts saved.'],
    ['/notifications', Bell, 'Notifications', 'Order and offer updates.'],
  ] as const;

  return <main className="page-shell"><div className="section"><span className="eyebrow">Your account</span><h2 style={{ fontSize: 38 }}>Welcome back, {user.name.split(' ')[0]}.</h2><p style={{ color: 'var(--muted)', fontSize: 13 }}>Your account keeps your orders, delivery details and preferences together.</p><div className="reviews" style={{ marginTop: 28 }}>{cards.map(([href, Icon, title, text]) => <Link className="review-card" href={href} key={href}><Icon color="var(--green)"/><h3 style={{ fontFamily: 'DM Sans', fontSize: 15 }}>{title}</h3><p>{text}</p><ArrowRight size={14}/></Link>)}</div><div className="admin-card" style={{ marginTop: 24, maxWidth: 760 }}><div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}><div className="brand-mark"><UserRound size={19}/></div><div><b>Profile details</b><span style={{ display: 'block', fontSize: 10, color: 'var(--muted)' }}>Member since {new Date(user.createdAt).toLocaleDateString('en-IN')}</span></div></div><form onSubmit={save} className="admin-form"><label style={{ fontSize: 10, color: 'var(--muted)' }}>Name<input className="field full" value={name} onChange={e => setName(e.target.value)} /></label><label style={{ fontSize: 10, color: 'var(--muted)' }}>Phone<input className="field full" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit phone" /></label><button className="admin-btn full">Save changes</button></form>{message && <p style={{ fontSize: 11, color: message === 'Profile saved.' ? 'var(--green)' : 'var(--red)', marginTop: 10 }}>{message}</p>}</div></div></main>;
}
