import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { verifyRazorpaySignature } from '@/lib/payments';
import { cancelAndReleaseOrder } from '@/lib/orderRecovery';
export async function POST(req:NextRequest){
  const session=getSession(); if(!session) return NextResponse.json({error:'Not authenticated'},{status:401});
  const body=await req.json() as {orderId:string;razorpayOrderId:string;razorpayPaymentId:string;razorpaySignature:string};
  const order=await db.order.findUnique({where:{id:body.orderId},include:{payment:true}});
  if(!order || order.userId!==session.userId) return NextResponse.json({error:'Order not found'},{status:404});
  if(!order.payment || order.payment.providerRef!==body.razorpayOrderId) return NextResponse.json({error:'Payment order mismatch'},{status:400});
  if(!verifyRazorpaySignature(body.razorpayOrderId,body.razorpayPaymentId,body.razorpaySignature)){ await cancelAndReleaseOrder(order.id,'Payment signature verification failed.'); await db.payment.update({where:{orderId:order.id},data:{status:'FAILED'}}); return NextResponse.json({error:'Invalid payment signature'},{status:400}); }
  const payment=await db.payment.update({where:{orderId:order.id},data:{status:'PAID',providerRef:body.razorpayPaymentId}});
  return NextResponse.json({data:{ok:true,payment}});
}
