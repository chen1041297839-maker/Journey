import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google"
import { AppProviders } from "@/components/app-providers"
import { TripHeader } from "@/components/trip-header"
import { loadSharedTrip } from "@/lib/persist"
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
  title: "Xenia 的行程站",
  description:
    "从圆周旅迹分享链接导入行程。每一站先看抽出的店铺、必买、机位、穿搭和避坑；原帖只留来源。",
}

export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const trip = await loadSharedTrip()
  return (
    <html
      lang="zh-CN"
      className={`${sans.variable} ${serif.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AppProviders initialTrip={trip}>
          <TripHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  )
}
