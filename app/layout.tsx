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
  title: 'Revlo - The Ultimate ERP & Business Management Solution',
  description: 'Revlo is a powerful, all-in-one ERP and POS system designed to streamline business operations globally. From inventory management to financial reporting, Revlo empowers businesses of all sizes with cutting-edge technology. Founded by Hamse Moalin Amiin. | Revlo waa nidaamka maamulka ganacsiga ee ugu casrisan, kaas oo isugu keenaya maamulka kaydka, xisaabaadka, iyo iibka hal meel. Ku habboon ganacsi kasta, meel kasta.',
  keywords: [
    'Revlo', 'Revlo ERP', 'Revlo App', 'ERP System', 'Business Management Software', 'POS System',
    'Accounting Software', 'Inventory Management', 'Hamse Moalin Amiin', 'Cloud ERP',
    'Ganacsi Maamul', 'Nidaamka Xisaabaadka', 'Software', 'Technology', 'Somali ERP',
    'Best ERP 2026', 'East Africa ERP', 'Global ERP Solution', 'Smart Business Tools',
    'Manufacturing ERP', 'Construction Management Software', 'Retail POS'
  ],
  authors: [{ name: 'Hamse Moalin Amiin', url: 'https://revlo.me' }],
  creator: 'Hamse Moalin Amiin',
  publisher: 'Revlo Inc.',
  metadataBase: new URL('https://revlo.me'),
  openGraph: {
    title: 'Revlo - Transform Your Business with Smart Management',
    description: 'Empowering businesses with seamless ERP & POS solutions. Built for efficiency, designed for growth. Founded by Hamse Moalin Amiin.',
    url: 'https://revlo.me',
    siteName: 'Revlo',
    images: [
      {
        url: 'https://revlo.me/about-hero.png', // Absolute URL for better social sharing
        width: 1200,
        height: 630,
        alt: 'Revlo Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revlo - Global ERP & Business Solution',
    description: 'The future of business management is here. Discover Revlo, founded by Hamse Moalin Amiin. Contact: hamsemoalin@gmail.com | +251 929 475 332',
    images: ['https://revlo.me/about-hero.png'],
  },
  icons: {
    icon: '/revlo-logo.png',
    shortcut: '/revlo-logo.png',
    apple: '/revlo-logo.png',
  },
  manifest: '/manifest.json',
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
  alternates: {
    languages: {
      'en-US': 'https://revlo.me/en',
      'so-SO': 'https://revlo.me/so',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Revlo',
  },
  verification: {
    google: 'google-site-verification-code', // Add verification code if available later
  },
  other: {
    "contact:email": "hamsemoalin@gmail.com",
    "contact:phone_number": "+251 929 475 332",
    "founder": "Hamse Moalin Amiin"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Revlo ERP",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Windows, macOS, Linux, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free Starter Plan available"
  },
  "description": "The ultimate AI-powered ERP and POS system for global business management. Features include inventory tracking, financial accounting, manufacturing, and project management.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1250"
  },
  "author": {
    "@type": "Person",
    "name": "Hamse Moalin Amiin",
    "url": "https://revlo.me",
    "jobTitle": "Founder & CEO",
    "sameAs": [
      "https://twitter.com/hamsemoalin",
      "https://linkedin.com/in/hamsemoalin"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Revlo Inc.",
    "logo": "https://revlo.me/revlo-logo.png",
    "sameAs": [
      "https://twitter.com/revlo_erp",
      "https://facebook.com/revlo_erp",
      "https://linkedin.com/company/revlo",
      "https://instagram.com/revlo_erp"
    ]
  },
  "sameAs": [
    "https://twitter.com/revlo_erp",
    "https://facebook.com/revlo_erp",
    "https://linkedin.com/company/revlo"
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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