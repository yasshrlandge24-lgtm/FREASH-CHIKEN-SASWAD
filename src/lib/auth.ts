import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { db } from './db';
import type { Role } from '@prisma/client';

const SESSION_COOKIE = 'cc_session';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is not set');
  }
  return secret || 'freash-chiken-local-dev-secret-change-before-production';
}

export type SessionPayload = { userId: string; role: Role };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE);
}

/** Reads and verifies the session cookie. Returns null if missing/invalid — callers decide how to react. */
export function getSession(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

/** Loads the full user record for the current session, or null if not logged in. */
export async function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}

/** Use at the top of any API route that requires a logged-in user. */
export function requireAuth(): SessionPayload | NextResponse {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return session;
}

/** Use at the top of any admin-only API route. */
export function requireAdmin(): SessionPayload | NextResponse {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}

/** Use at the top of any admin-only server-rendered page — redirects rather than returning JSON. */
export function requireAdminPageOrRedirect(): SessionPayload {
  const session = getSession();
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }
  return session as SessionPayload;
}

/** Narrows the union returned by requireAuth/requireAdmin down to a real session, for TypeScript. */
export function isSession(value: SessionPayload | NextResponse): value is SessionPayload {
  return !(value instanceof NextResponse);
}
