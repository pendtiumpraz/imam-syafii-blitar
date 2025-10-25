'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  HeartIcon,
  PhotoIcon,
  PlayCircleIcon,
  BookOpenIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  UserIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import Image from 'next/image';

export default function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { config, loading } = useSiteConfig();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  // Icon mapping for navbar items
  const iconMap: { [key: string]: any } = {
    'beranda': HomeIcon,
    'home': HomeIcon,
    'donasi': HeartIcon,
    'donate': HeartIcon,
    'galeri': PhotoIcon,
    'gallery': PhotoIcon,
    'kajian': PlayCircleIcon,
    'video': PlayCircleIcon,
    'perpustakaan': BookOpenIcon,
    'library': BookOpenIcon,
    'tanya': ChatBubbleBottomCenterTextIcon,
    'ppdb': AcademicCapIcon,
  };

  const getIcon = (label: string) => {
    const key = label.toLowerCase().split(' ')[0];
    return iconMap[key] || null;
  };

  // Transform config navbarItems to match the expected format
  const navItems = config.navbarItems.map((item) => ({
    label: item.label,
    href: item.children ? '#' : item.href,
    icon: getIcon(item.label),
    dropdown: item.children?.map((child) => ({
      label: child.label,
      href: child.href,
    })),
  }));

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <>
      <nav 
        className={`bg-white/95 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'shadow-lg' : 'shadow-md'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                {config.logo ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src={config.logo}
                      alt={config.siteName}
                      width={40}
                      height={40}
                      className="rounded-lg shadow-md object-contain"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md"
                  >
                    <span className="text-white font-bold text-xl">P</span>
                  </motion.div>
                )}
                <div className="hidden sm:block">
                  <h1 className="font-bold text-gray-800 text-lg">{config.siteName}</h1>
                  <p className="text-xs text-gray-500">Blitar, Jawa Timur</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div key={item.label} className="relative">
                  {item.dropdown ? (
                    <div className="relative group">
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                          item.dropdown.some(sub => isActive(sub.href))
                            ? 'text-green-600 bg-green-50'
                            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {item.icon && <item.icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                        <ChevronDownIcon 
                          className={`w-4 h-4 transition-transform duration-200 ${
                            openDropdown === item.label ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {openDropdown === item.label && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                          >
                            {item.dropdown.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`block px-4 py-3 transition-all duration-200 ${
                                  isActive(subItem.href)
                                    ? 'bg-green-50 text-green-600 border-l-4 border-green-500'
                                    : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                                }`}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive(item.href!)
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Portal Wali Button */}
              <Link href="/parent-portal/dashboard" className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 border border-green-500 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-all duration-200"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden xl:inline">Portal Wali</span>
                </motion.button>
              </Link>

              {/* Login Button */}
              <Link href="/auth/signin" className="hidden md:block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Masuk
                </motion.button>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6 text-gray-700" />
                ) : (
                  <Bars3Icon className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white border-t border-gray-100"
            >
              <div className="container mx-auto px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <div key={item.label}>
                    {item.dropdown ? (
                      <div>
                        <button
                          onClick={() => toggleDropdown(item.label)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                            item.dropdown.some(sub => isActive(sub.href))
                              ? 'text-green-600 bg-green-50'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {item.icon && <item.icon className="w-5 h-5" />}
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronDownIcon 
                            className={`w-4 h-4 transition-transform duration-200 ${
                              openDropdown === item.label ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                        
                        <AnimatePresence>
                          {openDropdown === item.label && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="ml-4 mt-2 space-y-1"
                            >
                              {item.dropdown.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className={`block px-4 py-2 rounded-lg transition-all duration-200 ${
                                    isActive(subItem.href)
                                      ? 'bg-green-50 text-green-600'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  {subItem.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.href!}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive(item.href!)
                            ? 'text-green-600 bg-green-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
                
                {/* Mobile Portal & Login */}
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                  <Link href="/parent-portal/dashboard" className="block">
                    <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-green-500 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-all duration-200">
                      <UserIcon className="w-5 h-5" />
                      <span>Portal Wali Santri</span>
                    </button>
                  </Link>
                  
                  <Link href="/auth/signin" className="block">
                    <button className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-md">
                      Masuk / Login Admin
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  );
}