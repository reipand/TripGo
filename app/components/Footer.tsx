import React from 'react';
import Link from 'next/link';

// --- Kumpulan Ikon SVG untuk Footer ---

const FacebookIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.494v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-.424.727-.666 1.581-.666 2.477 0 1.921.977 3.614 2.468 4.611-.9-.028-1.747-.276-2.488-.688v.065c0 2.684 1.908 4.922 4.437 5.426-.464.126-.95.194-1.448.194-.356 0-.702-.034-1.043-.099.704 2.2 2.748 3.805 5.174 3.85-1.893 1.483-4.288 2.368-6.885 2.368-.447 0-.89-.026-1.327-.077 2.449 1.568 5.358 2.488 8.492 2.488 10.188 0 15.777-8.448 15.777-15.777 0-.24-.006-.478-.018-.715.983-.71 1.832-1.597 2.516-2.62z" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.012 3.584-.07 4.85c-.148 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.85s.012-3.584.07-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.85-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.441-.645 1.441-1.44-.645-1.44-1.441-1.44z" />
    </svg>
);

const Footer = () => {
    return (
        <footer className="bg-[#0548AD] text-white">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Kolom 1: Tentang TripGo */}
                    <div className="md:col-span-2 lg:col-span-1">
                        <h2 className="text-2xl font-bold mb-4">TripGo</h2>
                        <p className="text-gray-300">
                            Satu aplikasi untuk segala kebutuhan perjalananmu. Pesan tiket pesawat, kereta api, dan aktivitas seru dengan mudah.
                        </p>
                    </div>

                    {/* Kolom 2: Produk */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Produk</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><Link href="/pesawat" className="hover:text-white">Pesawat</Link></li>
                            <li><Link href="/kereta" className="hover:text-white">Kereta Api</Link></li>
                            <li><Link href="/todo" className="hover:text-white">To Do</Link></li>
                        </ul>
                    </div>

                    {/* Kolom 3: Lainnya */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">Lainnya</h3>
                        <ul className="space-y-2 text-gray-300">
                            <li><Link href="/pusat-bantuan" className="hover:text-white">Pusat Bantuan</Link></li>
                            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                            <li><Link href="/promo" className="hover:text-white">Promo</Link></li>
                            <li><Link href="/tentang-kami" className="hover:text-white">Tentang Kami</Link></li>
                        </ul>
                    </div>
                    
                    {/* Kolom 4: Media Sosial */}
                    <div>
                         <h3 className="font-semibold text-lg mb-4">Ikuti Kami</h3>
                         <div className="flex space-x-4">
                            <a href="#" aria-label="Facebook" className="text-gray-300 hover:text-white"><FacebookIcon /></a>
                            <a href="#" aria-label="Twitter" className="text-gray-300 hover:text-white"><TwitterIcon /></a>
                            <a href="#" aria-label="Instagram" className="text-gray-300 hover:text-white"><InstagramIcon /></a>
                         </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/20 pt-8 text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()} TripGo. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
