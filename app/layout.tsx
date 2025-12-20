import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { WalletProvider } from './contexts/WalletContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from './contexts/ToastContext';
import { NetworkErrorBanner } from './components/NetworkErrorBanner';
import { NetworkDiagnostics } from './components/NetworkDiagnostics';

// Optimize fonts
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
});

export const metadata: Metadata = {
  title: "TripGo - Pesan Tiket Pesawat & Kereta Api Online",
  description: "Booking tiket pesawat & kereta api online dengan harga promo. Garansi harga terbaik, pembayaran aman, dan dukungan 24/7.",
  keywords: ["tiket pesawat", "tiket kereta", "booking tiket online", "travel murah"],
  
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tripgo.com',
    siteName: 'TripGo',
    title: 'TripGo - Pesan Tiket Pesawat & Kereta Api Online',
    description: 'Booking tiket pesawat & kereta api online dengan harga promo.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A58CA',
};

interface RootLayoutProps {
  children: React.ReactNode;
  modal?: React.ReactNode;
}

export default function RootLayout({ children, modal }: Readonly<RootLayoutProps>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <NetworkErrorBanner />
              <NetworkDiagnostics />
              <WalletProvider>
                <Navbar />
                <main>
                  {children}
                </main>
                <Footer />
                {modal}
              </WalletProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}