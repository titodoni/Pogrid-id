import type {
  User, Department, Client, PO, Item, Problem, UrgencyFlag,
} from "./types";
import { differenceInDays } from "date-fns";

export const departments: Department[] = [
  { id: "d-mach", name: "Machining", order: 1, active: true },
  { id: "d-fabr", name: "Fabrikasi", order: 2, active: true },
  { id: "d-fini", name: "Finishing", order: 3, active: true },
];

export const clients: Client[] = [
  { id: "c-1", name: "PT. Sinar Baja" },
  { id: "c-2", name: "CV. Mitra Logam" },
  { id: "c-3", name: "PT. Adhi Karya" },
  { id: "c-4", name: "PT. Wijaya Steel" },
];

export const users: User[] = [
  { id: "u-admin", username: "admin", name: "Tito Doni", role: "ADMIN", isActive: true },
  { id: "u-owner", username: "owner", name: "Bambang Sutrisno", role: "OWNER", isActive: true },
  { id: "u-manager", username: "manager", name: "Rini Hartono", role: "MANAGER", isActive: true },
  { id: "u-sales", username: "sales", name: "Yudi Pratama", role: "SALES", isActive: true },
  { id: "u-finance", username: "finance", name: "Sri Wahyuni", role: "FINANCE", isActive: true },
  { id: "u-finance2", username: "finance2", name: "Linda Kartika", role: "FINANCE", isActive: true },
  { id: "u-drafter", username: "drafter", name: "Andika Nugraha", role: "DRAFTER", isActive: true },
  { id: "u-drafter2", username: "drafter2", name: "Sinta Maharani", role: "DRAFTER", isActive: true },
  { id: "u-purch", username: "purch", name: "Dewi Lestari", role: "PURCHASING", isActive: true },
  { id: "u-qc", username: "qc", name: "Hendra Setiawan", role: "QC", isActive: true },
  { id: "u-qc2", username: "qc2", name: "Bayu Anggara", role: "QC", isActive: true },
  { id: "u-deliv", username: "deliv", name: "Joko Susilo", role: "DELIVERY", isActive: true },
  { id: "u-op-mach", username: "op_mach", name: "Agus Salim", role: "OPERATOR_MACHINING", isActive: true },
  { id: "u-op-mach2", username: "op_mach2", name: "Wahyu Hidayat", role: "OPERATOR_MACHINING", isActive: true },
  { id: "u-op-mach3", username: "op_mach3", name: "Rudi Hartanto", role: "OPERATOR_MACHINING", isActive: true },
  { id: "u-op-fabr", username: "op_fabr", name: "Slamet Riyadi", role: "OPERATOR_FABRIKASI", isActive: true },
  { id: "u-op-fabr2", username: "op_fabr2", name: "Bagus Pranata", role: "OPERATOR_FABRIKASI", isActive: true },
  { id: "u-op-fini", username: "op_fini", name: "Eko Prasetyo", role: "OPERATOR_FINISHING", isActive: true },
];

const today = new Date();
const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

export function computeFlag(dueDate: string, t1 = 7, t2 = 3): UrgencyFlag {
  const d = differenceInDays(new Date(dueDate), today);
  if (d < 0) return "BLOOD_RED";
  if (d <= t2) return "RED";
  if (d <= t1) return "ORANGE";
  return "NORMAL";
}

