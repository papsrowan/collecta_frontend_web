'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('userRole')?.toUpperCase() : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (role !== 'SUPERADMIN') {
      // Rôle non autorisé : rediriger vers le dashboard approprié ou login
      if (role === 'ADMIN' || role === 'ADJOINT') router.replace('/dashboard');
      else if (role === 'AGENT') router.replace('/agent/dashboard');
      else if (role === 'COMMERCANT') router.replace('/client/dashboard');
      else if (role === 'CAISSE') router.replace('/retraits');
      else router.replace('/dashboard');
      return;
    }
    setAllowed(true);
  }, [router, pathname]);

  if (allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du rôle...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuperAdminSidebar />
      <main className="page-with-sidebar">{children}</main>
    </div>
  );
}
