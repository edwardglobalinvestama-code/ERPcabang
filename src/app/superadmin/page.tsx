"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Users, Building2, Shield, LogOut, UserPlus, Search,
  RefreshCw, CheckCircle, XCircle, Pencil, Trash2, FileDown,
  AlertTriangle, Lock, LayoutDashboard, Crown, Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface Staff {
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
}

export default function SuperAdminPage() {
  // ── Auth ──
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginPin, setLoginPin] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // ── Data ──
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ──
  const [staffSearch, setStaffSearch] = useState("")
  const [staffRoleFilter, setStaffRoleFilter] = useState("")
  const [staffBranchFilter, setStaffBranchFilter] = useState("")

  // ── Staff form ──
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [staffForm, setStaffForm] = useState({
    nip: "", name: "", phone: "", email: "", pin: "",
    branchId: "", roleId: "", joinDate: "", isActive: true,
  })
  const [staffFormError, setStaffFormError] = useState("")
  const [staffFormSuccess, setStaffFormSuccess] = useState("")

  // ── Edit / Delete ──
  const [editStaff, setEditStaff] = useState<Staff | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  // ── Stats ──
  const [stats, setStats] = useState({ total: 0, active: 0, branches: 0, roles: 0 })

  // ── Auth helpers ──
  const authHeader = (): Record<string, string> => {
    const sess = sessionStorage.getItem("superadmin_session")
    if (!sess) return {}
    return { "x-auth-staff": sess }
  }

  // ── Load data ──
  const loadData = async () => {
    setLoading(true)
    try {
      const [staffRes, branchesRes, rolesRes] = await Promise.all([
        fetch("/api/staff", { headers: authHeader() }),
        fetch("/api/branches"),
        fetch("/api/roles"),
      ])
      if (staffRes.ok) {
        const d = await staffRes.json()
        const list = Array.isArray(d) ? d : d.data || []
        setStaffList(list)
        setStats(s => ({ ...s, total: list.length, active: list.filter((x: Staff) => x.isActive).length }))
      }
      if (branchesRes.ok) {
        const d = await branchesRes.json()
        const list = Array.isArray(d) ? d : d.data || []
        setBranches(list)
        setStats(s => ({ ...s, branches: list.length }))
      }
      if (rolesRes.ok) {
        const d = await rolesRes.json()
        const list = Array.isArray(d) ? d : d.data || []
        setRoles(list)
        setStats(s => ({ ...s, roles: list.length }))
      }
    } catch (e) {
      console.error("load error:", e)
    }
    setLoading(false)
  }

  // ── Login handler ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginLoading(true)
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: loginPin }),
      })
      if (!res.ok) {
        const d = await res.json()
        setLoginError(d.error || "PIN salah")
        return
      }
      const d = await res.json()
      sessionStorage.setItem("superadmin_session", d.session)
      setLoggedIn(true)
    } catch {
      setLoginError("Gagal terhubung")
    }
    setLoginLoading(false)
  }

  // ── Staff CRUD ──
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffFormError("")
    setStaffFormSuccess("")
    if (!staffForm.nip || !staffForm.name || !staffForm.pin) {
      setStaffFormError("NIP, Nama, dan PIN wajib diisi"); return
    }
    if (staffForm.pin.length < 6) {
      setStaffFormError("PIN harus 6 digit"); return
    }
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          nip: staffForm.nip, name: staffForm.name,
          phone: staffForm.phone || undefined, email: staffForm.email || undefined,
          pin: staffForm.pin, branchId: Number(staffForm.branchId),
          roleId: Number(staffForm.roleId), joinDate: staffForm.joinDate || undefined,
          isActive: staffForm.isActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setStaffFormError(d.error || "Gagal menyimpan"); return
      }
      setStaffFormSuccess(`Staff ${staffForm.name} berhasil ditambahkan!`)
      setShowStaffForm(false)
      setStaffForm({ nip: "", name: "", phone: "", email: "", pin: "", branchId: "", roleId: "", joinDate: "", isActive: true })
      loadData()
      setTimeout(() => setStaffFormSuccess(""), 3000)
    } catch {
      setStaffFormError("Gagal terhubung ke server")
    }
  }

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editStaff) return
    try {
      const body: Record<string, unknown> = {
        name: editStaff.name, nip: editStaff.nip,
        phone: editStaff.phone || undefined, email: editStaff.email || undefined,
        branchId: Number(editStaff.branchId), roleId: Number(editStaff.roleId),
        joinDate: editStaff.joinDate || undefined, isActive: editStaff.isActive,
      }
      const res = await fetch(`/api/staff/${editStaff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Gagal update"); return }
      setEditStaff(null)
      loadData()
    } catch { alert("Gagal terhubung") }
  }

  const handleDeleteStaff = async (id: number) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE", headers: authHeader(),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Gagal hapus"); return }
      setDeleteConfirm(null)
      loadData()
    } catch { alert("Gagal terhubung") }
  }

  const toggleStaffActive = async (s: Staff) => {
    try {
      await fetch(`/api/staff/toggle?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ isActive: !s.isActive }),
      })
      loadData()
    } catch { /* silent */ }
  }

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
    a.href = url; a.download = `staff_all_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Logout ──
  const handleLogout = () => {
    sessionStorage.removeItem("superadmin_session")
    setLoggedIn(false)
    setLoginPin("")
  }

  // ── Init ──
  useEffect(() => {
    const sess = sessionStorage.getItem("superadmin_session")
    if (sess) {
      setLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    if (loggedIn) loadData()
  }, [loggedIn])

  // ── Filter ──
  const filteredStaff = staffList.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.nip.toLowerCase().includes(staffSearch.toLowerCase())
    const matchRole = !staffRoleFilter || s.roleId === Number(staffRoleFilter)
    const matchBranch = !staffBranchFilter || s.branchId === Number(staffBranchFilter)
    return matchSearch && matchRole && matchBranch
  })

  // ── Render ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#1A1A2E]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#731D3615,_transparent_70%),radial-gradient(ellipse_at_bottom_left,_#C9A96E10,_transparent_70%)]" />
        <div className="max-w-sm w-full card space-y-6 text-center relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#731D36] to-[#8B2A45] flex items-center justify-center shadow-lg shadow-[#731D36]/30">
            <Crown className="w-8 h-8 text-[#C9A96E]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Super Admin</h2>
            <p className="text-sm text-gray-400 mt-1">ERP KPI Inusa Clinic</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">PIN Super Admin</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ""))}
                  className="input-field pl-10 text-center tracking-[0.3em] text-lg"
                  placeholder="******"
                  maxLength={6}
                  inputMode="numeric"
                  type="password"
                />
              </div>
            </div>
            {loginError && (
              <div className="bg-[#731D36]/15 border border-[#731D36]/30 text-[#E2A6C0] text-sm px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginPin.length < 6 || loginLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Shield className="w-4 h-4" /> Masuk sebagai Super Admin</>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative bg-[#1A1A2E]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_#731D3608,_transparent_70%),radial-gradient(ellipse_at_bottom_left,_#C9A96E06,_transparent_70%)]" />

      {/* Header */}
      <header className="border-b border-white/5 bg-surface-light/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A96E] to-[#D4B98A] flex items-center justify-center shadow-sm">
              <Crown className="w-5 h-5 text-[#731D36]" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">
                Super <span className="text-[#C9A96E]">Admin</span>
              </h1>
              <p className="text-[10px] text-gray-500">ERP KPI Inusa Clinic</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadData} className="text-xs text-gray-500 hover:text-[#C9A96E] flex items-center gap-1.5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={handleLogout} className="text-xs text-[#E2A6C0] hover:text-white flex items-center gap-1.5 transition-colors bg-[#731D36]/20 hover:bg-[#731D36]/30 px-3 py-1.5 rounded-lg">
              <LogOut className="w-3.5 h-3.5" /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Staff", value: stats.total, icon: <Users className="w-4 h-4 text-[#C9A96E]" /> },
            { label: "Staff Aktif", value: stats.active, icon: <CheckCircle className="w-4 h-4 text-green-400" /> },
            { label: "Cabang", value: stats.branches, icon: <Building2 className="w-4 h-4 text-[#E2A6C0]" /> },
            { label: "Role", value: stats.roles, icon: <Shield className="w-4 h-4 text-blue-400" /> },
          ].map((card, i) => (
            <div key={i} className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A96E] to-transparent" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Staff Management */}
        <div className="card relative overflow-hidden border-2 border-[#C9A96E]/15">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-50" />

          {/* Success banner */}
          {staffFormSuccess && (
            <div className="bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] text-sm px-4 py-3 rounded-lg mb-4 mx-6 mt-6">
              {staffFormSuccess}
            </div>
          )}

          {/* Header + Actions */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C9A96E]" />
                <h3 className="text-sm font-semibold text-white">Manajemen Staff — Semua Cabang</h3>
                <span className="text-[10px] bg-[#C9A96E]/10 text-[#C9A96E] px-2 py-0.5 rounded-full border border-[#C9A96E]/20">
                  Super Admin
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-1.5" title="Export CSV">
                  <FileDown className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button onClick={() => setShowStaffForm(!showStaffForm)} className="btn-primary text-sm flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Tambah Staff
                </button>
              </div>
            </div>

            {/* Create Staff Form */}
            {showStaffForm && (
              <form onSubmit={handleCreateStaff} className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-[#C9A96E]/15 space-y-4">
                {staffFormError && (
                  <div className="bg-[#731D36]/15 border border-[#731D36]/30 text-[#E2A6C0] text-sm px-4 py-3 rounded-lg">{staffFormError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">NIP *</label>
                    <input value={staffForm.nip} onChange={(e) => setStaffForm({ ...staffForm, nip: e.target.value })} className="input-field text-sm" placeholder="NIP Staff" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Nama *</label>
                    <input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className="input-field text-sm" placeholder="Nama Lengkap" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">PIN * (6 digit)</label>
                    <input value={staffForm.pin} onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value.replace(/\D/g, "") })} className="input-field text-sm" placeholder="******" maxLength={6} inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Phone</label>
                    <input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} className="input-field text-sm" placeholder="Nomor Telepon" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Email</label>
                    <input value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className="input-field text-sm" placeholder="email@example.com" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Cabang *</label>
                    <select value={staffForm.branchId} onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })} className="select-field text-sm">
                      <option value="">Pilih Cabang</option>
                      {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Peran *</label>
                    <select value={staffForm.roleId} onChange={(e) => setStaffForm({ ...staffForm, roleId: e.target.value })} className="select-field text-sm">
                      <option value="">Pilih Peran</option>
                      {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400">Join Date</label>
                    <input value={staffForm.joinDate} onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })} className="input-field text-sm" type="date" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={staffForm.isActive} onChange={(e) => setStaffForm({ ...staffForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-600 bg-white/5 text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0" />
                      <span className="text-xs text-gray-400">Status Aktif</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowStaffForm(false)} className="btn-secondary text-sm">Batal</button>
                  <button type="submit" className="btn-primary text-sm">Simpan</button>
                </div>
              </form>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Cari staff..." className="input-field pl-10" />
              </div>
              <select value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value)} className="select-field text-sm max-w-[180px]">
                <option value="">Semua Peran</option>
                {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
              </select>
              <select value={staffBranchFilter} onChange={(e) => setStaffBranchFilter(e.target.value)} className="select-field text-sm max-w-[180px]">
                <option value="">Semua Cabang</option>
                {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
              <button onClick={loadData} className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="px-6 pb-6">
            {loading ? (
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
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">Tidak ada staff</td></tr>
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
                            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium border",
                              s.isActive ? "bg-[#C9A96E]/10 text-[#C9A96E] border-[#C9A96E]/20" : "bg-[#731D36]/15 text-[#E2A6C0] border-[#731D36]/30")}>
                              {s.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <button onClick={() => setEditStaff(s)}
                                className="text-xs text-[#C9A96E] hover:text-white hover:bg-[#C9A96E]/15 transition-colors px-2 py-1 rounded-lg" title="Edit">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteConfirm(s.id)}
                                className="text-xs text-[#E2A6C0] hover:text-white hover:bg-[#731D36]/20 transition-colors px-2 py-1 rounded-lg" title="Hapus">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => toggleStaffActive(s)}
                                className={cn("text-xs flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg",
                                  s.isActive ? "text-[#E2A6C0] hover:text-white hover:bg-[#731D36]/20" : "text-[#C9A96E] hover:text-white hover:bg-[#C9A96E]/15")}>
                                {s.isActive ? <><XCircle className="w-3.5 h-3.5" /> Nonaktifkan</> : <><CheckCircle className="w-3.5 h-3.5" /> Aktifkan</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="mt-3 text-xs text-gray-500 text-right">Total: {filteredStaff.length} staff</div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditStaff(null)}>
          <div className="card max-w-lg w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A96E] to-transparent opacity-50" />
            <div className="flex items-center gap-2 mb-4">
              <Pencil className="w-4 h-4 text-[#C9A96E]" />
              <h3 className="text-sm font-semibold text-white">Edit Staff — {editStaff.name}</h3>
            </div>
            <form onSubmit={handleEditStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">NIP *</label>
                  <input value={editStaff.nip} onChange={(e) => setEditStaff({ ...editStaff, nip: e.target.value })} className="input-field text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Nama *</label>
                  <input value={editStaff.name} onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })} className="input-field text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Phone</label>
                  <input value={editStaff.phone || ""} onChange={(e) => setEditStaff({ ...editStaff, phone: e.target.value })} className="input-field text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Email</label>
                  <input value={editStaff.email || ""} onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })} className="input-field text-sm" type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Cabang *</label>
                  <select value={editStaff.branchId} onChange={(e) => setEditStaff({ ...editStaff, branchId: Number(e.target.value) })} className="select-field text-sm">
                    {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Peran *</label>
                  <select value={editStaff.roleId} onChange={(e) => setEditStaff({ ...editStaff, roleId: Number(e.target.value) })} className="select-field text-sm">
                    {roles.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400">Join Date</label>
                  <input value={editStaff.joinDate || ""} onChange={(e) => setEditStaff({ ...editStaff, joinDate: e.target.value })} className="input-field text-sm" type="date" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editStaff.isActive} onChange={(e) => setEditStaff({ ...editStaff, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-white/5 text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0" />
                    <span className="text-xs text-gray-400">Aktif</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setEditStaff(null)} className="btn-secondary text-sm">Batal</button>
                <button type="submit" className="btn-primary text-sm">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
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
            <p className="text-xs text-gray-400 mb-6">Staff akan dihapus permanen beserta data KPI-nya. Tidak bisa dibatalkan.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Batal</button>
              <button onClick={() => handleDeleteStaff(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#731D36] to-[#8B2A45] hover:from-[#8B2A45] hover:to-[#731D36] transition-all duration-300 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
