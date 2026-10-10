import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

const siteUrl = 'https://fireandrescueacademy.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fire and Rescue Academy | Professional Firefighter Training',
    template: '%s | Fire and Rescue Academy'
  },
  description: 'Interactive online training for firefighters and emergency-response professionals.',
  icons: { icon: '/assets/images/academy-favicon-clean.png' },
  openGraph: {
    type: 'website',
    siteName: 'Fire and Rescue Academy',
    images: ['/assets/images/home-hero-firefighters.png']
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/assets/images/home-hero-firefighters.png']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#142725'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/assets/css/readystation.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
