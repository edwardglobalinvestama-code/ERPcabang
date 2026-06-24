import { NextResponse } from 'next/server'

// ── Hardcoded role permissions based on business rules ──
// Defines which feature-level permissions each role has,
// and which KPI category slugs each role can access.
const ROLE_PERMISSIONS: Record<string, {
  canSubmitKpi: boolean
  canViewReports: boolean
  canManageStaff: boolean
  canApproveKpi: boolean
  allowedKpiSlugs: string[]
}> = {
  'branch-manager': {
    canSubmitKpi: true,
    canViewReports: true,
    canManageStaff: true,
    canApproveKpi: true,
    allowedKpiSlugs: [
      'target-pendapatan', 'kepuasan-pelanggan-bm', 'produktivitas-staff',
      'efisiensi-operasional', 'pertumbuhan-cabang', 'pencarian-event',
      'pencarian-influencer', 'upselling-bm', 'target-sales-bm', 'zero-complain',
    ],
  },
  'dokter': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'jumlah-pasien', 'kepuasan-pasien', 'ketepatan-diagnosis',
      'retensi-pasien', 'upselling-dokter', 'target-sales-dokter',
      'grooming-dokter', 'kehadiran-dokter',
    ],
  },
  'perawat': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'jumlah-penanganan', 'kepatuhan-prosedur', 'kebersihan-ruangan',
      'dokumentasi-medis', 'upselling-perawat', 'target-sales-perawat',
      'kepuasan-perawat', 'produktivitas-perawat', 'grooming-perawat',
    ],
  },
  'terapis': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'jumlah-terapi', 'kepatuhan-prosedur-terapis', 'kebersihan-ruangan-terapis',
      'dokumentasi-terapis', 'upselling-terapis', 'target-sales-terapis',
      'kepuasan-terapis', 'produktivitas-terapis', 'grooming-terapis',
    ],
  },
  'cs': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'jumlah-pendaftaran', 'waktu-pelayanan', 'kepuasan-cs',
      'penanganan-keluhan', 'target-sales-cs', 'upselling-cs',
      'zero-complain-cs', 'grooming-cs',
    ],
  },
  'apoteker': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'akurasi-resep', 'waktu-peracikan', 'manajemen-stok', 'kepatuhan-resep',
    ],
  },
  'gudang': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'ketepatan-pengiriman', 'minimal-kesalahan-stok', 'pelaporan-stok-ed',
      'monitoring-stok', 'sla-distribusi', 'kelengkapan-dokumen',
      'purchasing-tepat-waktu', 'pemeliharaan-kendaraan', 'kebersihan-gudang',
    ],
  },
  'coach': {
    canSubmitKpi: true,
    canViewReports: false,
    canManageStaff: false,
    canApproveKpi: false,
    allowedKpiSlugs: [
      'jumlah-member-aktif', 'retensi-member', 'sesi-personal-training',
      'kebersihan-alat-gym', 'kepuasan-member', 'akuisisi-member-baru',
      'target-revenue-gym', 'upselling-paket-gym',
    ],
  },
}

// Metadata for each role — description and visual config
const ROLE_METADATA: Record<string, { name: string; description: string; color: string }> = {
  'dokter':           { name: 'Dokter',           description: 'Dokter klinik — diagnosis & perawatan pasien', color: '#731D36' },
  'branch-manager':   { name: 'Branch Manager',   description: 'Manager cabang — operasional & target cabang', color: '#C9A96E' },
  'perawat':          { name: 'Perawat',          description: 'Perawat klinik — penanganan & perawatan', color: '#E2A6C0' },
  'terapis':          { name: 'Terapis',          description: 'Terapis treatment — sesi terapi', color: '#8B2A45' },
  'cs':               { name: 'Customer Service', description: 'Customer service — pendaftaran & informasi', color: '#D4B98A' },
  'apoteker':         { name: 'Apoteker',         description: 'Apotek — peracikan & manajemen obat', color: '#CD7F32' },
  'gudang':           { name: 'Gudang',           description: 'Gudang & logistik — stok & distribusi', color: '#6B1D30' },
  'coach':            { name: 'Coach',            description: 'Personal trainer & gym staff — KPI gym', color: '#2E7D32' },
}

export async function GET() {
  try {
    const permissions = Object.entries(ROLE_PERMISSIONS).map(([slug, perm]) => ({
      slug,
      name: ROLE_METADATA[slug]?.name ?? slug,
      description: ROLE_METADATA[slug]?.description ?? '',
      color: ROLE_METADATA[slug]?.color ?? '#731D36',
      ...perm,
    }))

    return NextResponse.json({ permissions, metadata: ROLE_METADATA })
  } catch (error) {
    console.error('GET /api/roles/permissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role permissions' },
      { status: 500 },
    )
  }
}
