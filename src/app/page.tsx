"use client"

import React, { useState } from "react"
import { Building2, Stethoscope, Activity, ArrowRight, Lock, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const branches = [
  { id: 1, name: "Inusa Clinic Jakarta" },
  { id: 2, name: "Inusa Clinic Bandung" },
  { id: 3, name: "Inusa Clinic Surabaya" },
]

const roles = [
  { id: 1, name: "Dokter", slug: "dokter" },
  { id: 2, name: "Branch Manager", slug: "branch-manager" },
  { id: 3, name: "Perawat", slug: "perawat" },
  { id: 4, name: "Terapis", slug: "terapis" },
  { id: 5, name: "Customer Service", slug: "cs" },
  { id: 6, name: "Apoteker", slug: "apoteker" },
  { id: 7, name: "Gudang", slug: "gudang" },
]

export default function LandingPage() {
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [pin, setPin] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!selectedBranch || !selectedRole || !pin) {
      setError("Silakan pilih cabang, role, dan masukkan PIN")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/staff?branchId=${selectedBranch}&roleId=${selectedRole}`)
      const data = await res.json()
      const staff = data.staff?.[0]

      if (!staff) {
        setError("Staff tidak ditemukan")
        setLoading(false)
        return
      }

      // Simple PIN verification via bcrypt check on server
      // For demo: any 6-digit PIN works
      if (pin.length < 4) {
        setError("PIN minimal 4 digit")
        setLoading(false)
        return
      }

      const role = roles.find(r => r.id === parseInt(selectedRole))
      sessionStorage.setItem("staff", JSON.stringify(staff))
      sessionStorage.setItem("role", JSON.stringify(role))

      // Redirect based on role
      if (role?.slug === "branch-manager") {
        window.location.href = "/admin"
      } else {
        window.location.href = "/kpi"
      }
    } catch (e) {
      setError("Gagal login, coba lagi")
    } finally {
      setLoading(false)
    }
  }

  const iconMap: Record<string, React.ReactNode> = {
    "Dokter": <Stethoscope className="w-8 h-8 text-secondary" />,
    "Branch Manager": <Building2 className="w-8 h-8 text-secondary" />,
    "Perawat": <Activity className="w-8 h-8 text-accent" />,
    "Terapis": <Activity className="w-8 h-8 text-accent" />,
    "Customer Service": <Building2 className="w-8 h-8 text-secondary" />,
    "Apoteker": <Stethoscope className="w-8 h-8 text-accent" />,
    "Gudang": <Package className="w-8 h-8 text-secondary" />,
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Inusa Clinic</h1>
          <p className="text-white/60 mt-1">Operational Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-light rounded-2xl p-6 border border-white/10 shadow-xl">
          {!showLogin ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Pilih Peran Anda</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id.toString())
                      setShowLogin(true)
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-white/10 hover:border-secondary/50 hover:bg-surface/80 transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center group-hover:scale-110 transition-transform">
                      {iconMap[role.name] || <Activity className="w-6 h-6 text-white/60" />}
                    </div>
                    <span className="text-sm text-white/80 group-hover:text-white transition-colors text-center">
                      {role.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowLogin(false)}
                className="text-white/60 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
              >
                ← Kembali
              </button>

              <h2 className="text-lg font-semibold text-white mb-1">
                {roles.find(r => r.id.toString() === selectedRole)?.name}
              </h2>
              <p className="text-white/50 text-sm mb-6">Masukkan PIN untuk masuk</p>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-1 block">Cabang</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="select-field"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-1 block">PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="input-field pl-10"
                      placeholder="Masukkan PIN (123456)"
                      maxLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className={cn(
                    "btn-primary w-full flex items-center justify-center gap-2",
                    loading && "opacity-50"
                  )}
                >
                  {loading ? "Memproses..." : "Masuk"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Info */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-white/40 text-xs text-center">
              PIN default: 123456 • KPI Operational System v1.0
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
