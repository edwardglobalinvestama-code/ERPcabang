import type { Metadata } from "next"
import "./globals.css"
import VanderChat from "@/components/VanderChat"

export const metadata: Metadata = {
  title: "Inusa Clinic ERP - Operational Dashboard",
  description:
    "Sistem Informasi Manajemen Klinik Inusa — KPI, Laporan, dan Administrasi Operasional",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-surface text-gray-100 antialiased">
        {children}
        <VanderChat />
      </body>
    </html>
  )
}
