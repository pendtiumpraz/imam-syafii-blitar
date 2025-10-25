'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import Image from 'next/image';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const { config, loading } = useSiteConfig();

  // Group footer links by category
  const groupedLinks = config.footerLinks.reduce((acc, link) => {
    const category = link.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {} as Record<string, typeof config.footerLinks>);

  const categories = Object.keys(groupedLinks);

  // Build social media array from config
  const socialMedia = [
    config.facebook && { name: 'Facebook', icon: 'F', url: config.facebook },
    config.instagram && { name: 'Instagram', icon: 'I', url: config.instagram },
    config.youtube && { name: 'YouTube', icon: 'Y', url: config.youtube },
    config.twitter && { name: 'Twitter', icon: 'X', url: config.twitter },
    config.linkedIn && { name: 'LinkedIn', icon: 'L', url: config.linkedIn },
  ].filter(Boolean) as Array<{ name: string; icon: string; url: string }>;

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* About Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              {config.logoWhite ? (
                <Image
                  src={config.logoWhite}
                  alt={config.siteName}
                  width={48}
                  height={48}
                  className="rounded-lg object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">P</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-xl">{config.siteName}</h3>
                <p className="text-sm text-gray-300">Blitar, Jawa Timur</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              {config.footerAbout || config.siteDescription}
            </p>

            {/* Contact Info */}
            <div className="space-y-2">
              {config.address && (
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{config.address}</p>
                </div>
              )}
              {config.contactPhone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{config.contactPhone}</p>
                </div>
              )}
              {config.contactEmail && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{config.contactEmail}</p>
                </div>
              )}
              {config.contactWhatsapp && (
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{config.contactWhatsapp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Links Sections - Dynamic */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 lg:col-span-3">
            {categories.slice(0, 4).map((category) => (
              <div key={category}>
                <h4 className="font-semibold text-green-400 mb-3">{category}</h4>
                <ul className="space-y-2">
                  {groupedLinks[category].map((link) => (
                    <li key={link.id}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-300 hover:text-green-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Social Media */}
            {socialMedia.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Ikuti Kami:</span>
                {socialMedia.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gray-700 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <span className="text-sm font-bold">{social.icon}</span>
                  </motion.a>
                ))}
              </div>
            )}

            {/* Newsletter */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm text-gray-400">Berlangganan Info:</span>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email Anda"
                  className="px-4 py-2 bg-gray-700 text-white rounded-l-lg focus:outline-none focus:bg-gray-600 text-sm w-48"
                />
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-r-lg transition-colors text-sm">
                  Daftar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} {config.siteName}. Hak Cipta Dilindungi.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link href="/privacy" className="hover:text-green-400 transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/terms" className="hover:text-green-400 transition-colors">
                Syarat & Ketentuan
              </Link>
              <Link href="/sitemap" className="hover:text-green-400 transition-colors">
                Peta Situs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}