// app/forgotpassword/page.tsx
import EmailSender from "./EmailSender";

// ✅ SEO metadata
export const metadata = {
  title: 'Forgot Password | Anne Creations HB',
  description:
    'Reset your Anne Creations HB account password easily. Enter your email to receive a secure password reset link.',
  keywords: [
    'Anne Creations HB',
    'forgot password',
    'reset password',
    'email reset link',
    'embroidery designs login',
  ],
  openGraph: {
    title: 'Forgot Password | Anne Creations HB',
    description:
      'Reset your account password and regain access to your Anne Creations HB account.',
    url: 'https://www.annecreationshb.com/forgotpassword',
    siteName: 'Anne Creations HB',
    images: [
      {
        url: 'https://www.annecreationshb.com/images/logo.png',
        width: 800,
        height: 600,
        alt: 'Anne Creations HB Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

// ✅ Correct function definition for the page component
export default function Page() {
  return <EmailSender />;
}
