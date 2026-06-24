"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"
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
  Stethoscope,
  LogOut,
  Crown,
  Medal,
  Shield,
  Settings2,
  LayoutDashboard,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Pencil,
  Trash2,
  FileDown,
  AlertTriangle,
} from "lucide-react"
import { cn, formatDate, formatPercent } from "@/lib/utils"

// ── Types ──
interface Staff {
  id: number
  nip: string
  name: string
  phone?: string
  email?: string
  isActive: boolean
  branchId: number
  roleId: number
  branch?: { id: number; name: string; code?: string }
  role?: { id: number; name: string; slug: string }
  joinDate?: string
}

interface KpiLog {
  id: number
  staff: { id: number; name: string }
  category: { id: number; name: string }
  value: number
  notes?: string
  date: string
  period: string
  isApproved: boolean
}

interface Branch {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  slug: string
}

interface ChartData {
  name: string
  score: number
  fill: string
}

interface DashboardData {
  totalStaff: number
  totalActiveStaff: number
  totalBranches: number
  averageKpiScore: number
  kpiByRole: { role: { id: number; name: string; slug: string }; score: number; staffCount: number }[]
  kpiByBranch: { branch: { id: number; name: string; code: string }; score: number; staffCount: number }[]
  topPerformers: { staff: { id: number; name: string }; role: { id: number; name: string }; branch: { id: number; name: string }; score: number }[]
  recentLogs: { staff: { id: number; name: string }; category: { id: number; name: string }; value: number; target: number; score: number; date: string }[]
}

interface RolePermission {
  slug: string
  name: string
  description: string
  color: string
  canSubmitKpi: boolean
  canViewReports: boolean
  canManageStaff: boolean
  canApproveKpi: boolean
  allowedKpiSlugs: string[]
}

type TabId = "dashboard" | "staff" | "roles"

