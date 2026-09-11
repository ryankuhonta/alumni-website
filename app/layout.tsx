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
    .select('site_name, tagline, logo_url, school_logo_url')
    .limit(1)
    .single()

  const siteName = orgInfo?.site_name || 'LDSP Alumni Association'
  const tagline = orgInfo?.tagline || 'Connecting Lasallian alumni for a lifetime'
  const logo = orgInfo?.logo_url || orgInfo?.school_logo_url

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: tagline,
    keywords: ['alumni', 'LDSP', 'Liceo de San Pedro', 'Lasallian', 'alumni association', 'batch', 'reunion'],
    authors: [{ name: siteName }],
    openGraph: {
      type: 'website',
      locale: 'en_PH',
      url: 'https://liceodesanpedroalumni.org',
      siteName: siteName,
      title: siteName,
      description: tagline,
      images: [
        {
          url: logo || '/og-image.png',
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: tagline,
      images: [logo || '/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: orgInfo?.logo_url || '/favicon.ico',
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
