import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POgrid.id',
  description: 'Internal production order visibility for fabrication teams',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
