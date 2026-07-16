import type { Metadata, Viewport } from "next";
import "../app/globals.css";

export const metadata: Metadata = {
  title: "My Projects",
  description: "Hub de projetos — black neon",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "My Projects",
  },
  icons: {
    icon: "/icon-192_round.png",
    apple: "/icon-192_round.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt" className="dark">
      <body className="relative min-h-svh antialiased">
        {/* Fundo separado em div fixed — bg-fixed no body quebra em Safari PWA */}
        <div className="fixed inset-0 -z-10 bg-[url('/bg.avif')] bg-cover bg-center bg-no-repeat" aria-hidden="true" />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
