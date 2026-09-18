import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import StoreHeader from '@/components/StoreHeader';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://freash-chiken-saswad.vercel.app'),

  title: 'FREASH CHIKEN CENTRE | Fresh Chicken in Saswad, Pune',

  description:
    'FREASH CHIKEN CENTRE in Saswad, Pune — fresh chicken, clean cuts and hygienically packed chicken. Serving Saswad since 1997.',

  alternates: {
    canonical: '/',
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: 'FREASH CHIKEN CENTRE | Fresh Chicken in Saswad, Pune',
    description:
      'Fresh chicken, clean cuts and hygienically packed chicken in Saswad, Pune. Serving since 1997.',
    url: 'https://freash-chiken-saswad.vercel.app/',
    siteName: 'FREASH CHIKEN CENTRE',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}