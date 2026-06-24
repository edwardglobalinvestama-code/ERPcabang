"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  branch?: { id: number; name: string }
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

interface OverviewData {
  totalStaff: number
  activeStaff: number
  branchCount: number
}

export default function AdminPage() {
  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false)
  const [pin, setPin] = useState("")
  const [loginError, setLoginError] = useState("")

  // ── Data ──
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [kpiLogs, setKpiLogs] = useState<KpiLog[]>([])
  const [overview, setOverview] = useState<OverviewData>({
    totalStaff: 0,
    activeStaff: 0,
    branchCount: 0,
  })
  const [roleChartData, setRoleChartData] = useState<ChartData[]>([])
  const [branchChartData, setBranchChartData] = useState<ChartData[]>([])
  const [topPerformers, setTopPerformers] = useState<
    { id: number; name: string; score: number; role: string }[]
  >([])

  // ── Filters ──
  const [branchFilter, setBranchFilter] = useState("")

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
    isActive: true,
  })
  const [staffFormError, setStaffFormError] = useState("")
  const [staffFormSuccess, setStaffFormSuccess] = useState("")
  const [staffSearch, setStaffSearch] = useState("")

  // ── Loading ──
  const [loading, setLoading] = useState(true)

  // ── Load data ──
  const loadData = async () => {
    setLoading(true)
    try {
      const params = branchFilter ? `?branchId=${branchFilter}` : ""
      const [
        overviewRes,
        branchesRes,
        rolesRes,
        staffRes,
        logsRes,
        roleChartRes,
        branchChartRes,
        topRes,
      ] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/branches"),
        fetch("/api/roles"),
        fetch(`/api/staff${params}`),
        fetch(`/api/kpi${params}&limit=20`),
        fetch("/api/admin/kpi-by-role"),
        fetch("/api/admin/kpi-by-branch"),
        fetch("/api/admin/top-performers"),
      ])

      if (overviewRes.ok) setOverview(await overviewRes.json())
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
      if (logsRes.ok) {
        const d = await logsRes.json()
        setKpiLogs(Array.isArray(d) ? d : d.data || [])
      }
      if (roleChartRes.ok) {
        const d = await roleChartRes.json()
        const arr = Array.isArray(d) ? d : d.data || []
        setRoleChartData(
          arr.map((item: { name: string; score: number }, i: number) => ({
            name: item.name,
            score: Number(item.score) || 0,
            fill: i % 2 === 0 ? "#731D36" : "#C9A96E",
          }))
        )
      }
      if (branchChartRes.ok) {
        const d = await branchChartRes.json()
        const arr = Array.isArray(d) ? d : d.data || []
        setBranchChartData(
          arr.map((item: { name: string; score: number }, i: number) => ({
            name: item.name,
            score: Number(item.score) || 0,
            fill: i % 2 === 0 ? "#C9A96E" : "#E2A6C0",
          }))
        )
      }
      if (topRes.ok) {
        const d = await topRes.json()
        setTopPerformers(Array.isArray(d) ? d : d.data || [])
      }
    } catch {
      // silent — UI shows empty state
    }
    setLoading(false)
  }

  useEffect(() => {
    if (loggedIn) loadData()
  }, [loggedIn, branchFilter])

  // ── Login ──
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "123456" || pin.length >= 4) {
      setLoggedIn(true)
      setLoginError("")
    } else {
      setLoginError("PIN salah. Coba lagi.")
    }
  }

  // ── Staff CRUD ──
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffFormError("")
    setStaffFormSuccess("")
    if (!staffForm.nip || !staffForm.name || !staffForm.pin) {
      setStaffFormError("NIP, Nama, dan PIN wajib diisi")
      return
    }
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: staffForm.nip,
          name: staffForm.name,
          phone: staffForm.phone || undefined,
          email: staffForm.email || undefined,
          pin: staffForm.pin,
          branchId: Number(staffForm.branchId),
          roleId: Number(staffForm.roleId),
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
        isActive: true,
      })
      loadData()
      setTimeout(() => setStaffFormSuccess(""), 3000)
    } catch {
      setStaffFormError("Gagal terhubung ke server")
    }
  }

  const toggleStaffActive = async (staff: Staff) => {
    try {
      await fetch(`/api/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !staff.isActive }),
      })
      loadData()
    } catch {
      // silent
    }
  }

  // ── Approve KPI ──
  const approveKpi = async (id: number) => {
    try {
      await fetch(`/api/kpi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
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

  // ── Not logged in → admin login screen ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full card space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
            <p className="text-sm text-gray-400">
              Masukkan PIN Admin untuk melanjutkan
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
              placeholder="PIN Admin"
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
            <h1 className="font-bold text-white">Admin Dashboard</h1>
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
        {/* ── Success/Error banners ── */}
        {staffFormSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg">
            {staffFormSuccess}
          </div>
        )}

        {/* ── Overview Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Total Staff
              </p>
              <p className="text-2xl font-bold text-white">
                {loading ? "—" : overview.totalStaff}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Staff Aktif
              </p>
              <p className="text-2xl font-bold text-white">
                {loading ? "—" : overview.activeStaff}
              </p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Cabang
              </p>
              <p className="text-2xl font-bold text-white">
                {loading ? "—" : overview.branchCount}
              </p>
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
              <TrendingUp className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-semibold text-white">
                Skor KPI per Peran
              </h3>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : roleChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#232340",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Score by Branch */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-white">
                Skor KPI per Cabang
              </h3>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : branchChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
                Belum ada data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={branchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    axisLine={{ stroke: "#ffffff10" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#232340",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Top Performers ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-white">
              Top Performers
            </h3>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">#</th>
                    <th className="text-left py-3 pr-4">Nama</th>
                    <th className="text-left py-3 pr-4">Peran</th>
                    <th className="text-right py-3">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            i === 0
                              ? "bg-yellow-500/20 text-yellow-400"
                              : i === 1
                              ? "bg-gray-400/20 text-gray-400"
                              : i === 2
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-white/5 text-gray-500"
                          )}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-200">{p.name}</td>
                      <td className="py-3 pr-4 text-gray-300">{p.role}</td>
                      <td className="py-3 text-right font-mono text-accent font-semibold">
                        {formatPercent(p.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Recent KPI Logs ── */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-white">
              Log KPI Terbaru
            </h3>
          </div>
          {loading ? (
            <div className="py-8 flex justify-center">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : kpiLogs.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              Belum ada log KPI
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Staff</th>
                    <th className="text-left py-3 pr-4">Kategori</th>
                    <th className="text-right py-3 pr-4">Nilai</th>
                    <th className="text-left py-3 pr-4">Tanggal</th>
                    <th className="text-left py-3 pr-4">Status</th>
                    <th className="text-right py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4 text-gray-200">
                        {log.staff?.name || "-"}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {log.category?.name || "-"}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-accent">
                        {Number(log.value).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-gray-300">
                        {formatDate(log.date)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            log.isApproved
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          )}
                        >
                          {log.isApproved ? "Disetujui" : "Menunggu"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!log.isApproved && (
                          <button
                            onClick={() => approveKpi(log.id)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Setujui"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Staff Management ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-semibold text-white">
                Manajemen Staff
              </h3>
            </div>
            <button
              onClick={() => setShowStaffForm(!showStaffForm)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Tambah Staff
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              placeholder="Cari staff..."
              className="input-field pl-10"
            />
          </div>

          {/* Create Staff Form */}
          {showStaffForm && (
            <form
              onSubmit={handleCreateStaff}
              className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/5 space-y-4"
            >
              {staffFormError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {staffFormError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">NIP *</label>
                  <input
                    value={staffForm.nip}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, nip: e.target.value })
                    }
                    className="input-field text-sm"
                    placeholder="NIP Staff"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Nama *</label>
                  <input
                    value={staffForm.name}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, name: e.target.value })
                    }
                    className="input-field text-sm"
                    placeholder="Nama Lengkap"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Phone</label>
                  <input
                    value={staffForm.phone}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, phone: e.target.value })
                    }
                    className="input-field text-sm"
                    placeholder="Nomor Telepon"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Email</label>
                  <input
                    value={staffForm.email}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, email: e.target.value })
                    }
                    className="input-field text-sm"
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">PIN *</label>
                  <input
                    value={staffForm.pin}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        pin: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="input-field text-sm"
                    placeholder="PIN (angka)"
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Cabang</label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, branchId: e.target.value })
                    }
                    className="select-field text-sm"
                  >
                    <option value="">Pilih Cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Peran</label>
                  <select
                    value={staffForm.roleId}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, roleId: e.target.value })
                    }
                    className="select-field text-sm"
                  >
                    <option value="">Pilih Peran</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowStaffForm(false)}
                  className="btn-secondary text-sm"
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary text-sm">
                  Simpan
                </button>
              </div>
            </form>
          )}

          {/* Staff Table */}
          {loading ? (
            <div className="py-8 flex justify-center">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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
                      <td
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        {staffSearch
                          ? "Tidak ada staff yang cocok"
                          : "Belum ada staff"}
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pr-4 text-gray-300 font-mono text-xs">
                          {s.nip}
                        </td>
                        <td className="py-3 pr-4 text-gray-200">{s.name}</td>
                        <td className="py-3 pr-4 text-gray-300 text-xs">
                          {s.branch?.name || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs bg-white/5 px-2 py-0.5 rounded">
                            {s.role?.name || "-"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              s.isActive
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            )}
                          >
                            {s.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toggleStaffActive(s)}
                            className={cn(
                              "text-xs flex items-center gap-1 ml-auto transition-colors",
                              s.isActive
                                ? "text-red-400 hover:text-red-300"
                                : "text-green-400 hover:text-green-300"
                            )}
                          >
                            {s.isActive ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                Nonaktifkan
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Aktifkan
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
