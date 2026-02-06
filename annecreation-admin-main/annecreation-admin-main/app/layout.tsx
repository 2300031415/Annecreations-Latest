import type { Metadata } from "next";
import "./globals.css";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Toaster } from "@/components/ui/toaster";

// Metadata for the site
export const metadata: Metadata = {
  title: "AnneCreation Admin",
  description: "Admin dashboard for Anne Creations",
  icons: {
    icon: "/admin/logo.svg", 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          {children}
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
