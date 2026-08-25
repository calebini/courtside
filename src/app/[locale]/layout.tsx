import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import type {Metadata, Viewport} from 'next';
import type {ReactNode} from 'react';

import {routing} from '@/i18n/routing';

import './styles.css';

export const metadata: Metadata = {
  applicationName: 'Courtside',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Courtside'
  },
  icons: {
    apple: '/icons/courtside-192.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#17223b'
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
