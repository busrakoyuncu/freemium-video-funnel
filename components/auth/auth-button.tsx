'use client';

import type { ReactNode } from 'react';
import { useAppStore } from '@/store/use-app-store';

type AuthButtonProps = {
  className?: string;
  mode: 'signin' | 'signup';
  children: ReactNode;
};

export function AuthButton({ className, mode, children }: AuthButtonProps) {
  const openAuthModal = useAppStore((state) => state.openAuthModal);

  return (
    <button className={className} type="button" onClick={() => openAuthModal(mode)}>
      {children}
    </button>
  );
}
