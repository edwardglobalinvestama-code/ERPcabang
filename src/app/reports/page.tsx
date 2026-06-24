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
  LogOut,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  Users,
  ClipboardCheck,
  Star,
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

  // ── Check session on mount ──
  useEffect(() => {
    const stored = sessionStorage.getItem("staff")
    const roleData = sessionStorage.getItem("role")
    if (stored && roleData) {
      try {
        JSON.parse(stored)
        JSON.parse(roleData)
        setLoggedIn(true)
      } catch {
        // Invalid session
      }
    }
  }, [])

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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-surface via-surface to-surface-dark">
        {/* Inusa Logo Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-4">
            <img
              src="/logo-inusa.png"
              alt="Inusa"
              className="w-12 h-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Inusa Clinic
          </h1>
          <p className="text-sm text-secondary mt-1 font-medium">
            Laporan KPI
          </p>
        </div>

        <div className="max-w-sm w-full">
          <div className="bg-surface-light rounded-2xl border border-white/5 p-8 shadow-xl shadow-black/20">
            <div className="text-center space-y-1 mb-6">
              <div className="mx-auto w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm text-gray-400">
                Masukkan PIN untuk mengakses laporan
              </p>
            </div>
            <a href="/" className="btn-primary w-full inline-block text-center py-2.5">
              Ke Halaman Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-dark">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-surface-light/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
              <img
                src="/logo-inusa.png"
                alt="Inusa"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="font-bold text-white">Laporan KPI</h1>
          </div>
          <button
            onClick={() => setLoggedIn(false)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors hover:bg-white/5 px-2.5 py-1.5 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Filters ── */}
        <div className="bg-surface-light rounded-2xl border border-secondary/20 shadow-xl shadow-black/10 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Filter className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-white">Filter</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 flex items-center gap-1 font-medium">
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
              <label className="text-xs text-gray-400 flex items-center gap-1 font-medium">
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
              <label className="text-xs text-gray-400 flex items-center gap-1 font-medium">
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
              <label className="text-xs text-gray-400 font-medium">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Date To */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-medium">Sampai Tanggal</label>
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
          {/* Total Staff - Maroon */}
          <div className="bg-surface-light rounded-2xl border border-primary/20 shadow-lg shadow-black/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Total Staff
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? "—" : summary.totalStaff}
              </p>
            </div>
          </div>

          {/* Avg Score - Gold */}
          <div className="bg-surface-light rounded-2xl border border-secondary/20 shadow-lg shadow-black/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center shrink-0 shadow-sm shadow-secondary/30">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Rata-rata Skor
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? "—" : formatPercent(summary.avgScore)}
              </p>
            </div>
          </div>

          {/* Total Entries - Pink Rose */}
          <div className="bg-surface-light rounded-2xl border border-accent/20 shadow-lg shadow-black/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Total Entries
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? "—" : summary.totalEntries.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Disetujui - Maroon */}
          <div className="bg-surface-light rounded-2xl border border-primary/20 shadow-lg shadow-black/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                Disetujui
              </p>
              <p className="text-2xl font-bold text-white mt-0.5">
                {loading ? "—" : summary.approvedEntries.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── Search & Export ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari staff..."
                className="input-field pl-9 text-sm w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {exportMsg && (
              <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                {exportMsg}
              </span>
            )}
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-secondary/20"
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
        <div className="bg-surface-light rounded-2xl border border-white/5 shadow-xl shadow-black/10 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Rincian Skor per Staff
            </h3>
            <span className="text-[11px] text-gray-500 ml-2 bg-white/5 px-2 py-0.5 rounded-full">
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
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Belum ada data laporan</p>
              <p className="text-gray-600 text-xs mt-1">
                Sesuaikan filter untuk melihat data
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredScores.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-white/[0.03] rounded-xl border border-white/5 p-5 hover:border-primary/10 transition-colors"
                >
                  {/* Staff header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {staff.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {staff.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-gray-500 font-mono">
                            {staff.nip}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          <span className="text-[11px] bg-secondary/10 text-secondary px-2 py-0.5 rounded font-medium">
                            {staff.role}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-gray-600" />
                          <span className="text-[11px] text-gray-500">
                            {staff.entriesCount} entries
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-accent">
                        {formatPercent(staff.totalScore)}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                        Total Skor
                      </p>
                    </div>
                  </div>

                  {/* Category bars */}
                  {staff.categories && staff.categories.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {staff.categories.map((cat, ci) => {
                        const pct =
                          cat.target > 0
                            ? Math.min(100, (cat.value / cat.target) * 100)
                            : 0
                        return (
                          <div key={ci} className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-400 w-28 shrink-0 truncate font-medium">
                              {cat.name}
                            </span>
                            <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-700 ease-out",
                                  pct >= 80
                                    ? "bg-gradient-to-r from-green-500 to-green-400"
                                    : pct >= 50
                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                    : "bg-gradient-to-r from-red-500 to-red-400"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono text-gray-300 w-20 text-right">
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
