import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isSession } from '@/lib/auth';
import { z } from 'zod';
const profileSchema=z.object({name:z.string().min(2).max(80),phone:z.string().regex(/^[0-9]{10}$/).optional().or(z.literal(''))});
export async function GET(){const s=requireAuth();if(!isSession(s))return s;const u=await db.user.findUnique({where:{id:s.userId},select:{id:true,name:true,email:true,phone:true,role:true,createdAt:true}});return NextResponse.json({data:u});}
export async function PATCH(req:NextRequest){const s=requireAuth();if(!isSession(s))return s;const p=profileSchema.safeParse(await req.json());if(!p.success)return NextResponse.json({error:p.error.flatten()},{status:400});try{const u=await db.user.update({where:{id:s.userId},data:{name:p.data.name,phone:p.data.phone||null},select:{id:true,name:true,email:true,phone:true,role:true,createdAt:true}});return NextResponse.json({data:u});}catch{return NextResponse.json({error:'That phone number may already be in use.'},{status:409})}}
