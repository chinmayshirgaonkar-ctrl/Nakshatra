import type { Metadata } from "next";
import {
  Fraunces,
  Manrope,
  JetBrains_Mono,
  Noto_Sans_Devanagari,
  Tiro_Devanagari_Marathi,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Starfield } from "@/components/starfield";
import { Toaster } from "sonner";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-devanagari",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const tiroDevanagariMarathi = Tiro_Devanagari_Marathi({
  subsets: ["devanagari", "latin"],
  variable: "--font-tiro-marathi",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nakshatra (नक्षत्र) — The Celestial Learning OS",
  description: "A personal learning operating system that turns study material into a living night sky.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} ${notoSansDevanagari.variable} ${tiroDevanagariMarathi.variable}`}
    >
      <body className="min-h-screen bg-background font-manrope text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Starfield />
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--deep)",
                border: "1px solid var(--border)",
                color: "var(--ivory)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
