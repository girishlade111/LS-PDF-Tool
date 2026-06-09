import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { GlobalErrorLogger } from "@/components/common/GlobalErrorLogger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Tools — Free Online PDF Editor | Merge, Split, Compress & More",
  description:
    "Free, secure, and fast PDF tools. Merge, split, compress, rotate, watermark, convert, and organize PDFs — all in your browser. No uploads, no registration, no limits.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "rotate PDF",
    "watermark PDF",
    "PDF to JPG",
    "JPG to PDF",
    "protect PDF",
    "organize PDF",
    "PDF to text",
    "free PDF editor",
    "online PDF tools",
  ],
  authors: [{ name: "PDF Tools" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Global error sink (window.onerror + unhandledrejection). */}
          <GlobalErrorLogger />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
