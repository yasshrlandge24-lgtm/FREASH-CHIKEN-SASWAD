import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, ShieldCheck, Snowflake, Truck, Phone, Mail, Clock3 } from 'lucide-react';

const BUSINESS_PHONE = '+91 87666 52688';
const WHATSAPP_NUMBER = '918766652688';
const BUSINESS_EMAIL = 'pranavjagtap863@gmail.com';

export default function Footer(){
  const whatsappText = encodeURIComponent('Hello Freash Chiken Centre, I want to place an order.');
  return <footer className="footer">
    <div className="footer-heritage"><div><span className="heritage-seal">1997</span><div><b>Serving Saswad &amp; Pune since 1997</b><small>A local chicken centre built on familiar service, careful preparation and dependable quality.</small></div></div><span className="heritage-note">LOCAL · TRUSTED · ESTABLISHED</span></div>
    <div className="footer-trust"><div><ShieldCheck/><span><b>Quality checked</b><small>Every batch</small></span></div><div><Snowflake/><span><b>Kept chilled</b><small>Cold-chain delivery</small></span></div><div><Truck/><span><b>Reliable delivery</b><small>Chosen time slot</small></span></div><div><Clock3/><span><b>Since 1997</b><small>Serving locally</small></span></div></div>
    <div className="footer-main">
      <div className="footer-brand">
        <div className="brand footer-brand-logo"><span className="brand-logo-wrap"><Image src="/brand/logo.png" alt="Freash Chiken Centre logo" width={58} height={58}/></span><span><strong>FREASH CHIKEN</strong><small>CHICKEN &amp; MORE · SINCE 1997</small></span></div>
        <p>Freash Chiken Centre, Saswad. Fresh chicken, thoughtfully cut and packed for your kitchen, with the personal service of a local store.</p>
        <div className="footer-contact">
          <a href={`tel:${BUSINESS_PHONE.replace(/\s/g,'')}`}><Phone size={15}/><span><b>Call to order</b><small>{BUSINESS_PHONE}</small></span></a>
          <a href={`mailto:${BUSINESS_EMAIL}`}><Mail size={15}/><span><b>Email</b><small>{BUSINESS_EMAIL}</small></span></a>
        </div>
        <div className="socials"><a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle/></a></div>
      </div>
      <div><h4>Shop</h4><Link href="/shop">All chicken</Link><Link href="/shop?category=boneless">Boneless</Link><Link href="/shop?category=curry">Curry cuts</Link><Link href="/shop?category=combo">Combos</Link></div>
      <div><h4>Company</h4><Link href="/about">Our story</Link><Link href="/quality">Sourcing</Link><Link href="/quality">Quality &amp; hygiene</Link><Link href="/faq">FAQ</Link></div>
      <div><h4>Help</h4><Link href="/profile">My account</Link><Link href="/orders">Orders</Link><Link href="/addresses">Addresses</Link><Link href="/notifications">Notifications</Link></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Freash Chiken Centre. All rights reserved.</span><span><b>Since 1997</b> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> · <Link href="/contact">Support</Link></span></div>
  </footer>
}
