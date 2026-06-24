"use client"

import { useState, useEffect } from "react"
import {
  PlusCircle,
  Send,
  Clock,
  TrendingUp,
  Activity,
  LogOut,
  User,
  Shield,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ListChecks,
} from "lucide-react"
import { cn, formatDate, formatCurrency } from "@/lib/utils"

// ── Types ──
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

interface Category {
  id: number
  name: string
  slug: string
  weight: number
}

interface KpiEntry {
  id: number
  categoryId: number
  category: Category
  value: number
  notes: string | null
  date: string
  period: string
  isApproved: boolean
}

interface StaffInfo {
  id: number
  name: string
  nip: string
}

// ── Categories by Role ──
const roleCategories: Record<string, { name: string; slug: string }[]> = {
  dokter: [
    { name: 'Jumlah Pasien', slug: 'jumlah-pasien' },
    { name: 'Kepuasan Pasien', slug: 'kepuasan-pasien' },
    { name: 'Ketepatan Diagnosis', slug: 'ketepatan-diagnosis' },
    { name: 'Retensi Pasien', slug: 'retensi-pasien' },
    { name: 'Upselling Produk', slug: 'upselling-dokter' },
    { name: 'Target Sales', slug: 'target-sales-dokter' },
    { name: 'Grooming & Penampilan', slug: 'grooming-dokter' },
    { name: 'Kehadiran Tepat Waktu', slug: 'kehadiran-dokter' },
  ],
  perawat: [
    { name: 'Jumlah Penanganan', slug: 'jumlah-penanganan' },
    { name: 'Kepatuhan Prosedur', slug: 'kepatuhan-prosedur' },
    { name: 'Kebersihan Ruangan', slug: 'kebersihan-ruangan' },
    { name: 'Dokumentasi Medis', slug: 'dokumentasi-medis' },
    { name: 'Upselling Produk', slug: 'upselling-perawat' },
    { name: 'Target Sales', slug: 'target-sales-perawat' },
    { name: 'Kepuasan Pasien', slug: 'kepuasan-perawat' },
    { name: 'Produktivitas', slug: 'produktivitas-perawat' },
    { name: 'Grooming & Penampilan', slug: 'grooming-perawat' },
  ],
  terapis: [
    { name: 'Jumlah Terapi', slug: 'jumlah-terapi' },
    { name: 'Kepatuhan Prosedur', slug: 'kepatuhan-prosedur-terapis' },
    { name: 'Kebersihan Ruangan', slug: 'kebersihan-ruangan-terapis' },
    { name: 'Dokumentasi Treatment', slug: 'dokumentasi-terapis' },
    { name: 'Upselling Produk', slug: 'upselling-terapis' },
    { name: 'Target Sales', slug: 'target-sales-terapis' },
    { name: 'Kepuasan Klien', slug: 'kepuasan-terapis' },
    { name: 'Produktivitas', slug: 'produktivitas-terapis' },
    { name: 'Grooming & Penampilan', slug: 'grooming-terapis' },
  ],
  cs: [
    { name: 'Jumlah Pendaftaran', slug: 'jumlah-pendaftaran' },
    { name: 'Waktu Pelayanan', slug: 'waktu-pelayanan' },
    { name: 'Kepuasan Pelanggan', slug: 'kepuasan-cs' },
    { name: 'Penanganan Keluhan', slug: 'penanganan-keluhan' },
    { name: 'Target Sales', slug: 'target-sales-cs' },
    { name: 'Upselling Produk', slug: 'upselling-cs' },
    { name: 'Zero Complain', slug: 'zero-complain-cs' },
    { name: 'Grooming & Penampilan', slug: 'grooming-cs' },
  ],
  apoteker: [
    { name: 'Akurasi Resep', slug: 'akurasi-resep' },
    { name: 'Waktu Peracikan', slug: 'waktu-peracikan' },
    { name: 'Manajemen Stok', slug: 'manajemen-stok' },
    { name: 'Kepatuhan Resep Dokter', slug: 'kepatuhan-resep' },
  ],
  'branch-manager': [
    { name: 'Target Pendapatan', slug: 'target-pendapatan' },
    { name: 'Kepuasan Pelanggan', slug: 'kepuasan-pelanggan-bm' },
    { name: 'Produktivitas Staff', slug: 'produktivitas-staff' },
    { name: 'Efisiensi Operasional', slug: 'efisiensi-operasional' },
    { name: 'Pertumbuhan Cabang', slug: 'pertumbuhan-cabang' },
    { name: 'Pencarian Event', slug: 'pencarian-event' },
    { name: 'Pencarian Influencer', slug: 'pencarian-influencer' },
    { name: 'Upselling Cabang', slug: 'upselling-bm' },
    { name: 'Target Sales Cabang', slug: 'target-sales-bm' },
    { name: 'Zero Complain', slug: 'zero-complain' },
  ],
  gudang: [
    { name: 'Ketepatan Pengiriman', slug: 'ketepatan-pengiriman' },
    { name: 'Minimal Kesalahan Stok', slug: 'minimal-kesalahan-stok' },
    { name: 'Pelaporan Stok ED', slug: 'pelaporan-stok-ed' },
    { name: 'Monitoring Stok', slug: 'monitoring-stok' },
    { name: 'SLA Distribusi', slug: 'sla-distribusi' },
    { name: 'Kelengkapan Dokumen', slug: 'kelengkapan-dokumen' },
    { name: 'Purchasing Tepat Waktu', slug: 'purchasing-tepat-waktu' },
    { name: 'Pemeliharaan Kendaraan', slug: 'pemeliharaan-kendaraan' },
    { name: 'Kebersihan & Kerapian Gudang', slug: 'kebersihan-gudang' },
  ],
}

