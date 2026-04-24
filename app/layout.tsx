import type {Metadata} from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'OpenVPN Panel',
  description: 'Manage your OpenVPN server users and sessions.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
