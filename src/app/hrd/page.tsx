"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Users,
  Building2,
  Activity,
  Award,
  TrendingUp,
  RefreshCw,
  UserPlus,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  LogOut,
  Crown,
  Medal,
  Shield,
  LayoutDashboard,
  FileText,
  Download,
  Filter,
  Star,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──
interface BranchSummary {
  branchId: number
  branchName: string
  branchCode: string
  staffCount: number
  activeCount: number
  avgKpiScore: number
}

interface HrdSummary {
  totalStaff: number
  totalActiveStaff: number
  totalBranches: number
  averageKpiScore: number
  branchSummaries: BranchSummary[]
}

interface Branch {
  id: number
  name: string
  code: string
}

interface Role {
  id: number
  name: string
  slug: string
}

interface StaffWithKpi {
  id: number
  nip: string
  name: string
  phone?: string
  email?: string
  isActive: boolean
  branchId: number
  roleId: number
  joinDate?: string
  branch?: { id: number; name: string; code?: string }
  role?: { id: number; name: string; slug: string }
  kpiScore: number | null
}

type SortField = "branchName" | "avgKpiScore" | "staffCount"
type SortDir = "asc" | "desc"

function getPerformanceBadge(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 80) return { label: "Gold", color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/30" }
  if (score >= 60) return { label: "Silver", color: "text-gray-300", bg: "bg-gray-400/15", border: "border-gray-400/30" }
  return { label: "Bronze", color: "text-amber-600", bg: "bg-amber-700/15", border: "border-amber-700/30" }
}

