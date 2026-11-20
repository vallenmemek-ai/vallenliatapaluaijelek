import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: 'VALLEN — Admin Console',
  description: 'License key management for VALLEN mod',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
