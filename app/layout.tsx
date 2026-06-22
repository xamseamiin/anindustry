import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import GoogleTranslate from '../components/GoogleTranslate';
import SmoothScroll from '@/components/SmoothScroll';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import ImpersonateBanner from '@/components/ImpersonateBanner';
import Script from 'next/script';
import PWAInstallBanner from '@/components/PWAInstallBanner';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AN-Industory | Warshad Caagadaha Caaga Ah - Jigjiga',
  description: 'AN-Industory waa warshad soo saarta caagadaha tayada sare leh ee lagu shubto biyaha, cabitaannada, iyo dareereyaasha kale ee ku taal Jigjiga. Fresh plastic bottles 1L, 0.5L (500ml).',
  keywords: [
    'AN-Industory', 'Caagado', 'Plastic Bottles', 'Warshad', 'Factory',
    'Jigjiga', 'Plastic Containers', 'Somali Plastic', 'Caagadaha Biyaha',
    'Ethiopia Plastic', 'East Africa Bottles', 'Premium Plastic',
    'AN Industory Bottles', 'Hamse Moalin Amiin'
  ],
  authors: [{ name: 'Hamse Moalin Amiin' }],
  creator: 'Hamse Moalin Amiin',
  publisher: 'AN-Industory',
  metadataBase: new URL('https://an-industory.com'),
  openGraph: {
    title: 'AN-Industory | Caagadaha Caaga Ah ee Tayada Sare Leh',
    description: 'Warshad soo saarta caagadaha tayada sare leh ee lagu shubto biyaha, cabitaannada, iyo dareereyaasha kale ee ku taal Jigjiga.',
    url: 'https://an-industory.com',
    siteName: 'AN-Industory',
    images: [
      {
        url: 'https://an-industory.com/bottle.png',
        width: 1200,
        height: 630,
        alt: 'AN-Industory Caagadaha',
      },
    ],
    locale: 'so_SO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AN-Industory | Warshad Caagadaha Caaga Ah',
    description: 'Caagadaha tayada sare leh ee lagu shubto biyaha, cabitaannada, iyo dareereyaasha kale. Jigjiga, Ethiopia.',
    images: ['https://an-industory.com/bottle.png'],
  },
  icons: {
    icon: '/an-industory-logo.png',
    shortcut: '/an-industory-logo.png',
    apple: '/an-industory-logo.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    "contact:email": "info@an-industory.com",
    "contact:phone_number": "+251 929 475 332",
    "founder": "Hamse Moalin Amiin"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "AN-Industory",
  "description": "Warshad soo saarta caagadaha tayada sare leh ee lagu shubto biyaha, cabitaannada, iyo dareereyaasha kale ee ku taal Jigjiga.",
  "image": "https://an-industory.com/an-industory-logo.png",
  "telephone": "+251929475332",
  "email": "info@an-industory.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Jigjiga",
    "addressRegion": "Somali Region",
    "addressCountry": "Ethiopia"
  },
  "founder": {
    "@type": "Person",
    "name": "Hamse Moalin Amiin",
    "jobTitle": "Founder & CEO"
  },
  "openingHours": "Mo-Sa 06:00-18:00",
  "priceRange": "$$"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="so">
      <body className={jakarta.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll />
        <GoogleTranslate />
        <Providers>
          <ImpersonateBanner />
          <Suspense fallback={null}>
            <AnalyticsProvider />
          </Suspense>
          {children}
        </Providers>
        <PWAInstallBanner />
        <Script id="pwa-register" src="/pwa-register.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}