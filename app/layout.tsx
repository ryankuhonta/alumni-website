import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LDSP Alumni Association",
  description: "Connecting Lasallian alumni for a lifetime",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient()

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('site_name, primary_color')
    .limit(1)
    .single()

  const siteName = orgInfo?.site_name || 'LDSP Alumni Association'
  const primaryColor = orgInfo?.primary_color || '#1e40af'

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ '--primary-color': primaryColor } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <div className="min-h-screen flex flex-col">
          <Navbar siteName={siteName} />
          <main className="flex-grow">
            {children}
          </main>
          <Footer siteName={siteName} />
        </div>
      </body>
    </html>
  );
}
