import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

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
  ])
  console.log(`  ✓ Created ${roles.length} roles`)

  // ── 3. KPI Categories (4 per role) ──
  const roleMap = Object.fromEntries(roles.map(r => [r.slug, r.id]))

  const categoryData = [
    // Dokter
    { name: 'Jumlah Pasien', slug: 'jumlah-pasien', description: 'Total pasien ditangani', weight: 2.0, roleId: roleMap['dokter'] },
    { name: 'Kepuasan Pasien', slug: 'kepuasan-pasien', description: 'Tingkat kepuasan pasien', weight: 1.5, roleId: roleMap['dokter'] },
    { name: 'Ketepatan Diagnosis', slug: 'ketepatan-diagnosis', description: 'Akurasi diagnosis', weight: 2.0, roleId: roleMap['dokter'] },
    { name: 'Retensi Pasien', slug: 'retensi-pasien', description: 'Pasien kembali', weight: 1.0, roleId: roleMap['dokter'] },
    // Branch Manager
    { name: 'Target Pendapatan', slug: 'target-pendapatan', description: 'Pencapaian revenue', weight: 2.5, roleId: roleMap['branch-manager'] },
    { name: 'Kepuasan Pelanggan', slug: 'kepuasan-pelanggan', description: 'Rating pelanggan', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Produktivitas Staff', slug: 'produktivitas-staff', description: 'Efisiensi staff', weight: 1.5, roleId: roleMap['branch-manager'] },
    { name: 'Efisiensi Operasional', slug: 'efisiensi-operasional', description: 'Biaya operasional', weight: 1.0, roleId: roleMap['branch-manager'] },
    { name: 'Pertumbuhan Cabang', slug: 'pertumbuhan-cabang', description: 'Growth bulanan', weight: 1.0, roleId: roleMap['branch-manager'] },
    // Perawat
    { name: 'Jumlah Penanganan', slug: 'jumlah-penanganan', description: 'Pasien dirawat', weight: 1.5, roleId: roleMap['perawat'] },
    { name: 'Kepatuhan Prosedur', slug: 'kepatuhan-prosedur', description: 'SOP compliance', weight: 2.0, roleId: roleMap['perawat'] },
    { name: 'Kebersihan Ruangan', slug: 'kebersihan-ruangan', description: 'Kebersihan area kerja', weight: 1.0, roleId: roleMap['perawat'] },
    { name: 'Dokumentasi Medis', slug: 'dokumentasi-medis', description: 'Kelengkapan rekam medis', weight: 1.5, roleId: roleMap['perawat'] },
    // Terapis
    { name: 'Jumlah Terapi', slug: 'jumlah-terapi', description: 'Sesi terapi dilakukan', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Kepuasan Klien', slug: 'kepuasan-klien', description: 'Feedback klien', weight: 1.5, roleId: roleMap['terapis'] },
    { name: 'Upselling Produk', slug: 'upselling-produk', description: 'Penjualan produk tambahan', weight: 1.0, roleId: roleMap['terapis'] },
    { name: 'Ketepatan Waktu', slug: 'kehadiran-tepat-waktu', description: 'Presensi & jadwal', weight: 1.0, roleId: roleMap['terapis'] },
    // CS
    { name: 'Jumlah Pendaftaran', slug: 'jumlah-pendaftaran', description: 'Pasien didaftarkan', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Waktu Pelayanan', slug: 'waktu-pelayanan', description: 'Kecepatan layanan', weight: 2.0, roleId: roleMap['cs'] },
    { name: 'Kepuasan Pelanggan CS', slug: 'kepuasan-cs', description: 'Rating CS', weight: 1.5, roleId: roleMap['cs'] },
    { name: 'Penanganan Keluhan', slug: 'penanganan-keluhan', description: 'Komplain terselesaikan', weight: 1.5, roleId: roleMap['cs'] },
    // Apoteker
    { name: 'Akurasi Resep', slug: 'akurasi-resep', description: 'Ketepatan peracikan', weight: 2.5, roleId: roleMap['apoteker'] },
    { name: 'Waktu Peracikan', slug: 'waktu-peracikan', description: 'Kecepatan meracik', weight: 1.5, roleId: roleMap['apoteker'] },
    { name: 'Manajemen Stok', slug: 'manajemen-stok', description: 'Akurasi stok obat', weight: 2.0, roleId: roleMap['apoteker'] },
    { name: 'Kepatuhan Resep', slug: 'kepatuhan-resep', description: 'Verifikasi resep dokter', weight: 1.5, roleId: roleMap['apoteker'] },
  ]

  const categories: any[] = []
  for (const c of categoryData) {
    const { roleId, ...catFields } = c
    categories.push(await prisma.kpiCategory.create({ data: catFields }))
  }
  console.log(`  ✓ Created ${categories.length} KPI categories`)

  // ── 4. KPI Targets ──
  const catRoleMap = new Map<string, number[]>()
  const targetValues: Record<string, Record<string, number>> = {
    'dokter': { 'jumlah-pasien': 100, 'kepuasan-pasien': 90, 'ketepatan-diagnosis': 95, 'retensi-pasien': 70 },
    'branch-manager': { 'target-pendapatan': 500000000, 'kepuasan-pelanggan': 90, 'produktivitas-staff': 85, 'efisiensi-operasional': 90, 'pertumbuhan-cabang': 10 },
    'perawat': { 'jumlah-penanganan': 80, 'kepatuhan-prosedur': 95, 'kebersihan-ruangan': 95, 'dokumentasi-medis': 90 },
    'terapis': { 'jumlah-terapi': 60, 'kepuasan-klien': 90, 'upselling-produk': 5000000, 'kehadiran-tepat-waktu': 95 },
    'cs': { 'jumlah-pendaftaran': 150, 'waktu-pelayanan': 5, 'kepuasan-cs': 90, 'penanganan-keluhan': 100 },
    'apoteker': { 'akurasi-resep': 100, 'waktu-peracikan': 10, 'manajemen-stok': 95, 'kepatuhan-resep': 100 },
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
    'dokter': ['Dr. Andi', 'Dr. Siti'],
    'branch-manager': ['Budi Santoso', 'Rina Wijaya'],
    'perawat': ['Dewi Lestari', 'Ahmad Hidayat'],
    'terapis': ['Maya Putri', 'Rudi Hermawan'],
    'cs': ['Ani Susanti', 'Deni Pratama'],
    'apoteker': ['Fitri Handayani', 'Irfan Maulana'],
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
