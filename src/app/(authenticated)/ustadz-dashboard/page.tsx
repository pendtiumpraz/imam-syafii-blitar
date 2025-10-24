import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import TanyaUstadzDashboard from './TanyaUstadzDashboard';

const prisma = new PrismaClient();

export default async function TanyaUstadzPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user is ustadz or admin
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, isUstadz: true, name: true }
  });

  if (!user || (!user.isUstadz && !['ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
    redirect('/dashboard');
  }

  await prisma.$disconnect();

  return <TanyaUstadzDashboard user={user} />;
}