export default function KpiPage() {
  // Session
  const [staff, setStaff] = useState<StaffInfo | null>(null)
  const [branchId, setBranchId] = useState("")
  const [roleSlug, setRoleSlug] = useState("")
  const [branches, setBranches] = useState<Branch[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [pin, setPin] = useState("")
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  // KPI form
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>(
    []
  )
  const [selectedCategory, setSelectedCategory] = useState("")
  const [kpiValue, setKpiValue] = useState("")
  const [notes, setNotes] = useState("")
  const [kpiDate, setKpiDate] = useState(new Date().toISOString().split("T")[0])
  const [period, setPeriod] = useState("daily")

  // Recent entries
  const [recentEntries, setRecentEntries] = useState<KpiEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)

  // Submit
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  // Load branches & roles on mount
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [bRes, rRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/roles"),
        ])
        if (bRes.ok) {
          const bData = await bRes.json()
          setBranches(Array.isArray(bData) ? bData : bData.data || [])
        }
        if (rRes.ok) {
          const rData = await rRes.json()
          setRoles(Array.isArray(rData) ? rData : rData.data || [])
        }
      } catch {
        // silent — fallback to hardcoded
      }
    }
    loadInitial()
  }, [])

  // Update categories when role changes
  useEffect(() => {
    if (roleSlug && roleCategories[roleSlug]) {
      setCategories(roleCategories[roleSlug])
    } else {
      setCategories([])
    }
    setSelectedCategory("")
  }, [roleSlug])

  // Load recent entries after login
  useEffect(() => {
    if (!loggedIn || !staff) return
    const loadEntries = async () => {
      setEntriesLoading(true)
      try {
        const res = await fetch(`/api/kpi?staffId=${staff.id}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setRecentEntries(Array.isArray(data) ? data : data.data || [])
        }
      } catch {
        // silent
      }
      setEntriesLoading(false)
    }
    loadEntries()
  }, [loggedIn, staff])

  // ── Login ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId || !roleSlug || !pin) {
      setLoginError("Harap isi semua bidang")
      return
    }
    setLoginLoading(true)
    setLoginError("")
    try {
      // Find the role ID from the slug
      const matchedRole = roles.find(r => r.slug === roleSlug)
      if (!matchedRole) {
        setLoginError("Role tidak ditemukan")
        setLoginLoading(false)
        return
      }
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(branchId),
          roleId: matchedRole.id,
          pin,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setLoginError(data.error || "Login gagal")
        setLoginLoading(false)
        return
      }
      const data = await res.json()
      const role = roles.find(r => r.id === matchedRole.id)
      sessionStorage.setItem("staff", JSON.stringify(data.staff))
      sessionStorage.setItem("role", JSON.stringify(role))
      setStaff({ id: data.staff.id, name: data.staff.name, nip: data.staff.nip })
      setLoggedIn(true)
    } catch {
      setLoginError("Gagal terhubung ke server")
    }
    setLoginLoading(false)
  }

  // ── Submit KPI ──
  const handleSubmitKpi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory || !kpiValue) {
      setSubmitError("Harap pilih kategori dan masukkan nilai")
      return
    }
    setSubmitting(true)
    setSubmitError("")
    setSubmitSuccess("")
    try {
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: staff!.id,
          branchId: Number(branchId),
          roleSlug,
          categorySlug: selectedCategory,
          value: Number(kpiValue),
          notes,
          date: kpiDate,
          period,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error || "Gagal menyimpan KPI")
        setSubmitting(false)
        return
      }
      const newEntry = await res.json()
      setSubmitSuccess("KPI berhasil disimpan!")
      setKpiValue("")
      setNotes("")
      setSelectedCategory("")
      setRecentEntries((prev) =>
        [newEntry, ...prev].slice(0, 10)
      )
      setTimeout(() => setSubmitSuccess(""), 3000)
    } catch {
      setSubmitError("Gagal terhubung ke server")
    }
    setSubmitting(false)
  }

  // ── Logout ──
  const handleLogout = () => {
    setLoggedIn(false)
    setStaff(null)
    setBranchId("")
    setRoleSlug("")
    setPin("")
    setRecentEntries([])
  }

  const roleDisplayName = roles.find(r => r.slug === roleSlug)?.name || roleSlug

  // ── Render ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-br from-surface via-surface to-surface-dark">
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
            Entry KPI
          </p>
        </div>

        <div className="max-w-md w-full">
          <div className="bg-surface-light rounded-2xl border border-white/5 p-8 shadow-xl shadow-black/20">
            <div className="text-center space-y-1 mb-6">
              <div className="mx-auto w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-sm text-gray-400">
                Masuk untuk mengisi data KPI
              </p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Cabang</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Peran</label>
                <select
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan PIN"
                  className="input-field text-center tracking-[0.3em]"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {loginLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-dark">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-surface-light/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
              <img
                src="/logo-inusa.png"
                alt="Inusa"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white">Entry KPI</h1>
                <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-medium">
                  {roleDisplayName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <User className="w-3 h-3 text-gray-500" />
                <p className="text-[11px] text-gray-400">{staff?.name}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 hover:bg-white/5 px-2.5 py-1.5 rounded-lg"
          >
            <LogOut className="w-3 h-3" />
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── KPI Form ── */}
        <div className="bg-surface-light rounded-2xl border border-secondary/20 shadow-xl shadow-black/10 p-6 mb-8">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
              <PlusCircle className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Input Data KPI Baru
            </h2>
          </div>

          {submitSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitKpi} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-secondary" />
                  Kategori KPI
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="select-field"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  Periode
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="select-field"
                >
                  <option value="daily">Harian (Daily)</option>
                  <option value="weekly">Mingguan (Weekly)</option>
                  <option value="monthly">Bulanan (Monthly)</option>
                </select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Nilai / Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={kpiValue}
                  onChange={(e) => setKpiValue(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  Tanggal
                </label>
                <input
                  type="date"
                  value={kpiDate}
                  onChange={(e) => setKpiDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Tambahkan catatan..."
                className="input-field resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-white font-medium px-4 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20",
                submitting && "opacity-70"
              )}
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simpan KPI
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Recent Entries ── */}
        <div className="bg-surface-light rounded-2xl border border-white/5 shadow-xl shadow-black/10 p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Entry Terbaru
            </h2>
          </div>

          {entriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">Belum ada data KPI</p>
              <p className="text-xs text-gray-600 mt-1">
                Mulai dengan mengisi form di atas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4 font-medium">Tanggal</th>
                    <th className="text-left py-3 pr-4 font-medium">Kategori</th>
                    <th className="text-right py-3 pr-4 font-medium">Nilai</th>
                    <th className="text-left py-3 pr-4 font-medium">Periode</th>
                    <th className="text-left py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={cn(
                        "transition-colors",
                        idx < recentEntries.length - 1 && "border-b border-white/5"
                      )}
                    >
                      <td className="py-3.5 pr-4 text-gray-300 font-medium whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-3.5 pr-4 text-gray-200">
                        <span className="bg-white/5 px-2.5 py-1 rounded-lg text-xs">
                          {entry.category?.name || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-right font-mono text-accent font-semibold">
                        {entry.value}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-xs bg-primary/10 text-primary-light px-2.5 py-1 rounded-lg font-medium capitalize">
                          {entry.period}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1",
                            entry.isApproved
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          )}
                        >
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            entry.isApproved ? "bg-green-400" : "bg-yellow-400"
                          )} />
                          {entry.isApproved ? "Disetujui" : "Menunggu"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
