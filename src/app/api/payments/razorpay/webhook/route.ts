import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRazorpayWebhook } from '@/lib/payments';
import { cancelAndReleaseOrder } from '@/lib/orderRecovery';
export async function POST(req:NextRequest){
  const raw=await req.text(); const sig=req.headers.get('x-razorpay-signature')||'';
  if(!verifyRazorpayWebhook(raw,sig)) return NextResponse.json({error:'Invalid webhook signature'},{status:400});
  const event=JSON.parse(raw) as any;
  const entity=event?.payload?.payment?.entity;
  const orderId=entity?.notes?.orderId || entity?.order_id && (await db.payment.findFirst({where:{providerRef:entity.order_id}}))?.orderId;
  if(!orderId) return NextResponse.json({ok:true});
  const status=event.event==='payment.captured' ? 'PAID' : event.event==='payment.failed' ? 'FAILED' : null;
  if(status === 'FAILED'){ await db.payment.update({where:{orderId},data:{status:'FAILED',providerRef:entity?.id || undefined}}); await cancelAndReleaseOrder(orderId,'Razorpay payment failed.'); } else if(status === 'PAID') await db.payment.update({where:{orderId},data:{status:'PAID',providerRef:entity?.id || undefined}});
  return NextResponse.json({ok:true});
}
