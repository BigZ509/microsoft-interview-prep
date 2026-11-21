import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: 'Explore Prep — Interview Study Platform',
  description: 'Concepts, interview vocabulary, pattern recognition, Big-O training and a daily LeetCode tracker for the Microsoft Explore interview.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
