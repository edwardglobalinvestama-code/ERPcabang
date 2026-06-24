import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Inusa Clinic ERP...\n')

  // ── Clean existing data ──
  await prisma.kpiSummary.deleteMany()
  await prisma.kpiLog.deleteMany()
  await prisma.kpiTarget.deleteMany()
  await prisma.kpiCategory.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.branch.deleteMany()
  await prisma.role.deleteMany()
  console.log('  ✓ Cleaned existing data\n')

  // ── 1. Branches ──
  const branches = await Promise.all([
    prisma.branch.create({ data: { name: 'Inusa Malang', code: 'MLG', address: 'Jl. Soekarno Hatta No. 1', city: 'Malang', phone: '0341-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Surabaya', code: 'SBY', address: 'Jl. Darmo Permai No. 5', city: 'Surabaya', phone: '031-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Jakarta', code: 'JKT', address: 'Jl. Sudirman No. 10', city: 'Jakarta', phone: '021-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Bandung', code: 'BDG', address: 'Jl. Riau No. 15', city: 'Bandung', phone: '022-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Semarang', code: 'SMG', address: 'Jl. Pandanaran No. 8', city: 'Semarang', phone: '024-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Yogyakarta', code: 'YGK', address: 'Jl. Malioboro No. 20', city: 'Yogyakarta', phone: '0274-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Solo', code: 'SLO', address: 'Jl. Slamet Riyadi No. 12', city: 'Solo', phone: '0271-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Denpasar', code: 'DPS', address: 'Jl. Sunset Road No. 3', city: 'Denpasar', phone: '0361-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Makassar', code: 'MKS', address: 'Jl. Pettarani No. 7', city: 'Makassar', phone: '0411-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Medan', code: 'MDN', address: 'Jl. Merdeka No. 25', city: 'Medan', phone: '061-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Palembang', code: 'PLG', address: 'Jl. Sudirman No. 30', city: 'Palembang', phone: '0711-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Balikpapan', code: 'BPN', address: 'Jl. MT Haryono No. 5', city: 'Balikpapan', phone: '0542-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Lombok', code: 'LMB', address: 'Jl. Pejanggik No. 2', city: 'Lombok', phone: '0370-123456' } }),
    prisma.branch.create({ data: { name: 'Inusa Batam', code: 'BTM', address: 'Jl. Nagoya No. 50', city: 'Batam', phone: '0778-123456' } }),
    prisma.branch.create({ data: { name: 'Vanderlab Athletic Recovery', code: 'VDR', address: 'Jl. Gym No. 1', city: 'Malang', phone: '0341-999999' } }),
  ])
  console.log(`  ✓ Created ${branches.length} branches`)

  // ── 2. Roles ──
  const roles = await Promise.all([
    prisma.role.create({ data: { name: 'Dokter', slug: 'dokter', description: 'Dokter klinik' } }),
    prisma.role.create({ data: { name: 'Branch Manager', slug: 'branch-manager', description: 'Manager cabang' } }),
    prisma.role.create({ data: { name: 'Perawat', slug: 'perawat', description: 'Perawat klinik' } }),
    prisma.role.create({ data: { name: 'Terapis', slug: 'terapis', description: 'Terapis treatment' } }),
    prisma.role.create({ data: { name: 'Customer Service', slug: 'cs', description: 'Customer service' } }),
    prisma.role.create({ data: { name: 'Apoteker', slug: 'apoteker', description: 'Apoteker' } }),
    prisma.role.create({ data: { name: 'Gudang', slug: 'gudang', description: 'Staff gudang & logistik' } }),
    prisma.role.create({ data: { name: 'Coach', slug: 'coach', description: 'Personal trainer & gym staff' } }),
  ])
  console.log(`  ✓ Created ${roles.length} roles`)

  // ── 3. KPI Categories (expanded) ──
  const roleMap = Object.fromEntries(roles.map(r => [r.slug, r.id]))

  const categoryData = [
    // Dokter (8 categories)
    { name: 'Jumlah Pasien', slug: 'jumlah-pasien', description: 'Total pasien ditangani', weight: 2.0, roleId: roleMap['dokter'] },
    { name: 'Kepuasan Pasien', slug: 'kepuasan-pasien', description: 'Tingkat kepuasan pasien', weight: 1.5, roleId: roleMap['dokter'] },
    { name: 'Ketepatan Diagnosis', slug: 'ketepatan-diagnosis', description: 'Akurasi diagnosis', weight: 2.0, roleId: roleMap['dokter'] },
    { name: 'Retensi Pasien', slug: 'retensi-pasien', description: 'Pasien kembali', weight: 1.0, roleId: roleMap['dokter'] },
    { name: 'Upselling Produk', slug: 'upselling-dokter', description: 'Penjualan produk tambahan', weight: 1.5, roleId: roleMap['dokter'] },
    { name: 'Target Sales', slug: 'target-sales-dokter', description: 'Pencapaian target penjualan', weight: 2.0, roleId: roleMap['dokter'] },
    { name: 'Grooming & Penampilan', slug: 'grooming-dokter', description: 'Penampilan dan kerapihan', weight: 1.0, roleId: roleMap['dokter'] },
    { name: 'Kehadiran Tepat Waktu', slug: 'kehadiran-dokter', description: 'Presensi dan ketepatan waktu', weight: 1.0, roleId: roleMap['dokter'] },
    // Branch Manager (10 categories)
    { name: 'Target Pendapatan', slug: 'target-pendapatan', description: 'Pencapaian revenue', weight: 2.5, roleId: roleMap['branch-manager'] },
    { name: 'Kepuasan Pelanggan', slug: 'kepuasan-pelanggan-bm', description: 'Rating pelanggan cabang', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Produktivitas Staff', slug: 'produktivitas-staff', description: 'Efisiensi staff', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Efisiensi Operasional', slug: 'efisiensi-operasional', description: 'Biaya operasional', weight: 1.0, roleId: roleMap['branch-manager'] },
    { name: 'Pertumbuhan Cabang', slug: 'pertumbuhan-cabang', description: 'Growth bulanan', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Pencarian Event', slug: 'pencarian-event', description: 'Event dan promosi', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Pencarian Influencer', slug: 'pencarian-influencer', description: 'Kerjasama influencer', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Upselling Cabang', slug: 'upselling-bm', description: 'Penjualan produk tambahan cabang', weight: 1.0, roleId: roleMap['branch-manager'] },
    { name: 'Target Sales Cabang', slug: 'target-sales-bm', description: 'Target penjualan cabang', weight: 2.0, roleId: roleMap['branch-manager'] },
    { name: 'Zero Complain', slug: 'zero-complain', description: 'Tidak ada komplain pelanggan', weight: 2.0, roleId: roleMap['branch-manager'] },
    // Perawat (9 categories)
    { name: 'Jumlah Penanganan', slug: 'jumlah-penanganan', description: 'Pasien dirawat', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Kepatuhan Prosedur', slug: 'kepatuhan-prosedur', description: 'SOP compliance', weight: 2.0, roleId: roleMap['perawat'] },
    { name: 'Kebersihan Ruangan', slug: 'kebersihan-ruangan', description: 'Kebersihan area kerja', weight: 1.0, roleId: roleMap['perawat'] },
    { name: 'Dokumentasi Medis', slug: 'dokumentasi-medis', description: 'Kelengkapan rekam medis', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Upselling Produk', slug: 'upselling-perawat', description: 'Penjualan produk tambahan', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Target Sales', slug: 'target-sales-perawat', description: 'Pencapaian target penjualan', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Kepuasan Pasien', slug: 'kepuasan-perawat', description: 'Feedback kepuasan pasien', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Produktivitas', slug: 'produktivitas-perawat', description: 'Produktivitas kerja', weight: 1.0, roleId: roleMap['perawat'] },
    { name: 'Grooming & Penampilan', slug: 'grooming-perawat', description: 'Penampilan dan kerapihan', weight: 1.0, roleId: roleMap['perawat'] },
    // Terapis (9 categories)
    { name: 'Jumlah Terapi', slug: 'jumlah-terapi', description: 'Sesi terapi dilakukan', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Kepatuhan Prosedur', slug: 'kepatuhan-prosedur-terapis', description: 'Kepatuhan SOP terapi', weight: 2.0, roleId: roleMap['terapis'] },
    { name: 'Kebersihan Ruangan', slug: 'kebersihan-ruangan-terapis', description: 'Kebersihan area terapi', weight: 1.0, roleId: roleMap['terapis'] },
    { name: 'Dokumentasi Treatment', slug: 'dokumentasi-terapis', description: 'Kelengkapan dokumentasi terapi', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Upselling Produk', slug: 'upselling-terapis', description: 'Penjualan produk tambahan', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Target Sales', slug: 'target-sales-terapis', description: 'Pencapaian target penjualan', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Kepuasan Klien', slug: 'kepuasan-terapis', description: 'Feedback kepuasan klien', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Produktivitas', slug: 'produktivitas-terapis', description: 'Produktivitas kerja', weight: 1.0, roleId: roleMap['terapis'] },
    { name: 'Grooming & Penampilan', slug: 'grooming-terapis', description: 'Penampilan dan kerapihan', weight: 1.0, roleId: roleMap['terapis'] },
    // CS (8 categories)
    { name: 'Jumlah Pendaftaran', slug: 'jumlah-pendaftaran', description: 'Pasien didaftarkan', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Waktu Pelayanan', slug: 'waktu-pelayanan', description: 'Kecepatan layanan', weight: 2.0, roleId: roleMap['cs'] },
    { name: 'Kepuasan Pelanggan', slug: 'kepuasan-cs', description: 'Rating CS', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Penanganan Keluhan', slug: 'penanganan-keluhan', description: 'Komplain terselesaikan', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Target Sales', slug: 'target-sales-cs', description: 'Pencapaian target penjualan', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Upselling Produk', slug: 'upselling-cs', description: 'Penjualan produk tambahan', weight: 1.0, roleId: roleMap['cs'] },
    { name: 'Zero Complain', slug: 'zero-complain-cs', description: 'Tidak ada komplain', weight: 2.0, roleId: roleMap['cs'] },
    { name: 'Grooming & Penampilan', slug: 'grooming-cs', description: 'Penampilan dan kerapihan', weight: 1.0, roleId: roleMap['cs'] },
    // Apoteker (4 categories)
    { name: 'Akurasi Resep', slug: 'akurasi-resep', description: 'Ketepatan peracikan', weight: 2.5, roleId: roleMap['apoteker'] },
    { name: 'Waktu Peracikan', slug: 'waktu-peracikan', description: 'Kecepatan meracik', weight: 1.5, roleId: roleMap['apoteker'] },
    { name: 'Manajemen Stok', slug: 'manajemen-stok', description: 'Akurasi stok obat', weight: 2.0, roleId: roleMap['apoteker'] },
    { name: 'Kepatuhan Resep Dokter', slug: 'kepatuhan-resep', description: 'Verifikasi resep dokter', weight: 1.5, roleId: roleMap['apoteker'] },
    // Gudang (9 categories)
    { name: 'Ketepatan Pengiriman', slug: 'ketepatan-pengiriman', description: 'Ketepatan pengiriman barang', weight: 2.0, roleId: roleMap['gudang'] },
    { name: 'Minimal Kesalahan Stok', slug: 'minimal-kesalahan-stok', description: 'Akurasi stok gudang', weight: 2.0, roleId: roleMap['gudang'] },
    { name: 'Pelaporan Stok ED', slug: 'pelaporan-stok-ed', description: 'Pelaporan stok expired', weight: 1.5, roleId: roleMap['gudang'] },
    { name: 'Monitoring Stok', slug: 'monitoring-stok', description: 'Monitoring stok berkala', weight: 1.5, roleId: roleMap['gudang'] },
    { name: 'SLA Distribusi', slug: 'sla-distribusi', description: 'SLA distribusi barang', weight: 1.5, roleId: roleMap['gudang'] },
    { name: 'Kelengkapan Dokumen', slug: 'kelengkapan-dokumen', description: 'Kelengkapan dokumen gudang', weight: 1.5, roleId: roleMap['gudang'] },
    { name: 'Purchasing Tepat Waktu', slug: 'purchasing-tepat-waktu', description: 'Ketepatan waktu purchasing', weight: 2.0, roleId: roleMap['gudang'] },
    { name: 'Pemeliharaan Kendaraan', slug: 'pemeliharaan-kendaraan', description: 'Perawatan kendaraan operasional', weight: 1.0, roleId: roleMap['gudang'] },
    { name: 'Kebersihan & Kerapian Gudang', slug: 'kebersihan-gudang', description: 'Kebersihan dan kerapian gudang', weight: 1.0, roleId: roleMap['gudang'] },
  ]

  const categories: any[] = []
  for (const c of categoryData) {
    const { roleId, ...catFields } = c
    categories.push(await prisma.kpiCategory.create({ data: catFields }))
  }
  console.log(`  ✓ Created ${categories.length} KPI categories`)

  // ── Vanderlab Gym KPI Categories ──
  const vanderlabCategoriesData = [
    { name: 'Jumlah Member Aktif', slug: 'jumlah-member-aktif', weight: 2, description: 'Target jumlah member aktif bulan ini' },
    { name: 'Retensi Member', slug: 'retensi-member', weight: 2, description: 'Persentase member yang renew membership' },
    { name: 'Sesi Personal Training', slug: 'sesi-personal-training', weight: 1.5, description: 'Jumlah sesi PT yang terjual' },
    { name: 'Kebersihan & Perawatan Alat', slug: 'kebersihan-alat-gym', weight: 1.5, description: 'Skor kebersihan & perawatan alat gym' },
    { name: 'Kepuasan Member', slug: 'kepuasan-member', weight: 1.5, description: 'Survey kepuasan member' },
    { name: 'Akuisisi Member Baru', slug: 'akuisisi-member-baru', weight: 2, description: 'Jumlah member baru per bulan' },
    { name: 'Target Revenue', slug: 'target-revenue-gym', weight: 2.5, description: 'Target pendapatan gym' },
    { name: 'Upselling Paket', slug: 'upselling-paket-gym', weight: 1, description: 'Penjualan paket tambahan & suplemen' },
  ]
  const vanderlabCategories = await Promise.all(
    vanderlabCategoriesData.map(c => prisma.kpiCategory.create({ data: c }))
  )
  console.log(`  ✓ Created ${vanderlabCategories.length} Vanderlab gym KPI categories`)

  // ── 4. KPI Targets ──
  const catRoleMap = new Map<string, number[]>()
  const targetValues: Record<string, Record<string, number>> = {
    'dokter': { 'jumlah-pasien': 100, 'kepuasan-pasien': 90, 'ketepatan-diagnosis': 95, 'retensi-pasien': 70, 'upselling-dokter': 5000000, 'target-sales-dokter': 30000000, 'grooming-dokter': 95, 'kehadiran-dokter': 98 },
    'branch-manager': { 'target-pendapatan': 500000000, 'kepuasan-pelanggan-bm': 90, 'produktivitas-staff': 85, 'efisiensi-operasional': 90, 'pertumbuhan-cabang': 10, 'pencarian-event': 3, 'pencarian-influencer': 5, 'upselling-bm': 10000000, 'target-sales-bm': 100000000, 'zero-complain': 100 },
    'perawat': { 'jumlah-penanganan': 80, 'kepatuhan-prosedur': 95, 'kebersihan-ruangan': 95, 'dokumentasi-medis': 90, 'upselling-perawat': 3000000, 'target-sales-perawat': 15000000, 'kepuasan-perawat': 90, 'produktivitas-perawat': 85, 'grooming-perawat': 95 },
    'terapis': { 'jumlah-terapi': 60, 'kepatuhan-prosedur-terapis': 95, 'kebersihan-ruangan-terapis': 95, 'dokumentasi-terapis': 90, 'upselling-terapis': 5000000, 'target-sales-terapis': 20000000, 'kepuasan-terapis': 90, 'produktivitas-terapis': 85, 'grooming-terapis': 95 },
    'cs': { 'jumlah-pendaftaran': 150, 'waktu-pelayanan': 5, 'kepuasan-cs': 90, 'penanganan-keluhan': 100, 'target-sales-cs': 10000000, 'upselling-cs': 3000000, 'zero-complain-cs': 100, 'grooming-cs': 95 },
    'apoteker': { 'akurasi-resep': 100, 'waktu-peracikan': 10, 'manajemen-stok': 95, 'kepatuhan-resep': 100 },
    'gudang': { 'ketepatan-pengiriman': 98, 'minimal-kesalahan-stok': 95, 'pelaporan-stok-ed': 100, 'monitoring-stok': 95, 'sla-distribusi': 90, 'kelengkapan-dokumen': 100, 'purchasing-tepat-waktu': 95, 'pemeliharaan-kendaraan': 90, 'kebersihan-gudang': 90 },
  }

  const categoryRoleMap: Record<string, number> = {}
  for (const cat of categories) {
    categoryRoleMap[cat.slug] = cat.id
  }

  let targetCount = 0
  for (const role of roles) {
    const roleTargets = targetValues[role.slug] || {}
    for (const [catSlug, val] of Object.entries(roleTargets)) {
      const catId = categoryRoleMap[catSlug]
      if (catId) {
        await prisma.kpiTarget.create({
          data: { roleId: role.id, categoryId: catId, targetValue: val, targetDesc: `Target ${role.name} - ${catSlug}`, period: 'monthly' }
        })
        targetCount++
      }
    }
  }
  console.log(`  ✓ Created ${targetCount} KPI targets`)

  // ── 5. Staff (sample: 2 per role x 2 branches) ──
  const pinHash = bcrypt.hashSync('123456', 10)
  const sampleNames: Record<string, string[]> = {
    'dokter': ['Dr. Andi', 'Dr. Siti', 'Dr. Rina'],
    'branch-manager': ['Budi Santoso', 'Rina Wijaya', 'Agus Prasetyo'],
    'perawat': ['Dewi Lestari', 'Ahmad Hidayat', 'Sari Dewi'],
    'terapis': ['Maya Putri', 'Rudi Hermawan', 'Indah Permata'],
    'cs': ['Ani Susanti', 'Deni Pratama', 'Fitriani'],
    'apoteker': ['Fitri Handayani', 'Irfan Maulana'],
    'gudang': ['Hendra Gunawan', 'Bambang Supriyadi', 'Dwi Hartono'],
  }

  let staffCount = 0
  const staffRoles: Record<string, number> = {}
  for (const r of roles) staffRoles[r.slug] = r.id

  const staffData: any[] = []
  for (const role of roles) {
    const names = sampleNames[role.slug] || ['Staff 1', 'Staff 2']
    for (let i = 0; i < names.length; i++) {
      for (const branch of [branches[0], branches[1]]) { // MLG + SBY
        const nip = `STF-${branch.code}-${role.slug.toUpperCase().substring(0, 3)}-${String(i + 1).padStart(3, '0')}`
        staffData.push({
          nip, name: names[i], pin: pinHash, branchId: branch.id, roleId: role.id,
          phone: '08123456789', email: `${names[i].toLowerCase().replace(/\s/g, '.')}@inusa.co.id`,
          isActive: true, joinDate: new Date('2026-01-01'),
        })
      }
    }
  }
  for (const s of staffData) {
    await prisma.staff.create({ data: s })
    staffCount++
  }
  console.log(`  ✓ Created ${staffCount} staff members`)

  // ── Vanderlab Staff ──
  const vanderlabBranch = branches[14]
  const coachRole = roles[7]
  const vanderlabStaffData = [
    { nip: 'STF-VDR-BM-001', name: 'Rizky Pratama', pin: pinHash, branchId: vanderlabBranch.id, roleId: coachRole.id, phone: '08123456780', email: 'rizky.pratama@vanderlab.id', isActive: true, joinDate: new Date('2026-06-01') },
    { nip: 'STF-VDR-CCH-001', name: 'Ahmad Fauzi', pin: pinHash, branchId: vanderlabBranch.id, roleId: coachRole.id, phone: '08123456781', email: 'ahmad.fauzi@vanderlab.id', isActive: true, joinDate: new Date('2026-06-01') },
    { nip: 'STF-VDR-CCH-002', name: 'Dian Permata', pin: pinHash, branchId: vanderlabBranch.id, roleId: coachRole.id, phone: '08123456782', email: 'dian.permata@vanderlab.id', isActive: true, joinDate: new Date('2026-06-01') },
  ]
  for (const s of vanderlabStaffData) {
    await prisma.staff.create({ data: s })
    staffCount++
  }
  console.log(`  ✓ Added ${vanderlabStaffData.length} Vanderlab staff members`)

  // ── 6. Sample KPI Logs (3 months) ──
  const allStaff = await prisma.staff.findMany()
  const allCategories = await prisma.kpiCategory.findMany()
  const allTargets = await prisma.kpiTarget.findMany()

  let logCount = 0
  const months = [0, 1, 2] // last 3 months
  for (const staff of allStaff) {
    const roleTargets = allTargets.filter(t => t.roleId === staff.roleId)
    const roleCategories = allCategories.filter(c => roleTargets.some(t => t.categoryId === c.id))

    for (const monthOffset of months) {
      const d = new Date(2026, 3 + monthOffset, 15)
      for (const cat of roleCategories) {
        const target = roleTargets.find(t => t.categoryId === cat.id)
        const baseVal = target ? Number(target.targetValue) : 50
        const variance = 0.7 + Math.random() * 0.5 // 70-120% achievement
        const actualVal = Math.round(baseVal * variance * 100) / 100

        await prisma.kpiLog.create({
          data: {
            staffId: staff.id,
            categoryId: cat.id,
            branchId: staff.branchId,
            roleId: staff.roleId,
            value: actualVal,
            notes: `KPI ${cat.name} - ${d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
            date: d,
            period: 'monthly',
            isApproved: variance > 0.8,
          }
        })
        logCount++
      }
    }
  }
  console.log(`  ✓ Created ${logCount} KPI logs`)

  // ── 7. KPI Summaries ──
  const allKpiLogs = await prisma.kpiLog.findMany()
  const summaryMap = new Map<string, { actual: number; target: number; count: number }>()

  for (const log of allKpiLogs) {
    const target = allTargets.find(t => t.categoryId === log.categoryId && t.roleId === log.roleId)
    const month = log.date.toISOString().substring(0, 7)
    const key = `${log.staffId}|${log.categoryId}|${month}`
    if (!summaryMap.has(key)) {
      summaryMap.set(key, { actual: 0, target: target ? Number(target.targetValue) : 0, count: 0 })
    }
    const entry = summaryMap.get(key)!
    entry.actual += Number(log.value)
    entry.count++
  }

  let summaryCount = 0
  for (const [key, val] of summaryMap) {
    const [staffIdStr, categoryIdStr, monthStr] = key.split('|')
    const staffId = parseInt(staffIdStr)
    const categoryId = parseInt(categoryIdStr)
    const staff = allStaff.find(s => s.id === staffId)
    if (!staff) continue
    const avgActual = val.count > 0 ? val.actual / val.count : 0
    const score = val.target > 0 ? Math.min(100, Math.round((avgActual / val.target) * 100 * 100) / 100) : 0

    const periodStart = new Date(monthStr + '-01')
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0)

    try {
      await prisma.kpiSummary.upsert({
        where: {
          staffId_categoryId_period_periodStart: { staffId, categoryId, period: 'monthly', periodStart },
        },
        create: {
          staffId, branchId: staff.branchId, roleId: staff.roleId, categoryId,
          period: 'monthly', periodStart, periodEnd,
          targetValue: val.target, actualValue: avgActual, score,
        },
        update: {
          actualValue: avgActual, score,
        },
      })
      summaryCount++
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`  ✓ Created ${summaryCount} KPI summaries`)

  console.log('\n✅ Seeding complete!\n')
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
