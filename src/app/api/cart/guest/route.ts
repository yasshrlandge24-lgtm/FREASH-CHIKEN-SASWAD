import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { priceCartItems, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from '@/lib/pricing';
import { z } from 'zod';
const schema=z.object({items:z.array(z.object({variantId:z.string().min(1),quantity:z.number().int().min(1).max(20)})).max(50)});
export async function POST(req:NextRequest){
 const parsed=schema.safeParse(await req.json()); if(!parsed.success)return NextResponse.json({error:'Invalid guest cart.'},{status:400});
 const lines=await priceCartItems(parsed.data.items); const subtotal=lines.reduce((s,l)=>s+l.lineTotal,0); const deliveryFee=subtotal>=FREE_DELIVERY_THRESHOLD?0:STANDARD_DELIVERY_FEE;
 return NextResponse.json({data:{items:lines.map(l=>({...l,cartItemId:`guest:${l.variantId}`})),subtotal,deliveryFee,freeDeliveryThreshold:FREE_DELIVERY_THRESHOLD}});
}
