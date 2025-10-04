'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Book, Search, Download, Eye, Filter, Grid, List, 
  Calendar, User, FileText, BookOpen, Home, Heart,
  Phone, Menu, Star, Clock, Tag, ChevronRight,
  Bookmark, Share2, ChevronLeft, X, PlayCircle,
  Image, Users, GraduationCap, DollarSign, Volume2
} from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';

interface DigitalBook {
  id: string;
  title: string;
  author: string;
  category: string;
  type: 'pdf' | 'ebook' | 'audio';
  size: string;
  pages: number;
  year: number;
  downloads: number;
  views: number;
  rating: number;
  cover: string;
  description: string;
  tags: string[];
  language: string;
}

const categories = [
  'Semua', 'Al-Quran', 'Hadits', 'Fiqih', 'Akidah', 'Sirah', 
  'Bahasa Arab', 'Tajwid', 'Akhlak', 'Sejarah Islam', 'Tafsir'
];

const bookTypes = [
  { value: 'all', label: 'Semua Format' },
  { value: 'pdf', label: 'PDF' },
  { value: 'ebook', label: 'E-Book' },
  { value: 'audio', label: 'Audio Book' }
];

// Category labels mapping
const categoryLabels: { [key: string]: string } = {
  'fiqh': 'Fiqih',
  'hadith': 'Hadits',
  'tafsir': 'Tafsir',
  'akhlak': 'Akhlak',
  'sirah': 'Sirah Nabawiyah',
  'aqidah': 'Akidah',
};

