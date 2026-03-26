import './globals.css'
import type { Metadata } from 'next'
import { Nunito, Pacifico } from 'next/font/google'

// Font bulat empuk untuk teks (Persis deskripsi Ladang Lima)
const nunito = Nunito({ 
  subsets: ['latin'], 
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800', '900'] 
})

// Font kuas organik untuk Logo (Persis logo Ladang Lima)
const pacifico = Pacifico({ 
  weight: '400', 
  subsets: ['latin'], 
  variable: '--font-pacifico' 
})

export const metadata: Metadata = {
  title: 'Ciburial Eco-Digital Village',
  description: 'Merawat akar, menumbuhkan harapan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${nunito.variable} ${pacifico.variable} font-sans bg-[#FDFBF7] text-[#3E322D] antialiased`}>
        {children}
      </body>
    </html>
  )
}
