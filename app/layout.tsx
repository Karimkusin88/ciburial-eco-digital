import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import FloatingWidgetWrapper from '@/components/FloatingWidgetWrapper'
import ThemeProvider, { themeInitScript } from '@/components/ui/ThemeProvider'
import CommandPalette from '@/components/ui/CommandPalette'
import BottomNav from '@/components/ui/BottomNav'

// Font utama untuk body text (dipakai di seluruh halaman)
const dmSans = DM_Sans({ 
  subsets: ['latin'], 
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

// Font serif untuk heading dekoratif
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  variable: '--font-cormorant',
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ciburial.my.id'),
  title: {
    default: 'Ciburial Eco-Digital Village',
    template: '%s | Ciburial Eco-Digital Village',
  },
  description: 'Inovasi Desa Mandiri Berbasis Kearifan Lokal dan Teknologi Masa Depan — Kp. Ciburial, Garut, Jawa Barat.',
  keywords: [
    'ciburial', 'ciburial garut', 'desa digital', 'eco village', 'garut',
    'smart village', 'kampung digital', 'desa mandiri', 'bank sampah',
    'posyandu digital', 'voting desa', 'transparansi dana desa',
  ],
  authors: [{ name: 'Irmas Al Husain Ciburial', url: 'https://www.ciburial.my.id' }],
  creator: 'Irmas Al Husain Ciburial',
  publisher: 'Ciburial Eco-Digital Village',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Ciburial Eco-Digital Village',
    description: 'Merawat akar, menumbuhkan harapan. Desa inovatif berbasis kearifan lokal dan teknologi masa depan.',
    url: 'https://www.ciburial.my.id',
    siteName: 'Ciburial Eco-Digital Village',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ciburial Eco-Digital Village — Kp. Ciburial, Garut',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ciburial Eco-Digital Village',
    description: 'Merawat akar, menumbuhkan harapan. Desa inovatif berbasis kearifan lokal dan teknologi masa depan.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://www.ciburial.my.id',
  },

}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Set data-theme BEFORE hydration to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${dmSans.variable} ${cormorant.variable} font-sans antialiased`} style={{ background: 'var(--cr)', color: 'var(--tp)' }}>
        <ThemeProvider>
          {children}
          <FloatingWidgetWrapper />
          <Suspense fallback={null}>
            <CommandPalette />
          </Suspense>
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
        </ThemeProvider>
        <Script 
          src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js"}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="beforeInteractive" 
        />
      </body>
    </html>
  )
}
