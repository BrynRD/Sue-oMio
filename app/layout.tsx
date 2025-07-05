import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { CarritoProvider } from '@/contexts/CarritoContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { MonedaProvider } from '@/contexts/MonedaContext'
import CarritoSidebar from '@/components/CarritoSidebar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sueño Mío - Moda Consciente y Atemporal',
  description: 'Descubre prendas atemporales diseñadas para durar. Moda consciente con materiales de la más alta calidad.',
  keywords: 'moda, ropa, Perú, sostenible, atemporal, calidad',
  authors: [{ name: 'Sueño Mío' }],
  creator: 'Sueño Mío',
  publisher: 'Sueño Mío',
  openGraph: {
    title: 'Sueño Mío - Moda Consciente',
    description: 'Prendas atemporales de alta calidad',
    siteName: 'Sueño Mío',
    locale: 'es_PE',
    type: 'website',
  },
}

export default function RootLayout({ 
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <MonedaProvider>
            <WishlistProvider>
              <CarritoProvider>
                {children}
                <CarritoSidebar />
                <Toaster />
              </CarritoProvider>
            </WishlistProvider>
          </MonedaProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
