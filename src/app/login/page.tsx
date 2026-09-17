'use client';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent(){
 const router=useRouter(),sp=useSearchParams(),next=sp.get('next')||'/';
 const [identifier,setIdentifier]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false);
 async function passwordLogin(e:FormEvent){e.preventDefault();setLoading(true);setError(null);try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({identifier,password})});const b=await r.json();if(!r.ok){setError(b.error||'Login failed');return;}router.push(next);router.refresh();}catch{setError('Something went wrong. Please try again.');}finally{setLoading(false)}}
 return <main className="auth-page"><div className="auth-card"><span className="eyebrow">Freash Chiken · Since 1997</span><h1>Welcome back.</h1><p className="auth-sub">Sign in with your mobile number or email and password.</p><form onSubmit={passwordLogin} className="auth-form"><label>Phone number or email<input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="9876543210 or you@example.com" autoComplete="username" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required/></label>{error&&<p className="auth-error">{error}</p>}<button className="btn btn-dark auth-submit" disabled={loading}>{loading?'Signing in…':'Sign in'}</button><button type="button" className="auth-link-button" onClick={()=>router.push('/forgot-password')}>Forgot password?</button></form><p className="auth-footer">New customer? <button type="button" className="auth-link-button inline" onClick={()=>router.push(`/register?next=${encodeURIComponent(next)}`)}>Create an account</button></p></div></main>
}

export default function LoginPage(){
 return <Suspense fallback={<main className="auth-page"><div className="auth-card"><p>Loading...</p></div></main>}><LoginContent /></Suspense>
}
