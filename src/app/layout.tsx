import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { ThemeLanguageProvider } from "@/context/ThemeLanguageContext";

export const metadata: Metadata = {
  title: "EventOS — La plateforme intelligente pour vos événements",
  description: "Gérez vos invitations, RSVP, menus et service à table pour tous vos événements depuis une seule plateforme.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Great+Vibes&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeLanguageProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </ThemeLanguageProvider>
      </body>
    </html>
  );
}
