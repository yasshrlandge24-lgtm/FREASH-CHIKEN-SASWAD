import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import StoreHeader from '@/components/StoreHeader';
import Footer from '@/components/Footer';

export const metadata: Metadata = { title: 'Freash Chiken — Fresh Chicken, Clean Cuts', description: 'Fresh chicken, thoughtfully cut, hygienically packed and delivered cold.', metadataBase: new URL('http://localhost:3000') };

export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><StoreHeader/>{children}<Footer/></body></html>; }
