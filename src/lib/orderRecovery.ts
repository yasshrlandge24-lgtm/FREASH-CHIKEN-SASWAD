import { db } from './db';

export async function cancelAndReleaseOrder(orderId:string, reason:string){
  return db.$transaction(async tx=>{
    const order=await tx.order.findUnique({where:{id:orderId},include:{items:true}});
    if(!order) return null;
    if(order.status==='CANCELLED') return order;
    for(const item of order.items){
      await tx.inventory.update({where:{variantId:item.variantId},data:{availableStock:{increment:item.quantity},soldQuantity:{decrement:item.quantity}}});
    }
    if(order.deliverySlotId) await tx.deliverySlot.update({where:{id:order.deliverySlotId},data:{bookedCount:{decrement:1}}});
    return tx.order.update({where:{id:orderId},data:{status:'CANCELLED',statusHistory:{create:{status:'CANCELLED',note:reason}}}});
  });
}