export default function HrdPage() {
  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false)
  const [authStaff, setAuthStaff] = useState<{ id: number; name: string; nip: string } | null>(null)

  // ── Data ──
  const [summary, setSummary] = useState<HrdSummary | null>(null)
  const [staffList, setStaffList] = useState<StaffWithKpi[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  // ── Loading ──
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBranch, setFilterBranch] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // ── Sort ──
  const [sortField, setSortField] = useState<SortField>("branchName")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // ── Auth header ──
  const authHeader = (): Record<string, string> => {
    if (!authStaff) return {}
    return {
      "x-auth-staff": btoa(JSON.stringify({ staffId: authStaff.id, roleSlug: "super-admin" })),
    }
  }

  // ── Load initial session ──
  useEffect(() => {
    const stored = sessionStorage.getItem("staff")
    const roleData = sessionStorage.getItem("role")
    if (stored && roleData) {
      try {
        const parsed = JSON.parse(stored)
        const role = JSON.parse(roleData)
        if (role?.slug === "branch-manager" || role?.slug === "super-admin") {
          setAuthStaff(parsed)
          setLoggedIn(true)
        } else {
          window.location.href = "/kpi"
        }
      } catch {
        // silent
      }
    }
  }, [])

  // ── Load summary data ──
  const loadSummary = async () => {
    setLoading(true)
    try {
      const [summaryRes, branchesRes, rolesRes] = await Promise.all([
        fetch("/api/hrd/summary", { headers: authHeader() }),
        fetch("/api/branches"),
        fetch("/api/roles"),
      ])
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (branchesRes.ok) {
        const d = await branchesRes.json()
        setBranches(Array.isArray(d) ? d : d.data || [])
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json()
        setRoles(Array.isArray(d) ? d : d.data || [])
      }
    } catch (e) {
      console.error("loadSummary error:", e)
    }
    setLoading(false)
  }

  // ── Load staff list ──
  const loadStaff = async () => {
    setStaffLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterBranch) params.set("branchId", filterBranch)
      if (filterRole) params.set("roleId", filterRole)
      if (searchTerm) params.set("search", searchTerm)
      if (filterStatus !== "all") params.set("status", filterStatus)
      const qs = params.toString()
      const res = await fetch(`/api/hrd/staff${qs ? `?${qs}` : ""}`, { headers: authHeader() })
      if (res.ok) {
        const d = await res.json()
        setStaffList(Array.isArray(d) ? d : d.data || [])
      }
    } catch (e) {
      console.error("loadStaff error:", e)
    }
    setStaffLoading(false)
  }

  useEffect(() => {
    if (loggedIn) loadSummary()
  }, [loggedIn])

  useEffect(() => {
    if (loggedIn) loadStaff()
  }, [loggedIn, filterBranch, filterRole, filterStatus])

  // ── Search debounce ──
  useEffect(() => {
    if (!loggedIn) return
    const timer = setTimeout(() => {
      loadStaff()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // ── Sorted branch summaries ──
  const sortedBranches = summary
    ? [...summary.branchSummaries].sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1
        if (sortField === "avgKpiScore") return (a.avgKpiScore - b.avgKpiScore) * mul
        if (sortField === "staffCount") return (a.staffCount - b.staffCount) * mul
        return a.branchName.localeCompare(b.branchName) * mul
      })
    : []

  // ── Toggle sort ──
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null
    return <span className="ml-1 text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
  }

  // ── Not logged in ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#731D3615,_transparent_70%),radial-gradient(ellipse_at_bottom_left,_#C9A96E10,_transparent_70%)]" />
        <div className="max-w-sm w-full card space-y-6 text-center relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#731D36] to-[#8B2A45] flex items-center justify-center shadow-lg shadow-[#731D36]/30">
            <Image
              src="/logo-inusa.png"
              alt="Inusa Clinic"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Inusa Clinic</h2>
            <p className="text-sm text-gray-400 mt-1">HRD Dashboard</p>
          </div>
          <p className="text-sm text-gray-400">
            Silakan login sebagai Branch Manager atau Super Admin dari halaman utama
          </p>
          <a
            href="/"
            className="inline-block w-full text-center px-4 py-2.5 rounded-lg font-medium text-sm text-white bg-gradient-to-r from-[#731D36] to-[#8B2A45] hover:from-[#8B2A45] hover:to-[#731D36] transition-all duration-300 shadow-lg shadow-[#731D36]/30"
          >
            Ke Halaman Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_#731D3608,_transparent_70%),radial-gradient(ellipse_at_bottom_left,_#C9A96E06,_transparent_70%)]" />

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-surface-light/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#731D36] to-[#8B2A45] flex items-center justify-center overflow-hidden p-1 shadow-sm">
              <Image
                src="/logo-inusa.png"
                alt="Inusa"
                width={24}
                height={24}
                className="brightness-0 invert w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-lg tracking-tight">
                Inusa <span className="text-[#C9A96E]">Clinic</span>
              </h1>
              <span className="hidden sm:inline-block w-px h-5 bg-white/10" />
              <span className="hidden sm:inline text-xs text-gray-500">HRD Central Dashboard</span>
            </div>
            {authStaff && (
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#731D36] to-[#C9A96E] flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white">
                    {authStaff.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-xs bg-[#C9A96E]/15 text-[#C9A96E] px-2.5 py-0.5 rounded-full font-medium border border-[#C9A96E]/20">
                  {authStaff.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { loadSummary(); loadStaff() }}
              className="text-xs text-gray-500 hover:text-[#C9A96E] flex items-center gap-1.5 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => {
                sessionStorage.clear()
                window.location.href = "/"
              }}
              className="text-xs text-gray-500 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* ════════════════════════════════════════════ */}
        {/* 1. OVERVIEW BAR                              */}
        {/* ════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Seluruh Staff */}
          <div className="card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#731D36]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#731D36]/5 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#731D36] to-[#8B2A45] flex items-center justify-center shrink-0 shadow-lg shadow-[#731D36]/25">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Staff</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : summary?.totalStaff ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Aktif */}
          <div className="card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#C9A96E]/5 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A96E] to-[#D4B98A] flex items-center justify-center shrink-0 shadow-lg shadow-[#C9A96E]/25">
                <Activity className="w-6 h-6 text-[#1A1A2E]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Staff Aktif</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : summary?.totalActiveStaff ?? "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Rata-rata KPI */}
          <div className="card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E2A6C0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#E2A6C0]/5 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E2A6C0] to-[#D495B0] flex items-center justify-center shrink-0 shadow-lg shadow-[#E2A6C0]/25">
                <TrendingUp className="w-6 h-6 text-[#1A1A2E]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rata-rata KPI</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : summary ? `${summary.averageKpiScore.toFixed(1)}%` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Jumlah Cabang */}
          <div className="card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#C9A96E]/5 blur-xl" />
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A1A2E] to-[#232340] flex items-center justify-center shrink-0 shadow-lg shadow-black/25 border border-white/10">
                <Building2 className="w-6 h-6 text-[#C9A96E]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total Cabang</p>
                <p className="text-2xl font-bold text-white">
                  {loading ? "—" : summary?.totalBranches ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* 2. BRANCH KPI COMPARISON TABLE               */}
        {/* ════════════════════════════════════════════ */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#C9A96E]" />
              <h2 className="text-lg font-semibold text-white">Perbandingan KPI Cabang</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>Urut:</span>
              <button
                onClick={() => toggleSort("branchName")}
                className={cn(
                  "px-2 py-1 rounded transition-colors",
                  sortField === "branchName" ? "bg-[#C9A96E]/15 text-[#C9A96E]" : "hover:text-gray-300",
                )}
              >
                Cabang{sortIndicator("branchName")}
              </button>
              <button
                onClick={() => toggleSort("avgKpiScore")}
                className={cn(
                  "px-2 py-1 rounded transition-colors",
                  sortField === "avgKpiScore" ? "bg-[#C9A96E]/15 text-[#C9A96E]" : "hover:text-gray-300",
                )}
              >
                KPI{sortIndicator("avgKpiScore")}
              </button>
              <button
                onClick={() => toggleSort("staffCount")}
                className={cn(
                  "px-2 py-1 rounded transition-colors",
                  sortField === "staffCount" ? "bg-[#C9A96E]/15 text-[#C9A96E]" : "hover:text-gray-300",
                )}
              >
                Staff{sortIndicator("staffCount")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-2 font-medium">Cabang</th>
                  <th className="text-center py-3 px-2 font-medium">Total Staff</th>
                  <th className="text-center py-3 px-2 font-medium">Staff Aktif</th>
                  <th className="text-center py-3 px-2 font-medium">Avg KPI Score</th>
                  <th className="text-center py-3 px-2 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : sortedBranches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      Belum ada data cabang
                    </td>
                  </tr>
                ) : (
                  sortedBranches.map((b) => {
                    const badge = getPerformanceBadge(b.avgKpiScore)
                    return (
                      <tr
                        key={b.branchId}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#731D36]/30 to-[#8B2A45]/30 flex items-center justify-center text-[10px] font-bold text-[#C9A96E]">
                              {b.branchName.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{b.branchName}</span>
                            <span className="text-[10px] text-gray-500">({b.branchCode})</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-white font-medium">{b.staffCount}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="text-green-400 font-medium">{b.activeCount}</span>
                          <span className="text-gray-500 text-xs ml-1">
                            / {b.staffCount}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              "font-semibold",
                              b.avgKpiScore >= 80
                                ? "text-yellow-300"
                                : b.avgKpiScore >= 60
                                  ? "text-gray-300"
                                  : "text-amber-600",
                            )}
                          >
                            {b.avgKpiScore.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border",
                              badge.bg,
                              badge.color,
                              badge.border,
                            )}
                          >
                            {badge.label === "Gold" && <Crown className="w-3 h-3" />}
                            {badge.label === "Silver" && <Medal className="w-3 h-3" />}
                            {badge.label === "Bronze" && <Star className="w-3 h-3" />}
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* 3. STAFF DIRECTORY                            */}
        {/* ════════════════════════════════════════════ */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#C9A96E]" />
              <h2 className="text-lg font-semibold text-white">Direktori Staff</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {staffList.length} staff
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Cari nama atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>

            {/* Branch filter */}
            <div className="relative">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="select-field text-sm pr-8 min-w-[150px]"
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            {/* Role filter */}
            <div className="relative">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="select-field text-sm pr-8 min-w-[140px]"
              >
                <option value="">Semua Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <Shield className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select-field text-sm pr-8 min-w-[130px]"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-Aktif</option>
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-2 font-medium">NIP</th>
                  <th className="text-left py-3 px-2 font-medium">Nama</th>
                  <th className="text-left py-3 px-2 font-medium">Cabang</th>
                  <th className="text-left py-3 px-2 font-medium">Role</th>
                  <th className="text-center py-3 px-2 font-medium">Status</th>
                  <th className="text-center py-3 px-2 font-medium">KPI Score</th>
                </tr>
              </thead>
              <tbody>
                {staffLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : staffList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      Tidak ada staff ditemukan
                    </td>
                  </tr>
                ) : (
                  staffList.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-2">
                        <span className="text-gray-400 font-mono text-xs">{s.nip}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#731D36]/30 to-[#C9A96E]/30 flex items-center justify-center text-[10px] font-bold text-white">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-300">{s.branch?.name ?? "—"}</td>
                      <td className="py-3 px-2">
                        <span className="text-xs bg-[#C9A96E]/10 text-[#C9A96E] px-2 py-0.5 rounded-full border border-[#C9A96E]/20">
                          {s.role?.name ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {s.kpiScore !== null ? (
                          <span
                            className={cn(
                              "font-semibold",
                              s.kpiScore >= 80
                                ? "text-yellow-300"
                                : s.kpiScore >= 60
                                  ? "text-gray-300"
                                  : "text-amber-600",
                            )}
                          >
                            {s.kpiScore.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════════════════════════════════════════ */}
        {/* 4. QUICK ACTIONS                              */}
        {/* ════════════════════════════════════════════ */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-[#C9A96E]" />
            <h2 className="text-lg font-semibold text-white">Aksi Cepat</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/admin"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#731D36]/10 border border-[#731D36]/20 hover:bg-[#731D36]/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#731D36] to-[#8B2A45] flex items-center justify-center shrink-0 shadow-md">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-white text-sm group-hover:text-[#C9A96E] transition-colors">
                  Tambah Staff
                </p>
                <p className="text-xs text-gray-500">Ke halaman admin</p>
              </div>
            </a>

            <a
              href="/reports"
              className="flex items-center gap-3 p-4 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 hover:bg-[#C9A96E]/20 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A96E] to-[#D4B98A] flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-5 h-5 text-[#1A1A2E]" />
              </div>
              <div>
                <p className="font-medium text-white text-sm group-hover:text-[#C9A96E] transition-colors">
                  Lihat Laporan
                </p>
                <p className="text-xs text-gray-500">Ke halaman laporan</p>
              </div>
            </a>

            <button
              onClick={() => {
                alert("Fitur Export Data akan segera tersedia!")
              }}
              className="flex items-center gap-3 p-4 rounded-xl bg-[#E2A6C0]/10 border border-[#E2A6C0]/20 hover:bg-[#E2A6C0]/20 transition-all duration-200 group text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E2A6C0] to-[#D495B0] flex items-center justify-center shrink-0 shadow-md">
                <Download className="w-5 h-5 text-[#1A1A2E]" />
              </div>
              <div>
                <p className="font-medium text-white text-sm group-hover:text-[#C9A96E] transition-colors">
                  Export Data
                </p>
                <p className="text-xs text-gray-500">Download CSV (segera)</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
