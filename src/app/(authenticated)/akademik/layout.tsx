'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    BarChart3,
    Users,
    BookOpen,
    Award,
    UserCheck,
    Clock,
    FileText,
    ClipboardCheck,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';

const academicMenuItems = [
    { title: 'Dashboard', href: '/akademik', icon: BarChart3 },
    { title: 'Kelas', href: '/akademik/classes', icon: Users },
    { title: 'Mata Pelajaran', href: '/akademik/subjects', icon: BookOpen },
    { title: 'Input Nilai', href: '/akademik/grades', icon: Award },
    { title: 'Absensi', href: '/akademik/attendance', icon: UserCheck },
    { title: 'Jadwal', href: '/akademik/schedules', icon: Clock },
    { title: 'Raport', href: '/akademik/report-cards', icon: FileText },
    { title: 'Ujian', href: '/akademik/exams', icon: ClipboardCheck },
    { title: 'Tahun Ajaran', href: '/akademik/academic-years', icon: Calendar },
];

export default function AkademikLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Akademik" />

            {/* Academic Sub Navigation */}
            <div className="bg-white border-b shadow-sm">
                <div className="px-6 py-2">
                    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
                        {academicMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href ||
                                (item.href !== '/akademik' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                                        isActive
                                            ? 'bg-green-100 text-green-800 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Page Content with proper padding */}
            <main className="p-6">
                {children}
            </main>
        </div>
    );
}
