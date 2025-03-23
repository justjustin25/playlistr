'use client';

import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Header />
          <main className="">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
