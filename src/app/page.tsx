"use client"

import { useState, useEffect } from "react"
import React from "react"
import { Building2, Stethoscope, Activity, ArrowRight, Lock, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const roleIcons: Record<string, React.ReactNode> = {
  "Dokter": <Stethoscope className="w-8 h-8 text-secondary" />,
  "Branch Manager": <Building2 className="w-8 h-8 text-secondary" />,
  "Perawat": <Activity className="w-8 h-8 text-accent" />,
  "Terapis": <Activity className="w-8 h-8 text-accent" />,
  "Customer Service": <Building2 className="w-8 h-8 text-secondary" />,
  "Apoteker": <Stethoscope className="w-8 h-8 text-accent" />,
  "Gudang": <Package className="w-8 h-8 text-secondary" />,
}

export default function LandingPage() {
  const [branches, setBranches] = useState<Array<{ id: number; name: string }>>([])
  const [roles, setRoles] = useState<Array<{ id: number; name: string; slug: string }>>([])
  const [selectedBranch, setSelectedBranch] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [pin, setPin] = useState("")
  const [showLogin, setShowLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)

  // Fetch branches and roles from API
  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
      Promise.all([
        fetch("/api/branches").then(r => r.json()),
        fetch("/api/roles").then(r => r.json()),
      ]).then(([branchesData, rolesData]) => {
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.branches || [])
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData.roles || [])
      }).catch(() => {
        setBranches([])
        setRoles([])
      })
    }
  }, [loaded])

  const handleLogin = async () => {
    if (!selectedBranch || !selectedRole || !pin) {
      setError("Silakan pilih cabang, role, dan masukkan PIN")
      return
    }
    if (pin.length < 4) {
      setError("PIN minimal 4 digit")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: selectedBranch,
          roleId: selectedRole,
          pin,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Gagal login, coba lagi")
        setLoading(false)
        return
      }

      const role = roles.find(r => r.id.toString() === selectedRole)
      sessionStorage.setItem("staff", JSON.stringify(data.staff))
      sessionStorage.setItem("role", JSON.stringify(role))

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

  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Background: dark navy with subtle gradient overlay */}
      <div className="absolute inset-0 bg-[#1A1A2E]" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(115,29,54,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,169,110,0.08),transparent_60%)]" />

      {/* Subtle geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(30deg, #C9A96E 12%, transparent 12.5%, transparent 87%, #C9A96E 87.5%),
            linear-gradient(150deg, #C9A96E 12%, transparent 12.5%, transparent 87%, #C9A96E 87.5%),
            linear-gradient(30deg, #C9A96E 12%, transparent 12.5%, transparent 87%, #C9A96E 87.5%),
            linear-gradient(150deg, #C9A96E 12%, transparent 12.5%, transparent 87%, #C9A96E 87.5%)
          `,
          backgroundSize: "80px 140px",
          backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Hero Section */}
        <div className="text-center mb-10">
          {/* Logo Inusa besar di tengah */}
          <div className="relative mx-auto mb-6 w-28 h-28">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-primary-light to-secondary/40 animate-pulse opacity-30 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 p-1.5 shadow-2xl shadow-primary/20">
              <div className="w-full h-full rounded-full bg-[#1A1A2E] flex items-center justify-center overflow-hidden border border-white/5">
                <img
                  src="/logo-inusa.png"
                  alt="Inusa"
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Gradient title: maroon-to-gold */}
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#731D36] via-[#C9A96E] to-[#E2A6C0] bg-clip-text text-transparent tracking-tight">
            Inusa Clinic
          </h1>
          <p className="text-white/50 text-sm tracking-wide uppercase font-medium">Operational KPI Dashboard</p>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-secondary/40" />
            <div className="w-2 h-2 rounded-full bg-secondary/60" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-secondary/40" />
          </div>
        </div>

        {/* Login Card */}
        <div className="relative group">
          {/* Glow border effect */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-secondary/40 via-primary/30 to-secondary/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />

          <div className="relative bg-[#232340] rounded-2xl p-6 border border-white/5 shadow-2xl shadow-black/40 backdrop-blur-sm">
            {!showLogin ? (
              <>
                <h2 className="text-lg font-semibold text-white mb-2">Pilih Role Anda</h2>
                <p className="text-white/40 text-sm mb-5">Pilih peran untuk melanjutkan ke dashboard</p>

                {/* Role Cards with Gradient Border/Glow */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {roles.map((role, idx) => (
                    <button
                      key={role.id}
                      onClick={() => {
                        setSelectedRole(role.id.toString())
                        setShowLogin(true)
                      }}
                      className="group/card relative flex flex-col items-center gap-2 p-4 rounded-xl
                        bg-[#1A1A2E] transition-all duration-300 overflow-hidden
                        hover:shadow-lg hover:shadow-primary/20"
                    >
                      {/* Gradient border glow */}
                      <div className="absolute inset-0 rounded-xl p-[1px] opacity-40 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-secondary/60 via-primary/40 to-secondary/20" />
                      </div>

                      {/* Inner background */}
                      <div className="absolute inset-[1px] rounded-[11px] bg-[#1A1A2E] transition-colors duration-300 group-hover/card:bg-[#1E1E34]" />

                      {/* Content (relative to sit above bg layers) */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                          "bg-gradient-to-br from-primary/20 to-secondary/10",
                          "group-hover/card:scale-110 group-hover/card:shadow-lg group-hover/card:shadow-primary/20"
                        )}>
                          {roleIcons[role.name] || <Activity className="w-6 h-6 text-white/60" />}
                        </div>
                        <span className="relative text-sm text-white/70 group-hover/card:text-white transition-colors duration-200 text-center font-medium">
                          {role.name}
                        </span>
                      </div>

                      {/* Hover shimmer */}
                      <div className="absolute -inset-full top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] translate-x-[-100%] group-hover/card:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-white/50 hover:text-secondary text-sm mb-4 flex items-center gap-1 transition-colors group/back"
                >
                  <span className="transition-transform duration-200 group-hover/back:-translate-x-1">←</span>
                  Kembali
                </button>

                <div className="mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mb-3">
                    {roleIcons[roles.find(r => r.id.toString() === selectedRole)?.name || ""] || <Activity className="w-6 h-6 text-secondary" />}
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-1">
                    {roles.find(r => r.id.toString() === selectedRole)?.name}
                  </h2>
                  <p className="text-white/40 text-sm">Masukkan PIN untuk masuk ke dashboard</p>
                </div>

                <div className="space-y-4">
                  {/* Branch Select */}
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block font-medium">Cabang</label>
                    <div className="relative">
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-secondary/20 to-primary/10 opacity-60 pointer-events-none" />
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="relative w-full bg-[#1A1A2E] border border-secondary/30 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#1A1A2E]">Pilih Cabang</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id} className="bg-[#1A1A2E]">{b.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-secondary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* PIN Input Premium */}
                  <div>
                    <label className="text-white/50 text-xs uppercase tracking-wider mb-2 block font-medium">PIN</label>
                    <div className="relative">
                      {/* Gold accent border glow */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-secondary/40 via-secondary/20 to-transparent opacity-50" />

                      <div className="relative flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center">
                          <Lock className="w-4 h-4 text-secondary/60" />
                        </div>
                        <input
                          type="password"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="w-full bg-[#1A1A2E] border border-secondary/30 rounded-lg pl-10 pr-3 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 transition-all duration-200 tracking-[0.3em] text-lg"
                          placeholder="••••••"
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decorative PIN hint */}
                  <p className="text-white/20 text-[10px] uppercase tracking-widest text-center -mt-1">
                    PIN 6 digit
                  </p>

                  {error && (
                    <p className="text-red-400 text-sm bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className={cn(
                      "relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-lg",
                      "bg-gradient-to-r from-primary to-primary-light",
                      "hover:from-primary-light hover:to-primary",
                      "text-white font-semibold px-4 py-3",
                      "transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                      "group/btn"
                    )}
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-25deg]" />
                    <span className="relative">{loading ? "Memproses..." : "Masuk"}</span>
                    {!loading && <ArrowRight className="relative w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
                    {loading && (
                      <svg className="relative animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/5">
              {!showLogin && (
                <p className="text-white/20 text-[10px] text-center uppercase tracking-[0.15em] mb-2">
                  — Pilih role untuk masuk —
                </p>
              )}
              <div className="flex items-center justify-center gap-2">
                <span className="text-white/30 text-xs">PT Inusa Group</span>
                <span className="text-white/10 text-xs">•</span>
                <span className="text-white/20 text-xs">KPI v1.0</span>
                <span className="text-white/10 text-xs">•</span>
                <span className="text-white/20 text-xs">PIN: 123456</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary/20" />
          <div className="w-1 h-1 rounded-full bg-primary/40" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary/20" />
        </div>
      </div>
    </main>
  )
}
