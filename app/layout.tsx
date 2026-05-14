import Script from 'next/script';
import { Noto_Sans } from 'next/font/google';
import { App } from 'antd';
import ThemeProvider from './ThemeProvider';
import './globals.css';
import './styles/print.css';

const notoSans = Noto_Sans({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className={notoSans.variable} suppressHydrationWarning>
      <body className={notoSans.variable}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=document.documentElement;try{var s=localStorage.getItem('agume_theme');if(s==='dark')t.setAttribute('data-theme','dark');else if(s==='light')t.setAttribute('data-theme','light');}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <App>{children}</App>
        </ThemeProvider>
      </body>
    </html>
  );
}
