import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth,isSession } from '@/lib/auth';
export async function GET(){const s=requireAuth();if(!isSession(s))return s;const now=new Date();const coupons=await db.coupon.findMany({where:{active:true,OR:[{startsAt:null},{startsAt:{lte:now}}],AND:[{OR:[{endsAt:null},{endsAt:{gte:now}}]}]},orderBy:{createdAt:'desc'}});return NextResponse.json({data:coupons});}