export const pos: PO[] = [
  {
    id: "po-1", po_internal_number: "PO-2026-0001", po_client_number: "SB-451",
    clientId: "c-1", po_date: daysFromNow(-15), due_date: daysFromNow(-2),
    urgency_flag: "BLOOD_RED", is_urgent: true, is_vendor_job: false,
    notes: "Material harus stainless 304, surface harus halus.",
    status: "ACTIVE", createdAt: daysFromNow(-15),
  },
  {
    id: "po-2", po_internal_number: "PO-2026-0002", po_client_number: "ML-220",
    clientId: "c-2", po_date: daysFromNow(-10), due_date: daysFromNow(2),
    urgency_flag: "RED", is_urgent: false, is_vendor_job: false,
    status: "ACTIVE", createdAt: daysFromNow(-10),
  },
  {
    id: "po-3", po_internal_number: "PO-2026-0003", po_client_number: "AK-9912",
    clientId: "c-3", po_date: daysFromNow(-7), due_date: daysFromNow(5),
    urgency_flag: "ORANGE", is_urgent: false, is_vendor_job: true,
    notes: "Job vendor — koordinasi via WA group.",
    status: "ACTIVE", createdAt: daysFromNow(-7),
  },
  {
    id: "po-4", po_internal_number: "PO-2026-0004", po_client_number: "WS-118",
    clientId: "c-4", po_date: daysFromNow(-3), due_date: daysFromNow(14),
    urgency_flag: "NORMAL", is_urgent: false, is_vendor_job: false,
    status: "ACTIVE", createdAt: daysFromNow(-3),
  },
  {
    id: "po-5", po_internal_number: "PO-2025-0098", po_client_number: "SB-332",
    clientId: "c-1", po_date: daysFromNow(-45), due_date: daysFromNow(-30),
    urgency_flag: "NORMAL", is_urgent: false, is_vendor_job: false,
    status: "FINISHED", createdAt: daysFromNow(-45),
  },
  {
    id: "po-6", po_internal_number: "PO-2025-0094", po_client_number: "ML-201",
    clientId: "c-2", po_date: daysFromNow(-60), due_date: daysFromNow(-45),
    urgency_flag: "NORMAL", is_urgent: false, is_vendor_job: false,
    status: "CLOSED", createdAt: daysFromNow(-60),
  },
];

