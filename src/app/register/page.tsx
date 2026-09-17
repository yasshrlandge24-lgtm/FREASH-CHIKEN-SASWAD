'use client';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterContent(){
 const router=useRouter(),sp=useSearchParams(),next=sp.get('next')||'/';
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false);
 async function create(e:FormEvent){e.preventDefault();setError(null);setLoading(true);try{const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({name,email,phone,password})});const b=await r.json();if(!r.ok){setError(typeof b.error==='string'?b.error:'Please check your details and try again.');return;}router.push(next);router.refresh();}catch{setError('Something went wrong. Please try again.');}finally{setLoading(false)}}
 return <main className="auth-page"><div className="auth-card"><span className="eyebrow">Freash Chiken · Since 1997</span><h1>Create your account.</h1><p className="auth-sub">Use your mobile number and password to sign in. Email is used only for password recovery.</p><form onSubmit={create} className="auth-form"><label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" required/></label><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></label><label>Mobile number<input inputMode="numeric" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="9876543210" autoComplete="tel" required/></label><label>Create password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required/></label>{error&&<p className="auth-error">{error}</p>}<button className="btn btn-dark auth-submit" disabled={loading}>{loading?'Creating account…':'Create account & sign in'}</button></form><p className="auth-footer">Already have an account? <button type="button" className="auth-link-button inline" onClick={()=>router.push(`/login?next=${encodeURIComponent(next)}`)}>Sign in</button></p></div></main>
}

export default function RegisterPage(){
 return <Suspense fallback={<main className="auth-page"><div className="auth-card"><p>Loading...</p></div></main>}><RegisterContent /></Suspense>
}
