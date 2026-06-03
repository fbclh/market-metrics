import type { Metadata } from 'next';
import { AppLayout } from '@/src/components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Market Metrics',
  description: 'Stock research and analytics platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
