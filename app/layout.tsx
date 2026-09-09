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

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('site_name, logo_url')
    .limit(1)
    .single()

  const siteName = orgInfo?.site_name || 'LDSP Alumni Association'

  return {
    title: siteName,
    description: "Connecting Lasallian alumni for a lifetime",
    icons: {
      icon: orgInfo?.logo_url || "/favicon.ico",
    },
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient()

  const { data: orgInfo } = await supabase
    .from('organization_info')
    .select('site_name, primary_color, logo_url')
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
      <head>
        <link rel="icon" href={orgInfo?.logo_url || "/favicon.ico"} />
      </head>
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
