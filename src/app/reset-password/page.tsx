'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ResetPasswordContent(){
 const router=useRouter(),sp=useSearchParams(),token=sp.get('token')||'';
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false),[loading,setLoading]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');if(password!==confirm){setError('Passwords do not match.');return}setLoading(true);try{const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})});const b=await r.json();if(!r.ok){setError(b.error||'Could not reset password.');return}setDone(true)}catch{setError('Something went wrong. Please try again.')}finally{setLoading(false)}}
 return <main className="auth-page"><div className="auth-card"><span className="eyebrow">Freash Chiken · Account recovery</span><h1>Set a new password.</h1>{done?<><p className="auth-sub">Your password has been updated successfully.</p><button className="btn btn-dark auth-submit" onClick={()=>router.push('/login')}>Sign in</button></>:<form onSubmit={submit} className="auth-form"><label>New password<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" required/></label><label>Confirm password<input type="password" minLength={8} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" required/></label>{error&&<p className="auth-error">{error}</p>}<button className="btn btn-dark auth-submit" disabled={loading||!token}>{loading?'Updating…':'Update password'}</button></form>}</div></main>
}

export default function ResetPasswordPage(){
 return <Suspense fallback={<main className="auth-page"><div className="auth-card"><p>Loading...</p></div></main>}><ResetPasswordContent /></Suspense>
}
