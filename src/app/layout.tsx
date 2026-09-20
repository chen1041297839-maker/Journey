import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"
import { TripHeader } from "@/components/trip-header"
import "./globals.css"

const sans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const serif = Noto_Serif_SC({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
})

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Hologrow 的东京手帐",
  description: "每一站的店铺、必买、机位和当日穿搭，比路线更细的个人行程伴侣。",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <TripHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  )
}
