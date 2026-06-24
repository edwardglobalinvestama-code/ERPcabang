"use client"

import { useState, useEffect } from "react"
import {
  PlusCircle,
  Send,
  Clock,
  TrendingUp,
  Filter,
  Activity,
  Stethoscope,
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
    { name: "Jumlah Pasien", slug: "jumlah-pasien" },
    { name: "Kepuasan Pasien", slug: "kepuasan-pasien" },
    { name: "Ketepatan Diagnosis", slug: "ketepatan-diagnosis" },
    { name: "Kepatuhan Rekam Medis", slug: "kepatuhan-rekam-medis" },
  ],
  perawat: [
    { name: "Jumlah Tindakan Keperawatan", slug: "jumlah-tindakan" },
    { name: "Ketepatan Dokumentasi", slug: "ketepatan-dokumentasi" },
    { name: "Kepuasan Pasien", slug: "kepuasan-pasien" },
    { name: "Ketepatan Waktu Shift", slug: "ketepatan-shift" },
  ],
  apoteker: [
    { name: "Jumlah Resep Dilayani", slug: "jumlah-resep" },
    { name: "Ketepatan Waktu Pelayanan", slug: "ketepatan-waktu" },
    { name: "Selisih Stok Obat", slug: "selisih-stok" },
  ],
  "staff-administrasi": [
    { name: "Pendaftaran Pasien", slug: "pendaftaran-pasien" },
    { name: "Ketepatan Data", slug: "ketepatan-data" },
    { name: "Penyelesaian Klaim", slug: "penyelesaian-klaim" },
  ],
  manajer: [
    { name: "Kinerja Operasional", slug: "kinerja-operasional" },
    { name: "Pendapatan", slug: "pendapatan" },
    { name: "Efisiensi Biaya", slug: "efisiensi-biaya" },
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: Number(branchId),
          roleSlug,
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
      setStaff({ id: data.id, name: data.name, nip: data.nip })
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

  // ── Render ──
  if (!loggedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-md w-full">
          <div className="card space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Entry KPI</h2>
              <p className="text-sm text-gray-400">
                Masuk untuk mengisi data KPI
              </p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300">Cabang</label>
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
                <label className="text-sm text-gray-300">Peran</label>
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
                <label className="text-sm text-gray-300">PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Masukkan PIN"
                  className="input-field"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
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
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-surface-light/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-sm font-bold text-white">Entry KPI</h1>
              <p className="text-[11px] text-gray-400">{staff?.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── KPI Form ── */}
        <div className="card mb-8">
          <div className="flex items-center gap-2 mb-6">
            <PlusCircle className="w-5 h-5 text-secondary" />
            <h2 className="text-lg font-semibold text-white">
              Input Data KPI Baru
            </h2>
          </div>

          {submitSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmitKpi} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-300">Kategori KPI</label>
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
                <label className="text-sm text-gray-300">Periode</label>
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
                <label className="text-sm text-gray-300">Nilai / Value</label>
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
                <label className="text-sm text-gray-300">Tanggal</label>
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
              <label className="text-sm text-gray-300">Catatan (opsional)</label>
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
                "btn-primary w-full flex items-center justify-center gap-2",
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
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">
              Entry Terbaru
            </h2>
          </div>

          {entriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="inline-block w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Belum ada data KPI</p>
              <p className="text-xs text-gray-600 mt-1">
                Mulai dengan mengisi form di atas
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 pr-4">Tanggal</th>
                    <th className="text-left py-3 pr-4">Kategori</th>
                    <th className="text-right py-3 pr-4">Nilai</th>
                    <th className="text-left py-3 pr-4">Periode</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 pr-4 text-gray-300">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-3 pr-4 text-gray-200">
                        {entry.category?.name || "-"}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-accent">
                        {entry.value}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs bg-white/5 px-2 py-1 rounded">
                          {entry.period}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            entry.isApproved
                              ? "bg-green-500/10 text-green-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          )}
                        >
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
