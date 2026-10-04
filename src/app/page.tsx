"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('app_user_role');
    if (role === 'secretary') {
      router.push('/patients');
    } else if (role === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
}