export const items: Item[] = [
  {
    id: "i-1", poId: "po-1", name: "Bracket Mesin A-200",
    spec: "MS plate 6mm, dim 200x150x40", unit: "pcs", qty: 20,
    work_type: ["d-mach", "d-fabr"], status: "PRODUCTION",
    drawing_approved: true, drawing_revision: 1, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-mach", progress: 60 },
      { departmentId: "d-fabr", progress: 30 },
    ],
    problemsOpen: 1,
  },
  {
    id: "i-2", poId: "po-1", name: "Plat Penutup 5mm",
    spec: "Hot rolled 5mm, qty 12 pcs", unit: "pcs", qty: 12,
    work_type: ["d-fabr", "d-fini"], status: "PRODUCTION",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: true, rework_type: "MINOR", rework_reason: "Surface NG",
    source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-fabr", progress: 100 },
      { departmentId: "d-fini", progress: 45 },
    ],
    problemsOpen: 0,
  },
  {
    id: "i-3", poId: "po-2", name: "Frame Conveyor 3m",
    spec: "Hollow 50x50x2.3, panjang 3m", unit: "pcs", qty: 4,
    work_type: ["d-mach", "d-fabr", "d-fini"], status: "QC",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-mach", progress: 100 },
      { departmentId: "d-fabr", progress: 100 },
      { departmentId: "d-fini", progress: 100 },
    ],
    problemsOpen: 0,
  },
  {
    id: "i-4", poId: "po-2", name: "Hopper Plate", unit: "pcs", qty: 8,
    work_type: ["d-fabr"], status: "PURCHASING",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 33,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [{ departmentId: "d-fabr", progress: 0 }],
    problemsOpen: 0,
  },
  {
    id: "i-5", poId: "po-3", name: "Kompresor Bracket",
    spec: "MS 8mm, custom hole pattern", unit: "pcs", qty: 6,
    work_type: ["d-mach", "d-fini"], status: "DRAFTING",
    drawing_approved: false, drawing_revision: 1, purchasing_progress: 0,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-mach", progress: 0 },
      { departmentId: "d-fini", progress: 0 },
    ],
    problemsOpen: 0,
  },
  {
    id: "i-6", poId: "po-3", name: "Tutup Box Panel", unit: "pcs", qty: 1,
    work_type: ["d-fabr", "d-fini"], status: "DELIVERY",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-fabr", progress: 100 },
      { departmentId: "d-fini", progress: 100 },
    ],
    problemsOpen: 0,
  },
  {
    id: "i-7", poId: "po-4", name: "Rangka Pagar Modular", unit: "pcs", qty: 30,
    work_type: ["d-mach", "d-fabr", "d-fini"], status: "PRODUCTION",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 66,
    is_rework: true, rework_type: "MAJOR", rework_reason: "Dimensi tidak sesuai",
    source: "REWORK", parentItemId: "i-3", parentItemName: "Frame Conveyor 3m",
    invoice_status: "PENDING",
    progresses: [
      { departmentId: "d-mach", progress: 20 },
      { departmentId: "d-fabr", progress: 0 },
      { departmentId: "d-fini", progress: 0 },
    ],
    problemsOpen: 0,
  },
  {
    id: "i-8", poId: "po-4", name: "Engsel Heavy Duty", unit: "pcs", qty: 50,
    work_type: ["d-mach"], status: "DONE",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "PENDING",
    progresses: [{ departmentId: "d-mach", progress: 100 }],
    problemsOpen: 0,
    done_at: daysFromNow(-1),
  },
  // Finance test data — items DONE in various invoice states
  {
    id: "i-9", poId: "po-5", name: "Cover Mesin Stainless", unit: "pcs", qty: 4,
    work_type: ["d-fabr", "d-fini"], status: "DONE",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "INVOICED",
    progresses: [
      { departmentId: "d-fabr", progress: 100 },
      { departmentId: "d-fini", progress: 100 },
    ],
    problemsOpen: 0, done_at: daysFromNow(-25),
  },
  {
    id: "i-10", poId: "po-5", name: "Mounting Bracket", unit: "pcs", qty: 10,
    work_type: ["d-mach"], status: "DONE",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "INVOICED",
    progresses: [{ departmentId: "d-mach", progress: 100 }],
    problemsOpen: 0, done_at: daysFromNow(-22),
  },
  {
    id: "i-11", poId: "po-6", name: "Conveyor Roller Set", unit: "set", qty: 5,
    work_type: ["d-mach", "d-fabr"], status: "DONE",
    drawing_approved: true, drawing_revision: 0, purchasing_progress: 100,
    is_rework: false, source: "ORIGINAL", invoice_status: "PAID",
    progresses: [
      { departmentId: "d-mach", progress: 100 },
      { departmentId: "d-fabr", progress: 100 },
    ],
    problemsOpen: 0, done_at: daysFromNow(-50),
  },
];

export const problems: Problem[] = [
  {
    id: "p-1", itemId: "i-1", reportedBy: "u-op-mach", source: "OPERATOR",
    category: "Mesin/alat bermasalah", note: "Mesin CNC #2 trouble, menunggu teknisi",
    resolved: false, createdAt: daysFromNow(0),
  },
  {
    id: "p-2", itemId: "i-5", reportedBy: "system", source: "SYSTEM",
    category: "Gambar perlu redraw", note: "Revisi ke-1",
    resolved: false, createdAt: daysFromNow(-1),
  },
];

export function clientById(id: string) {
  return clients.find((c) => c.id === id);
}
export function poById(id: string) {
  return pos.find((p) => p.id === id);
}
export function deptById(id: string) {
  return departments.find((d) => d.id === id);
}
export function userById(id: string) {
  return users.find((u) => u.id === id);
}
export function usersByRole(role: string) {
  return users.filter((u) => u.role === role && u.isActive);
}
export function generateNextPoNumber(existing: { po_internal_number: string }[]): string {
  const year = new Date().getFullYear();
  const seqs = existing
    .map((p) => {
      const m = p.po_internal_number.match(/PO-(\d{4})-(\d+)/);
      return m && Number(m[1]) === year ? Number(m[2]) : 0;
    })
    .filter(Boolean);
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `PO-${year}-${String(next).padStart(4, "0")}`;
}
