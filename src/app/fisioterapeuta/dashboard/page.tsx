'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FisioterapeutaDashboard() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/fisioterapeuta/pacientes');
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
