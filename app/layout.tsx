import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Nexus Finance',
  description: 'Streamline your operations with Nexus Finance.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-[100dvh] antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
