// POgrid domain types — String fields + TS unions per spec
export type ItemStatus =
  | "DRAFTING" | "PURCHASING" | "PRODUCTION" | "QC" | "DELIVERY" | "DONE";
export type InvoiceStatus = "PENDING" | "INVOICED" | "PAID";
export type UrgencyFlag = "NORMAL" | "ORANGE" | "RED" | "BLOOD_RED";
export type POStatus = "ACTIVE" | "FINISHED" | "CLOSED";
export type ReworkType = "MINOR" | "MAJOR";
export type ItemSource = "ORIGINAL" | "REWORK" | "RETURN";
export type ProblemSource = "OPERATOR" | "SYSTEM";

export type StaticRole =
  | "ADMIN" | "OWNER" | "MANAGER" | "SALES"
  | "QC" | "DELIVERY" | "FINANCE"
  | "DRAFTER" | "PURCHASING";
export type UserRole = StaticRole | `OPERATOR_${string}`;

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  order: number;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
}

export interface PO {
  id: string;
  po_internal_number: string;
  po_client_number: string;
  clientId: string;
  po_date: string;     // ISO — tanggal PO dibuat (input form)
  due_date: string;    // ISO
  urgency_flag: UrgencyFlag;
  is_urgent: boolean;
  is_vendor_job: boolean;
  notes?: string;
  status: POStatus;
  createdAt: string;
}

export interface ItemProgress {
  departmentId: string;
  progress: number; // 0-100
}

export interface Item {
  id: string;
  poId: string;
  name: string;
  spec?: string;       // spesifikasi teknis (opsional)
  unit: string;        // default "pcs"
  qty: number;
  work_type: string[]; // department ids
  status: ItemStatus;
  drawing_approved: boolean;
  drawing_revision: number;
  purchasing_progress: number;
  is_rework: boolean;
  rework_type?: ReworkType;
  rework_reason?: string;
  source: ItemSource;
  parentItemId?: string;
  parentItemName?: string;
  invoice_status: InvoiceStatus;
  progresses: ItemProgress[];
  problemsOpen: number;
  drafting_started_at?: string;
  done_at?: string;
}

export interface Problem {
  id: string;
  itemId: string;
  reportedBy: string;
  source: ProblemSource;
  category: string;
  note: string;
  resolved: boolean;
  createdAt: string;
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  SALES: "Sales",
  QC: "QC",
  DELIVERY: "Delivery",
  FINANCE: "Finance",
  DRAFTER: "Drafter",
  PURCHASING: "Purchasing",
};

export function roleLabel(role: UserRole): string {
  if (role.startsWith("OPERATOR_")) {
    const dept = role.replace("OPERATOR_", "");
    return `Operator ${dept.charAt(0) + dept.slice(1).toLowerCase()}`;
  }
  return ROLE_LABEL[role] ?? role;
}

export function roleHome(role: UserRole): string {
  if (role === "ADMIN") return "/pos";
  if (role === "OWNER" || role === "MANAGER" || role === "SALES") return "/pos";
  if (role === "FINANCE") return "/finance";
  return "/tasks";
}
