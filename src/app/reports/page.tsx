"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Download,
  Filter,
  BarChart3,
  Building2,
  Calendar,
  TrendingUp,
  Target,
  Award,
  ChevronDown,
  Search,
  Stethoscope,
  LogOut,
} from "lucide-react"
import { cn, formatDate, formatCurrency, formatPercent } from "@/lib/utils"

// ── Types ──
interface Branch {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  slug: string
}

interface StaffScore {
  id: number
  name: string
  nip: string
  role: string
  totalScore: number
  entriesCount: number
  categories: { name: string; value: number; target: number }[]
}

interface SummaryData {
  totalStaff: number
  avgScore: number
  totalEntries: number
  approvedEntries: number
}

export default function ReportsPage() {
  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false)
  const [pin, setPin] = useState("")
  const [loginError, setLoginError] = useState("")

  // ── Data ──
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [staffScores, setStaffScores] = useState<StaffScore[]>([])
  const [summary, setSummary] = useState<SummaryData>({
    totalStaff: 0,
    avgScore: 0,
    totalEntries: 0,
    approvedEntries: 0,
  })
  const [filteredScores, setFilteredScores] = useState<StaffScore[]>([])

  // ── Filters ──
  const [branchFilter, setBranchFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [periodFilter, setPeriodFilter] = useState("monthly")
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0])
  const [searchQuery, setSearchQuery] = useState("")

  // ── Loading / Export ──
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState("")

  // ── Login ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "123456" || pin.length >= 4) {
      setLoggedIn(true)
      setLoginError("")
    } else {
      setLoginError("PIN salah")
    }
  }

  // ── Load Data ──
  const loadData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (branchFilter) params.set("branchId", branchFilter)
      if (roleFilter) params.set("roleSlug", roleFilter)
      if (periodFilter) params.set("period", periodFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)

      const qs = params.toString() ? `?${params.toString()}` : ""

      const [summaryRes, scoresRes, branchesRes, rolesRes] = await Promise.all([
        fetch(`/api/reports/summary${qs}`),
        fetch(`/api/reports/staff-scores${qs}`),
        fetch("/api/branches"),
        fetch("/api/roles"),
      ])

      if (summaryRes.ok) {
        const d = await summaryRes.json()
        setSummary(d)
      }
      if (scoresRes.ok) {
        const d = await scoresRes.json()
        const arr = Array.isArray(d) ? d : d.data || []
        setStaffScores(arr)
        setFilteredScores(arr)
      }
      if (branchesRes.ok) {
        const d = await branchesRes.json()
        setBranches(Array.isArray(d) ? d : d.data || [])
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json()
        setRoles(Array.isArray(d) ? d : d.data || [])
      }
    } catch {
      // silent
    }
    setLoading(false)
  }

  useEffect(() => {
    if (loggedIn) loadData()
  }, [loggedIn, branchFilter, roleFilter, periodFilter, dateFrom, dateTo])

  // ── Client-side search ──
  useEffect(() => {
    if (!searchQuery) {
      setFilteredScores(staffScores)
    } else {
      const q = searchQuery.toLowerCase()
      setFilteredScores(
        staffScores.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.nip.toLowerCase().includes(q) ||
            s.role.toLowerCase().includes(q)
        )
      )
    }
  }, [searchQuery, staffScores])

  // ── Export placeholder ──
  const handleExport = async () => {
    setExporting(true)
    setExportMsg("")
    try {
      const params = new URLSearchParams()
      if (branchFilter) params.set("branchId", branchFilter)
      if (roleFilter) params.set("roleSlug", roleFilter)
      if (periodFilter) params.set("period", periodFilter)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      params.set("format", "csv")

      const res = await fetch(`/api/reports/export?${params.toString()}`)
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `laporan-kpi-${periodFilter}-${dateFrom}-to-${dateTo}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setExportMsg("Laporan berhasil diunduh!")
      } else {
        // Fallback: inform user
        setExportMsg("Fitur ekspor akan segera tersedia.")
      }
    } catch {
      setExportMsg("Gagal mengekspor laporan.")
    }
    setExporting(false)
    setTimeout(() => setExportMsg(""), 4000)
  }

  // ── Not logged in → login screen ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full card space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Laporan KPI</h2>
            <p className="text-sm text-gray-400">
              Masukkan PIN untuk mengakses laporan
            </p>
          </div>
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="PIN"
              className="input-field text-center text-lg tracking-widest"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
            <button type="submit" className="btn-primary w-full">
              Masuk
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-surface-light/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <h1 className="font-bold text-white">Laporan KPI</h1>
          </div>
          <button
            onClick={() => setLoggedIn(false)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Filters ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold text-white">Filter</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Cabang
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="select-field text-sm"
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Peran
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-field text-sm"
              >
                <option value="">Semua Peran</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Periode
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="select-field text-sm"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>

            {/* Date From */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Staff
              </p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : summary.totalStaff}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Rata-rata Skor
              </p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : formatPercent(summary.avgScore)}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Total Entries
              </p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : summary.totalEntries.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                Disetujui
              </p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : summary.approvedEntries.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Export ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari staff..."
              className="input-field max-w-xs text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            {exportMsg && (
              <span className="text-xs text-green-400">{exportMsg}</span>
            )}
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {exporting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export CSV
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Score Breakdown Table ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-white">
              Rincian Skor per Staff
            </h3>
            <span className="text-[11px] text-gray-500 ml-2">
              {filteredScores.length} staff
            </span>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <span className="inline-block w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Memuat data...</p>
            </div>
          ) : filteredScores.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-500 text-sm">Belum ada data laporan</p>
              <p className="text-gray-600 text-xs mt-1">
                Sesuaikan filter untuk melihat data
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredScores.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white/[0.02] rounded-xl border border-white/5 p-4"
                >
                  {/* Staff header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {staff.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-gray-500 font-mono">
                          {staff.nip}
                        </span>
                        <span className="text-[11px] bg-white/5 px-2 py-0.5 rounded text-gray-400">
                          {staff.role}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {staff.entriesCount} entries
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">
                        {formatPercent(staff.totalScore)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Total Skor
                      </p>
                    </div>
                  </div>

                  {/* Category bars */}
                  {staff.categories && staff.categories.length > 0 && (
                    <div className="space-y-2">
                      {staff.categories.map((cat, ci) => {
                        const pct =
                          cat.target > 0
                            ? Math.min(100, (cat.value / cat.target) * 100)
                            : 0
                        return (
                          <div key={ci} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-36 shrink-0 truncate">
                              {cat.name}
                            </span>
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  pct >= 80
                                    ? "bg-green-500"
                                    : pct >= 50
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-300 w-16 text-right">
                              {cat.value}
                              <span className="text-gray-500">
                                /{cat.target}
                              </span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