export default function AdminPage() {
  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false)
  const [authStaff, setAuthStaff] = useState<Staff | null>(null)

  // ── UI ──
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")

  // ── Data ──
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([])

  // ── Filters ──
  const [branchFilter, setBranchFilter] = useState("")
  const [staffRoleFilter, setStaffRoleFilter] = useState("")
  const [staffBranchFilter, setStaffBranchFilter] = useState("")

  // ── Staff form ──
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [staffForm, setStaffForm] = useState({
    nip: "",
    name: "",
    phone: "",
    email: "",
    pin: "",
    branchId: "",
    roleId: "",
    joinDate: "",
    isActive: true,
  })
  const [staffFormError, setStaffFormError] = useState("")
  const [staffFormSuccess, setStaffFormSuccess] = useState("")
  const [staffSearch, setStaffSearch] = useState("")

  // ── Edit / Delete ──
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // ── Loading ──
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)

  // ── Auth header helper ──
  const authHeader = (): Record<string, string> => {
    if (!authStaff) return {}
    return {
      "x-auth-staff": btoa(JSON.stringify({ staffId: authStaff.id, roleSlug: "branch-manager" })),
    }
  }

  // ── Load initial session ──
  useEffect(() => {
    const stored = sessionStorage.getItem("staff")
    const roleData = sessionStorage.getItem("role")
    if (stored && roleData) {
      const parsed = JSON.parse(stored)
      const role = JSON.parse(roleData)
      if (role?.slug === "branch-manager") {
        setAuthStaff(parsed)
        setLoggedIn(true)
      } else {
        window.location.href = "/kpi"
      }
    }
  }, [])

  // ── Load data ──
  const loadData = async () => {
    setLoading(true)
    try {
      const params = branchFilter ? `?branchId=${branchFilter}` : ""

      const [dashboardRes, branchesRes, rolesRes, staffRes, permRes] = await Promise.all([
        fetch(`/api/dashboard${params}`, { headers: authHeader() }),
        fetch("/api/branches"),
        fetch("/api/roles"),
        fetch(`/api/staff${params}`, { headers: authHeader() }),
        fetch("/api/roles/permissions"),
      ])

      if (dashboardRes.ok) setDashboard(await dashboardRes.json())
      if (branchesRes.ok) {
        const d = await branchesRes.json()
        setBranches(Array.isArray(d) ? d : d.data || [])
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json()
        setRoles(Array.isArray(d) ? d : d.data || [])
      }
      if (staffRes.ok) {
        const d = await staffRes.json()
        setStaffList(Array.isArray(d) ? d : d.data || [])
      }
      if (permRes.ok) {
        const d = await permRes.json()
        setRolePermissions(Array.isArray(d.permissions) ? d.permissions : [])
      }
    } catch (e) {
      console.error("loadData error:", e)
    }
    setLoading(false)
  }

  const loadStaffList = async () => {
    setStaffLoading(true)
    try {
      const params = new URLSearchParams()
      if (staffBranchFilter) params.set("branchId", staffBranchFilter)
      if (staffRoleFilter) params.set("roleId", staffRoleFilter)
      const qs = params.toString()
      const res = await fetch(`/api/staff${qs ? `?${qs}` : ""}`, { headers: authHeader() })
      if (res.ok) {
        const d = await res.json()
        setStaffList(Array.isArray(d) ? d : d.data || [])
      }
    } catch (e) {
      console.error("loadStaffList error:", e)
    }
    setStaffLoading(false)
  }

  useEffect(() => {
    if (loggedIn) loadData()
  }, [loggedIn, branchFilter])

  // ── Staff CRUD ──
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffFormError("")
    setStaffFormSuccess("")
    if (!staffForm.nip || !staffForm.name || !staffForm.pin) {
      setStaffFormError("NIP, Nama, dan PIN wajib diisi")
      return
    }
    if (staffForm.pin.length < 6) {
      setStaffFormError("PIN harus 6 digit angka")
      return
    }
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          nip: staffForm.nip,
          name: staffForm.name,
          phone: staffForm.phone || undefined,
          email: staffForm.email || undefined,
          pin: staffForm.pin,
          branchId: Number(staffForm.branchId),
          roleId: Number(staffForm.roleId),
          joinDate: staffForm.joinDate || undefined,
          isActive: staffForm.isActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setStaffFormError(d.error || "Gagal menyimpan")
        return
      }
      setStaffFormSuccess("Staff berhasil ditambahkan!")
      setShowStaffForm(false)
      setStaffForm({
        nip: "",
        name: "",
        phone: "",
        email: "",
        pin: "",
        branchId: "",
        roleId: "",
        joinDate: "",
        isActive: true,
      })
      loadStaffList()
      setTimeout(() => setStaffFormSuccess(""), 3000)
    } catch {
      setStaffFormError("Gagal terhubung ke server")
    }
  }

  const toggleStaffActive = async (s: Staff) => {
    try {
      await fetch(`/api/staff/toggle?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ isActive: !s.isActive }),
      })
      loadStaffList()
    } catch {
      // silent
    }
  }

  // ── Edit Staff ──
  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editStaff) return
    try {
      const body: Record<string, unknown> = {
        name: editStaff.name,
        nip: editStaff.nip,
        phone: editStaff.phone || undefined,
        email: editStaff.email || undefined,
        branchId: Number(editStaff.branchId),
        roleId: Number(editStaff.roleId),
        joinDate: editStaff.joinDate || undefined,
        isActive: editStaff.isActive,
      }
      const res = await fetch(`/api/staff/${editStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || "Gagal update")
        return
      }
      setEditStaff(null)
      loadStaffList()
    } catch {
      alert("Gagal terhubung ke server")
    }
  }

  // ── Delete Staff ──
  const handleDeleteStaff = async (id: number) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || "Gagal hapus")
        return
      }
      setDeleteConfirm(null)
      loadStaffList()
    } catch {
      alert("Gagal terhubung ke server")
    }
  }

  // ── Export CSV ──
  const exportCsv = () => {
    const headers = ["NIP", "Nama", "Phone", "Email", "Cabang", "Peran", "Status", "Join Date"]
    const csvRows = [headers.join(",")]
    staffList.forEach((s) => {
      const row = [
        s.nip, s.name, s.phone || "", s.email || "",
        s.branch?.name || "", s.role?.name || "",
        s.isActive ? "Aktif" : "Nonaktif", s.joinDate || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
      csvRows.push(row.join(","))
    })
    const csv = "\uFEFF" + csvRows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "staff_export_" + new Date().toISOString().slice(0, 10) + ".csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Approve KPI ──
  const approveKpi = async (id: number) => {
    try {
      await fetch(`/api/kpi/approve?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
      })
      loadData()
    } catch {
      // silent
    }
  }

  // ── Filter staff by search ──
  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase())
  )

  // ── Chart data from dashboard ──
  const brandColors = ["#731D36", "#C9A96E", "#E2A6C0", "#8B2A45"]
  const branchBrandColors = ["#C9A96E", "#E2A6C0", "#731D36", "#D4B98A"]

  const roleChartData: ChartData[] = (dashboard?.kpiByRole || []).map((item, i) => ({
    name: item.role.name,
    score: Number(item.score) || 0,
    fill: brandColors[i % brandColors.length],
  }))
  const branchChartData: ChartData[] = (dashboard?.kpiByBranch || []).map((item, i) => ({
    name: item.branch.name,
    score: Number(item.score) || 0,
    fill: branchBrandColors[i % branchBrandColors.length],
  }))
  const topPerformers = dashboard?.topPerformers || []
  const recentLogs = dashboard?.recentLogs || []

  // ── Tab config ──
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "staff", label: "Staff Account", icon: <Users className="w-4 h-4" /> },
    { id: "roles", label: "Role Settings", icon: <Shield className="w-4 h-4" /> },
  ]

  // ── Not logged in → redirect to landing ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        {/* Background pattern */}
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
            <p className="text-sm text-gray-400 mt-1">Admin Dashboard</p>
          </div>
          <p className="text-sm text-gray-400">
            Silakan login sebagai Branch Manager dari halaman utama
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
      {/* Background subtle gradient pattern */}
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
              <span className="hidden sm:inline text-xs text-gray-500">
                {activeTab === "dashboard" ? "Dashboard" : activeTab === "staff" ? "Staff Account" : "Role Settings"}
              </span>
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
              onClick={loadData}
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

      {/* ── Tab Navigation ── */}
      <div className="border-b border-white/5 bg-[#1A1A2E]/80 backdrop-blur-sm sticky top-[57px] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200",
                  activeTab === tab.id
                    ? "text-[#C9A96E] border-[#C9A96E]"
                    : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-600"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* ════════════════════════════════════════════ */}
        {/* TAB: DASHBOARD                              */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "dashboard" && (
          <>
            {/* ── Success/Error banners ── */}
            {staffFormSuccess && (
              <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] text-sm px-4 py-3 rounded-lg">
                {staffFormSuccess}
              </div>
            )}

            {/* ── Overview Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Total Staff - Maroon */}
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
                      {loading ? "—" : dashboard?.totalStaff ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Staff Aktif - Gold */}
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
                      {loading ? "—" : dashboard?.totalActiveStaff ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cabang - Pink Rose */}
              <div className="card relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E2A6C0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#E2A6C0]/5 blur-xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E2A6C0] to-[#F0C4D8] flex items-center justify-center shrink-0 shadow-lg shadow-[#E2A6C0]/25">
                    <Building2 className="w-6 h-6 text-[#1A1A2E]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Cabang</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "—" : dashboard?.totalBranches ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rata-rata KPI - Maroon + Gold gradient */}
              <div className="card relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#731D36]/8 to-[#C9A96E]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#731D36]/5 to-[#C9A96E]/5 blur-xl" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#731D36] via-[#8B2A45] to-[#C9A96E] flex items-center justify-center shrink-0 shadow-lg shadow-[#731D36]/25">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Rata-rata KPI</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "—" : dashboard ? formatPercent(dashboard.averageKpiScore) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Branch Filter ── */}
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="select-field max-w-xs"
              >
                <option value="">Semua Cabang</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadData}
                className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score by Role */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-[#C9A96E]" />
                  <h3 className="text-sm font-semibold text-white">Skor KPI per Peran</h3>
                </div>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
                  </div>
                ) : roleChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                    Belum ada data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={roleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#ffffff10" }} />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#ffffff10" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#232340", border: "1px solid rgba(197, 169, 110, 0.2)", borderRadius: 8, color: "#fff" }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                        {roleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Score by Branch */}
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-[#E2A6C0]" />
                  <h3 className="text-sm font-semibold text-white">Skor KPI per Cabang</h3>
                </div>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
                  </div>
                ) : branchChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                    Belum ada data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={branchChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#ffffff10" }} />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#ffffff10" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#232340", border: "1px solid rgba(226, 166, 192, 0.2)", borderRadius: 8, color: "#fff" }}
                        cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                        {branchChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Top Performers ── */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-40" />
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-[#C9A96E]" />
                <h3 className="text-sm font-semibold text-white">Top Performers</h3>
              </div>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
                </div>
              ) : topPerformers.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">Belum ada data</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="text-left py-3 pr-4">Peringkat</th>
                        <th className="text-left py-3 pr-4">Nama</th>
                        <th className="text-left py-3 pr-4">Peran</th>
                        <th className="text-left py-3 pr-4">Cabang</th>
                        <th className="text-right py-3">Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPerformers.map((p, i) => (
                        <tr key={p.staff.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4">
                            {i === 0 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#D4B98A] flex items-center justify-center shadow-lg shadow-[#C9A96E]/30">
                                <Crown className="w-4 h-4 text-[#1A1A2E]" />
                              </div>
                            ) : i === 1 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9CA3AF] to-[#D1D5DB] flex items-center justify-center shadow-lg shadow-gray-400/20">
                                <Medal className="w-4 h-4 text-[#1A1A2E]" />
                              </div>
                            ) : i === 2 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#CD7F32] to-[#D4956A] flex items-center justify-center shadow-lg shadow-[#CD7F32]/30">
                                <Medal className="w-4 h-4 text-white" />
                              </div>
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                {i + 1}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={cn(
                              "font-medium",
                              i === 0 ? "text-[#C9A96E]" : i === 1 ? "text-gray-300" : i === 2 ? "text-[#CD7F32]" : "text-gray-200"
                            )}>
                              {p.staff.name}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-300">{p.role.name}</td>
                          <td className="py-3 pr-4 text-gray-300">{p.branch.name}</td>
                          <td className="py-3 text-right font-mono font-semibold">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs",
                              i === 0 ? "bg-[#C9A96E]/15 text-[#C9A96E]" :
                              i === 1 ? "bg-gray-400/15 text-gray-300" :
                              i === 2 ? "bg-[#CD7F32]/15 text-[#CD7F32]" :
                              "bg-white/5 text-accent"
                            )}>
                              {formatPercent(p.score)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Recent KPI Logs ── */}
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E2A6C0] to-transparent opacity-40" />
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#E2A6C0]" />
                <h3 className="text-sm font-semibold text-white">Log KPI Terbaru</h3>
              </div>
              {loading ? (
                <div className="py-8 flex justify-center">
                  <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">Belum ada log KPI</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="text-left py-3 pr-4">Staff</th>
                        <th className="text-left py-3 pr-4">Kategori</th>
                        <th className="text-right py-3 pr-4">Nilai</th>
                        <th className="text-right py-3 pr-4">Skor</th>
                        <th className="text-left py-3 pr-4">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-4 text-gray-200">{log.staff?.name || "-"}</td>
                          <td className="py-3 pr-4 text-gray-300">{log.category?.name || "-"}</td>
                          <td className="py-3 pr-4 text-right font-mono text-[#E2A6C0]">
                            {Number(log.value).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono">
                            <span className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full font-medium",
                              log.score >= 80 ? "bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/20" :
                              log.score >= 50 ? "bg-[#E2A6C0]/15 text-[#E2A6C0] border border-[#E2A6C0]/20" :
                              "bg-[#731D36]/20 text-[#E2A6C0] border border-[#731D36]/30"
                            )}>
                              {formatPercent(log.score)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-gray-300">{formatDate(log.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TAB: STAFF ACCOUNT                          */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "staff" && (
          <>
            {/* Success/Error banners */}
            {staffFormSuccess && (
              <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] text-sm px-4 py-3 rounded-lg">
                {staffFormSuccess}
              </div>
            )}

            <div className="card relative overflow-hidden border-2 border-[#C9A96E]/10 hover:border-[#C9A96E]/20 transition-colors duration-300">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C9A96E]" />
                  <h3 className="text-sm font-semibold text-white">Manajemen Staff</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCsv}
                    className="btn-secondary text-sm flex items-center gap-1.5"
                    title="Export CSV"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowStaffForm(!showStaffForm)}
                    className="btn-primary text-sm flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Staff
                  </button>
                </div>
              </div>

              {/* Create Staff Form */}
              {showStaffForm && (
                <form onSubmit={handleCreateStaff} className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-[#C9A96E]/15 space-y-4">
                  {staffFormError && (
                    <div className="bg-[#731D36]/15 border border-[#731D36]/30 text-[#E2A6C0] text-sm px-4 py-3 rounded-lg">
                      {staffFormError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">NIP *</label>
                      <input
                        value={staffForm.nip}
                        onChange={(e) => setStaffForm({ ...staffForm, nip: e.target.value })}
                        className="input-field text-sm"
                        placeholder="NIP Staff"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Nama *</label>
                      <input
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Nama Lengkap"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Phone</label>
                      <input
                        value={staffForm.phone}
                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Nomor Telepon"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Email</label>
                      <input
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        className="input-field text-sm"
                        placeholder="email@example.com"
                        type="email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">PIN * (6 digit angka)</label>
                      <input
                        value={staffForm.pin}
                        onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "") })}
                        className="input-field text-sm"
                        placeholder="PIN (angka, 6 digit)"
                        maxLength={6}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Cabang *</label>
                      <select
                        value={staffForm.branchId}
                        onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                        className="select-field text-sm"
                      >
                        <option value="">Pilih Cabang</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Peran *</label>
                      <select
                        value={staffForm.roleId}
                        onChange={(e) => setStaffForm({ ...staffForm, roleId: e.target.value })}
                        className="select-field text-sm"
                      >
                        <option value="">Pilih Peran</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400">Join Date</label>
                      <input
                        value={staffForm.joinDate}
                        onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                        className="input-field text-sm"
                        type="date"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffForm.isActive}
                        onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-white/5 text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                      />
                      <span className="text-xs text-gray-400">Status Aktif</span>
                    </label>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowStaffForm(false)} className="btn-secondary text-sm">Batal</button>
                    <button type="submit" className="btn-primary text-sm">Simpan</button>
                  </div>
                </form>
              )}

              {/* Filters: Search + Role + Branch */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder="Cari staff..."
                    className="input-field pl-10"
                  />
                </div>
                <select
                  value={staffRoleFilter}
                  onChange={(e) => {
                    setStaffRoleFilter(e.target.value)
                    setTimeout(loadStaffList, 50)
                  }}
                  className="select-field text-sm max-w-[180px]"
                >
                  <option value="">Semua Peran</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <select
                  value={staffBranchFilter}
                  onChange={(e) => {
                    setStaffBranchFilter(e.target.value)
                    setTimeout(loadStaffList, 50)
                  }}
                  className="select-field text-sm max-w-[180px]"
                >
                  <option value="">Semua Cabang</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <button
                  onClick={loadStaffList}
                  className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {/* Staff Table */}
              {staffLoading || loading ? (
                <div className="py-8 flex justify-center">
                  <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                        <th className="text-left py-3 pr-4">NIP</th>
                        <th className="text-left py-3 pr-4">Nama</th>
                        <th className="text-left py-3 pr-4">Cabang</th>
                        <th className="text-left py-3 pr-4">Peran</th>
                        <th className="text-left py-3 pr-4">Status</th>
                        <th className="text-right py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            {staffSearch || staffRoleFilter || staffBranchFilter ? "Tidak ada staff yang cocok" : "Belum ada staff"}
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((s) => (
                          <tr key={s.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pr-4 text-gray-300 font-mono text-xs">{s.nip}</td>
                            <td className="py-3 pr-4 text-gray-200">{s.name}</td>
                            <td className="py-3 pr-4 text-gray-300 text-xs">{s.branch?.name || "-"}</td>
                            <td className="py-3 pr-4">
                              <span className="text-xs bg-[#731D36]/10 text-[#E2A6C0] px-2 py-0.5 rounded border border-[#731D36]/20">
                                {s.role?.name || "-"}
                              </span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={cn(
                                "text-xs px-2.5 py-0.5 rounded-full font-medium border",
                                s.isActive
                                  ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20"
                                  : "bg-[#731D36]/15 text-[#E2A6C0] border-[#731D36]/30"
                              )}>
                                {s.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setEditStaff(s)}
                                className="text-xs text-[#C9A96E] hover:text-white hover:bg-[#C9A96E]/15 transition-colors px-2 py-1 rounded-lg"
                                title="Edit Staff"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(s.id)}
                                className="text-xs text-[#E2A6C0] hover:text-white hover:bg-[#731D36]/20 transition-colors px-2 py-1 rounded-lg"
                                title="Hapus Staff"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => toggleStaffActive(s)}
                                className={cn(
                                  "text-xs flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg",
                                  s.isActive
                                    ? "text-[#E2A6C0] hover:text-white hover:bg-[#731D36]/20"
                                    : "text-[#C9A96E] hover:text-white hover:bg-[#C9A96E]/15"
                                )}
                              >
                                {s.isActive ? (
                                  <><XCircle className="w-3.5 h-3.5" /> Nonaktifkan</>
                                ) : (
                                  <><CheckCircle className="w-3.5 h-3.5" /> Aktifkan</>
                                )}
                              </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="mt-3 text-xs text-gray-500 text-right">
                    Total: {filteredStaff.length} staff
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Edit Staff Modal ── */}
        {editStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditStaff(null)}>
            <div className="card max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-50" />
              <div className="flex items-center gap-2 mb-4">
                <Pencil className="w-4 h-4 text-[#C9A96E]" />
                <h3 className="text-sm font-semibold text-white">Edit Staff</h3>
              </div>
              <form onSubmit={handleEditStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">NIP *</label>
                    <input
                      value={editStaff.nip}
                      onChange={(e) => setEditStaff({ ...editStaff, nip: e.target.value })}
                      className="input-field text-sm"
                      placeholder="NIP"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Nama *</label>
                    <input
                      value={editStaff.name}
                      onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Nama Lengkap"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Phone</label>
                    <input
                      value={editStaff.phone || ""}
                      onChange={(e) => setEditStaff({ ...editStaff, phone: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Phone"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Email</label>
                    <input
                      value={editStaff.email || ""}
                      onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
                      className="input-field text-sm"
                      placeholder="email@example.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Cabang *</label>
                    <select
                      value={editStaff.branchId}
                      onChange={(e) => setEditStaff({ ...editStaff, branchId: Number(e.target.value) })}
                      className="select-field text-sm"
                    >
                      <option value="">Pilih Cabang</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Peran *</label>
                    <select
                      value={editStaff.roleId}
                      onChange={(e) => setEditStaff({ ...editStaff, roleId: Number(e.target.value) })}
                      className="select-field text-sm"
                    >
                      <option value="">Pilih Peran</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Join Date</label>
                    <input
                      value={editStaff.joinDate || ""}
                      onChange={(e) => setEditStaff({ ...editStaff, joinDate: e.target.value })}
                      className="input-field text-sm"
                      type="date"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editStaff.isActive}
                      onChange={(e) => setEditStaff({ ...editStaff, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-white/5 text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                    />
                    <span className="text-xs text-gray-400">Status Aktif</span>
                  </label>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setEditStaff(null)} className="btn-secondary text-sm">Batal</button>
                  <button type="submit" className="btn-primary text-sm">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="card max-w-sm w-full p-6 relative text-center" onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#731D36] to-transparent opacity-50" />
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-[#731D36]/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#E2A6C0]" />
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Hapus Staff?</h3>
              <p className="text-xs text-gray-400 mb-6">
                Staff akan dihapus permanen beserta semua data KPI-nya. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="flex gap-3 justify-center">
                <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Batal</button>
                <button type="button" onClick={() => handleDeleteStaff(deleteConfirm)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#731D36] to-[#8B2A45] hover:from-[#8B2A45] hover:to-[#731D36] transition-all duration-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* TAB: ROLE SETTINGS                          */}
        {/* ════════════════════════════════════════════ */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C9A96E]" />
              <h3 className="text-sm font-semibold text-white">Pengaturan Hak Akses Peran</h3>
            </div>
            <p className="text-xs text-gray-500">
              Kelola izin dan akses setiap peran dalam sistem. Perubahan diterapkan langsung berdasarkan aturan bisnis.
            </p>

            {loading ? (
              <div className="py-8 flex justify-center">
                <span className="inline-block w-6 h-6 border-2 border-[#731D36]/30 border-t-[#731D36] rounded-full animate-spin" />
              </div>
            ) : rolePermissions.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 text-sm">Tidak ada data peran</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rolePermissions.map((perm) => (
                  <div
                    key={perm.slug}
                    className="card relative overflow-hidden group hover:border-[#C9A96E]/20 transition-colors duration-300"
                  >
                    {/* Colored accent bar */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px] opacity-60"
                      style={{ background: `linear-gradient(to right, ${perm.color}, transparent)` }}
                    />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: perm.color }}
                            />
                            <h4 className="text-sm font-semibold text-white">{perm.name}</h4>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{perm.description}</p>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded">
                          {perm.slug}
                        </span>
                      </div>

                      {/* Permission toggles */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300">Can submit KPI</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium border",
                              perm.canSubmitKpi
                                ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20"
                                : "bg-[#731D36]/10 text-[#E2A6C0] border-[#731D36]/20"
                            )}
                          >
                            {perm.canSubmitKpi ? (
                              <span className="flex items-center gap-1"><ToggleRight className="w-3 h-3" /> Yes</span>
                            ) : (
                              <span className="flex items-center gap-1"><ToggleLeft className="w-3 h-3" /> No</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300">Can view reports</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium border",
                              perm.canViewReports
                                ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20"
                                : "bg-[#731D36]/10 text-[#E2A6C0] border-[#731D36]/20"
                            )}
                          >
                            {perm.canViewReports ? (
                              <span className="flex items-center gap-1"><ToggleRight className="w-3 h-3" /> Yes</span>
                            ) : (
                              <span className="flex items-center gap-1"><ToggleLeft className="w-3 h-3" /> No</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300">Can manage staff</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium border",
                              perm.canManageStaff
                                ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20"
                                : "bg-[#731D36]/10 text-[#E2A6C0] border-[#731D36]/20"
                            )}
                          >
                            {perm.canManageStaff ? (
                              <span className="flex items-center gap-1"><ToggleRight className="w-3 h-3" /> Yes</span>
                            ) : (
                              <span className="flex items-center gap-1"><ToggleLeft className="w-3 h-3" /> No</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300">Can approve KPI</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium border",
                              perm.canApproveKpi
                                ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20"
                                : "bg-[#731D36]/10 text-[#E2A6C0] border-[#731D36]/20"
                            )}
                          >
                            {perm.canApproveKpi ? (
                              <span className="flex items-center gap-1"><ToggleRight className="w-3 h-3" /> Yes</span>
                            ) : (
                              <span className="flex items-center gap-1"><ToggleLeft className="w-3 h-3" /> No</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Allowed KPI slugs */}
                      {perm.allowedKpiSlugs.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                            KPI Categories ({perm.allowedKpiSlugs.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {perm.allowedKpiSlugs.map((slug) => (
                              <span
                                key={slug}
                                className="text-[10px] text-gray-400 bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5"
                              >
                                {slug}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
