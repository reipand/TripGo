<<<<<<< HEAD
import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from './contexts/WalletContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from './contexts/ToastContext';

// Optimized font loading with subset and preload
const inter = Inter({ 
  subsets: ["latin", "latin-ext"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "TripGo - Pesan Tiket Pesawat & Kereta Api Online",
    template: "%s | TripGo - Booking Tiket Travel Terpercaya"
  },
  description: "Booking tiket pesawat & kereta api online dengan harga promo. Garansi harga terbaik, pembayaran aman, dan dukungan customer service 24/7. Pesan sekarang!",
  keywords: ["tiket pesawat", "tiket kereta", "booking tiket online", "travel murah", "penerbangan domestik", "kereta api indonesia", "promo tiket", "tripgo"],
  authors: [{ name: "TripGo Team" }],
  creator: "TripGo Indonesia",
  publisher: "PT. TripGo Digital Indonesia",
  category: "Travel & Tourism",
  classification: "Online Travel Agency",
  
  // Enhanced metadata
  applicationName: "TripGo",
  referrer: "origin-when-cross-origin",
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
  
  // Verification untuk search engines
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
  
  // Alternates untuk multi-language (future proof)
  alternates: {
    canonical: "https://tripgo.com",
    languages: {
      'id-ID': 'https://tripgo.com',
    },
  },
  
  // Open Graph dengan data yang lebih lengkap
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tripgo.com',
    siteName: 'TripGo - Platform Travel Terpercaya',
    title: 'TripGo - Pesan Tiket Pesawat & Kereta Api Online',
    description: 'Booking tiket pesawat & kereta api online dengan harga promo. Garansi harga terbaik dan pembayaran aman.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TripGo - Platform Booking Tiket Pesawat dan Kereta Api',
        type: 'image/jpeg',
      },
    ],
    emails: ['support@tripgo.com'],
    phoneNumbers: ['+62-21-1234-5678'],
  },
  
  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: 'TripGo - Booking Tiket Travel Online',
    description: 'Platform pemesanan tiket pesawat & kereta terpercaya di Indonesia',
    creator: '@tripgo_id',
    site: '@tripgo_id',
    images: ['/images/og-image.jpg'],
  },
  
  // App Links untuk mobile deep linking
  appLinks: {
    web: {
      url: 'https://tripgo.com',
      should_fallback: false,
    },
  },
  
  // Format detection
  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: false,
    url: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A58CA' },
    { media: '(prefers-color-scheme: dark)', color: '#1E40AF' },
  ],
  colorScheme: 'light dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
  modal?: React.ReactNode;
}

export default function RootLayout({ children, modal }: Readonly<RootLayoutProps>) {
  return (
    <html 
      lang="id" 
      className={`${inter.variable} ${poppins.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.tripgo.com" />
        
        {/* Preload critical images */}
        <link rel="preload" href="/images/hero-background.jpg" as="image" type="image/jpeg" />
        
        {/* Favicon dan App Icons modern */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0A58CA" />
        
        {/* DNS prefetch untuk performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//api.tripgo.com" />
        
        {/* Additional meta tags */}
        <meta name="apple-mobile-web-app-title" content="TripGo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Structured Data untuk SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TravelAgency",
              "name": "TripGo",
              "description": "Platform pemesanan tiket pesawat dan kereta api terpercaya di Indonesia",
              "url": "https://tripgo.com",
              "logo": "https://tripgo.com/logo.png",
              "telephone": "+62-21-1234-5678",
              "email": "support@tripgo.com",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Jakarta",
                "addressCountry": "ID"
              },
              "sameAs": [
                "https://facebook.com/tripgo",
                "https://twitter.com/tripgo_id",
                "https://instagram.com/tripgo_id"
              ]
            })
          }}
        />
      </head>
      <body className={`font-sans bg-gray-50 text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <WalletProvider>
                <div className="flex flex-col min-h-screen">
                  {/* Skip to main content for accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 transition-transform focus:scale-105"
                  >
                    Loncat ke konten utama
                  </a>
                  
                  <Navbar />
                  
                  <main 
                    id="main-content"
                    className="flex-1 relative focus:outline-none"
                    tabIndex={-1}
                  >
                    {children}
                  </main>
                  
                  <Footer />
                </div>
                
                {/* Modal slot for parallel routes */}
                {modal}
                
                {/* Global background elements dengan performance optimization */}
                <div 
                  className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
                  aria-hidden="true"
                >
                  <div 
                    className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"
                    style={{ 
                      animationDelay: '0s',
                      willChange: 'transform, opacity'
                    }}
                  ></div>
                  <div 
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"
                    style={{ 
                      animationDelay: '2000ms',
                      willChange: 'transform, opacity'
                    }}
                  ></div>
                </div>
              </WalletProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
=======
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar"; // Impor komponen Navbar
import Footer from "./components/Footer"; // Impor komponen Footer
import { AuthProvider } from "./contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripGo",
  description: "Pesan tiket pesawat dan kereta dengan mudah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
>>>>>>> 93a879e (fix fitur)
