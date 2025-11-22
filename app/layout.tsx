import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from './contexts/WalletContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from './contexts/ToastContext';

// Optimized font loading with fallback
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: "TripGo - Pesan Tiket Pesawat & Kereta dengan Mudah",
    template: "%s | TripGo"
  },
  description: "Platform pemesanan tiket pesawat dan kereta terpercaya. Dapatkan harga terbaik dengan pengalaman booking yang mudah dan aman.",
  keywords: ["tiket pesawat", "tiket kereta", "travel", "booking", "penerbangan", "perjalanan"],
  authors: [{ name: "TripGo Team" }],
  creator: "TripGo",
  publisher: "TripGo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tripgo.com'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tripgo.com',
    title: 'TripGo - Pesan Tiket Pesawat & Kereta dengan Mudah',
    description: 'Platform pemesanan tiket pesawat dan kereta terpercaya. Dapatkan harga terbaik dengan pengalaman booking yang mudah dan aman.',
    siteName: 'TripGo',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TripGo - Platform Pemesanan Tiket',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripGo - Pesan Tiket Pesawat & Kereta dengan Mudah',
    description: 'Platform pemesanan tiket pesawat dan kereta terpercaya.',
    images: ['/images/og-image.jpg'],
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
};

// Viewport export for Next.js 13+ (App Router)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A58CA',
};

interface RootLayoutProps {
  children: React.ReactNode;
  modal?: React.ReactNode;
}

export default function RootLayout({
  children,
  modal,
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//api.tripgo.com" />
      </head>
      <body className={`font-sans bg-gray-50 antialiased`}>
        {/* PERBAIKAN: ToastProvider harus berada di LUAR WalletProvider */}
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <WalletProvider>
                <div className="flex flex-col min-h-screen">
                  {/* Skip to main content for accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
                  >
                    Loncat ke konten utama
                  </a>
                  
                  <Navbar />
                  
                  <main 
                    id="main-content"
                    className="flex-1 relative"
                  >
                    {children}
                  </main>
                  
                  <Footer />
                </div>
                
                {/* Modal slot for parallel routes */}
                {modal}
                
                {/* Global background elements */}
                <div className="fixed inset-0 -z-10 overflow-hidden">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow delay-1000"></div>
                </div>
              </WalletProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}