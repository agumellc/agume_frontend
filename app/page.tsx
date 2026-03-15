'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('access_token')) {
        router.replace('/orders');
      } else {
        router.replace('/login');
      }
    }
  }, [router]);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Уншиж байна...
    </div>
  );
}