export default function LibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBook, setSelectedBook] = useState<DigitalBook | null>(null);
  const [savedBooks, setSavedBooks] = useState<string[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<DigitalBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEbooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/ebooks');
        if (response.ok) {
          const data = await response.json();
          // Map ebook API data to DigitalBook interface
          const mappedBooks: DigitalBook[] = data.map((ebook: any) => {
            // Parse tags if they're stored as JSON string
            let parsedTags: string[] = [];
            if (ebook.tags) {
              if (typeof ebook.tags === 'string') {
                try {
                  parsedTags = JSON.parse(ebook.tags);
                } catch {
                  parsedTags = [ebook.tags];
                }
              } else if (Array.isArray(ebook.tags)) {
                parsedTags = ebook.tags;
              }
            }

            return {
              id: ebook.id,
              title: ebook.title,
              author: ebook.author,
              category: categoryLabels[ebook.category] || ebook.category,
              type: 'pdf' as const,
              size: ebook.fileSize ? `${(ebook.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A',
              pages: ebook.pageCount || 0,
              year: ebook.publishYear ? parseInt(ebook.publishYear) : new Date().getFullYear(),
              downloads: ebook.downloadCount || 0,
              views: ebook.viewCount || 0,
              rating: 4.5,
              cover: ebook.coverImage || '/api/placeholder/200/280',
              description: ebook.description || 'Deskripsi tidak tersedia',
              tags: parsedTags,
              language: ebook.language === 'id' ? 'Indonesia' : ebook.language || 'Indonesia',
            };
          });
          setLibraryBooks(mappedBooks);
        }
      } catch (error) {
        console.error('Error fetching ebooks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEbooks();
  }, []);

  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating'>('popular');

  const filteredBooks = libraryBooks
    .filter(book => {
      const matchesCategory = selectedCategory === 'Semua' || book.category === selectedCategory;
      const matchesType = selectedType === 'all' || book.type === selectedType;
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.downloads - a.downloads;
      if (sortBy === 'newest') return b.year - a.year;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const toggleSaveBook = (id: string) => {
    setSavedBooks(prev => 
      prev.includes(id) 
        ? prev.filter(bookId => bookId !== id)
        : [...prev, id]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'ebook': return <BookOpen className="w-4 h-4" />;
      case 'audio': return <Volume2 className="w-4 h-4" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'pdf': return 'bg-red-100 text-red-600';
      case 'ebook': return 'bg-blue-100 text-blue-600';
      case 'audio': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Perpustakaan Digital</h1>
            <p className="text-xl mb-8 text-indigo-100">
              Koleksi Kitab dan Buku Islam Digital
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Cari judul buku, penulis, atau topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-14 rounded-full bg-white/95 backdrop-blur text-gray-800 
                         placeholder:text-gray-500 shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{libraryBooks.length}+</div>
                <div className="text-indigo-100">Koleksi Buku</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">15K+</div>
                <div className="text-indigo-100">Total Download</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-indigo-100">Pembaca</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Filters and Controls */}
      <section className="sticky top-16 z-30 bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500"
              >
                {bookTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="popular">Terpopuler</option>
                <option value="newest">Terbaru</option>
                <option value="rating">Rating Tertinggi</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-indigo-100 text-indigo-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid/List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Memuat koleksi buku...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Book className="w-20 h-20 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada buku ditemukan</h3>
              <p className="text-gray-500 text-center max-w-md">
                {searchQuery
                  ? `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci lain.`
                  : 'Belum ada buku dalam kategori ini. Silakan pilih kategori lain.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-all"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img 
                      src={book.cover} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <button 
                          onClick={() => setSelectedBook(book)}
                          className="w-full py-2 bg-white/90 backdrop-blur text-gray-800 rounded-lg font-semibold hover:bg-white transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                    <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg flex items-center gap-1 ${getTypeColor(book.type)}`}>
                      {getTypeIcon(book.type)}
                      <span className="text-xs font-semibold uppercase">{book.type}</span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 text-xs mb-2">{book.author}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        {book.rating}
                      </span>
                      <span>•</span>
                      <span>{book.pages} hal</span>
                      <span>•</span>
                      <span>{book.size}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {formatNumber(book.downloads)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(book.views)}
                        </span>
                      </div>
                      <button 
                        onClick={() => toggleSaveBook(book.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          savedBooks.includes(book.id)
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative w-full md:w-32 aspect-[3/4] md:aspect-auto md:h-44 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={book.cover} 
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg flex items-center gap-1 ${getTypeColor(book.type)}`}>
                        {getTypeIcon(book.type)}
                        <span className="text-xs font-semibold uppercase">{book.type}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-xl mb-1 hover:text-indigo-600 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-gray-600 mb-2">{book.author}</p>
                        </div>
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm">
                          {book.category}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {book.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          {book.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {book.pages} halaman
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {book.year}
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {book.language}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {formatNumber(book.downloads)} unduhan
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(book.views)} dibaca
                          </span>
                          <span>{book.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleSaveBook(book.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              savedBooks.includes(book.id)
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <Bookmark className="w-5 h-5" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setSelectedBook(book)}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {book.tags.slice(0, 4).map((tag) => (
                          <span 
                            key={tag}
                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Book Detail Modal */}
      {selectedBook && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBook(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Detail Buku</h2>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 mb-4">
                    <img 
                      src={selectedBook.cover} 
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-4 right-4 px-3 py-2 rounded-lg flex items-center gap-2 ${getTypeColor(selectedBook.type)}`}>
                      {getTypeIcon(selectedBook.type)}
                      <span className="text-sm font-semibold uppercase">{selectedBook.type}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                      <Download className="w-5 h-5" />
                      <span>Download ({selectedBook.size})</span>
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Eye className="w-5 h-5" />
                      <span>Baca Online</span>
                    </button>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold mb-2">{selectedBook.title}</h2>
                  <p className="text-lg text-gray-600 mb-4">{selectedBook.author}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${
                            i < Math.floor(selectedBook.rating) 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                      <span className="ml-2 text-gray-600">({selectedBook.rating})</span>
                    </div>
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      {selectedBook.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{selectedBook.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-sm mb-1">Jumlah Halaman</div>
                      <div className="font-semibold">{selectedBook.pages} halaman</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-sm mb-1">Tahun Terbit</div>
                      <div className="font-semibold">{selectedBook.year}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-sm mb-1">Total Download</div>
                      <div className="font-semibold">{formatNumber(selectedBook.downloads)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-sm mb-1">Total Pembaca</div>
                      <div className="font-semibold">{formatNumber(selectedBook.views)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBook.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t">
                    <button 
                      onClick={() => toggleSaveBook(selectedBook.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        savedBooks.includes(selectedBook.id)
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                      <span>{savedBooks.includes(selectedBook.id) ? 'Tersimpan' : 'Simpan'}</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Bagikan</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-br from-indigo-900 to-purple-800 text-white py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Pondok Imam Syafi'i</h3>
              <p className="text-indigo-100">
                Membentuk generasi Qurani yang berakhlak mulia dan berwawasan luas
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Lembaga</h4>
              <ul className="space-y-2 text-indigo-100">
                <li><Link href="/about/yayasan" className="hover:text-white transition-colors">Yayasan</Link></li>
                <li><Link href="/about/pondok" className="hover:text-white transition-colors">Pondok Pesantren</Link></li>
                <li><Link href="/about/tk" className="hover:text-white transition-colors">TK Islam</Link></li>
                <li><Link href="/about/sd" className="hover:text-white transition-colors">SD Islam</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Program</h4>
              <ul className="space-y-2 text-indigo-100">
                <li><Link href="/donasi" className="hover:text-white transition-colors">Donasi</Link></li>
                <li><Link href="/gallery" className="hover:text-white transition-colors">Galeri Kegiatan</Link></li>
                <li><Link href="/kajian" className="hover:text-white transition-colors">Kajian Islam</Link></li>
                <li><Link href="/library" className="hover:text-white transition-colors">Perpustakaan Digital</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Kontak</h4>
              <ul className="space-y-2 text-indigo-100">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>(0342) 123456</span>
                </li>
                <li>Jl. Pendidikan No. 123</li>
                <li>Kota Blitar, Jawa Timur</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-indigo-700 mt-8 pt-8 text-center text-indigo-100">
            <p>&copy; 2024 Pondok Pesantren Imam Syafi'i. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}