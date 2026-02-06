import './globals.css';
import Footer from '@/components/Footer';
import Header from '@/components/Header/Header';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import ScrollToTop from '@/components/ScrollTotop';
import WhatsappIcon from '@/components/whatsapp_icon';
import AiChat from '@/components/AiChat/AiChat';
import { AnalyticsProvider } from '@/Provider/AnalyticsProvider';
import { NotistackProvider } from '@/Provider/NotiStackProvider';
import LoginPopup from '@/components/Auth/LoginPopup';
import I18nProvider from '@/Provider/I18nProvider';

export const metadata = {
  title: 'Anne Creations',
  description: '',
  icons: {
    icon: [{ url: '/assets/logo.svg', type: 'image/png', sizes: '32x32' }],
  },
};

const fontLinks = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
  </>
);

// eslint-disable-next-line react/prop-types
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {fontLinks}
      </head>
      <body>
        <I18nProvider>
          <AnalyticsProvider>
            <Header />
            <NotistackProvider>
              {children}
            </NotistackProvider>
            <WhatsappIcon />
            <AiChat />
            <ScrollToTop />
            <LoginPopup />
            <Footer />
          </AnalyticsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
