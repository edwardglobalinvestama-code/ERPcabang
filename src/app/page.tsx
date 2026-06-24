"use client"

import { useState } from "react"
import { Building2, Stethoscope, Activity, ArrowRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

const branches = [
  { id: 1, name: "Inusa Clinic Jakarta" },
  { id: 2, name: "Inusa Clinic Bandung" },
  { id: 3, name: "Inusa Clinic Surabaya" },
]

const roles = [
  { id: 1, name: "Dokter", slug: "dokter" },
  { id: 2, name: "Perawat", slug: "perawat" },
  { id: 3, name: "Apoteker", slug: "apoteker" },
  { id: 4, name: "Staff Administrasi", slug: "staff-administrasi" },
  { id: 5, name: "Manajer", slug: "manajer" },
]

export default function LandingPage() {
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [pin, setPin] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBranch || !selectedRole || !pin) {
      setError("Harap isi semua bidang")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(selectedBranch),
          roleSlug: selectedRole,
          pin,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Login gagal")
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.role?.slug === "manajer" || data.role?.slug === "admin") {
        window.location.href = "/admin"
      } else {
        window.location.href = "/kpi"
      }
    } catch {
      setError("Gagal terhubung ke server")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-surface-light/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Inusa Clinic ERP</h1>
            <p className="text-xs text-gray-400">Operational Dashboard</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          {!showLogin ? (
            /* Landing welcome card */
            <div className="card text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Selamat Datang
                </h2>
                <p className="text-gray-400 text-sm">
                  Sistem Informasi Manajemen Klinik Inusa
                </p>
                <p className="text-gray-500 text-xs">
                  Pantau KPI, kelola laporan operasional, dan tingkatkan
                  kinerja klinik Anda.
                </p>
              </div>
              <button
                onClick={() => setShowLogin(true)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Masuk ke Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleLogin} className="card space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-white">Masuk</h2>
                <p className="text-sm text-gray-400">
                  Pilih cabang, peran, dan masukkan PIN
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-secondary" />
                  Cabang
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="select-field"
                >
                  <option value="">Pilih Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  Peran / Jabatan
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="select-field"
                >
                  <option value="">Pilih Peran</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.slug}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PIN */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-secondary" />
                  PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan PIN (angka)"
                  className="input-field"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="btn-secondary flex-1"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "btn-primary flex-1 flex items-center justify-center gap-2",
                    loading && "opacity-70"
                  )}
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Masuk <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 text-center">
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Inusa Clinic. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
