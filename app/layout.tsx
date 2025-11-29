import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ScrollProgressBar } from "@/components/ui/scroll-progress-bar"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "OhMyWedding - Create Your Perfect Wedding Website",
  description: "Create a beautiful, elegant wedding website that captures your love story. Share details, manage RSVPs, and celebrate with your guests.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <ScrollProgressBar />
        {children}
      </body>
    </html>
  )
}
