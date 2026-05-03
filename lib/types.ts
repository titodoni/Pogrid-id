export type StaticRole =
  | 'ADMIN'
  | 'OWNER'
  | 'MANAGER'
  | 'SALES'
  | 'QC'
  | 'DELIVERY'
  | 'FINANCE'
  | 'DRAFTER'
  | 'PURCHASING';

export type OperatorRole = `OPERATOR_${string}`;
export type Role = StaticRole | OperatorRole;

export type ItemStatus = 'DRAFTING' | 'PURCHASING' | 'PRODUCTION' | 'QC' | 'DELIVERY' | 'DONE';
export type POStatus = 'ACTIVE' | 'FINISHED' | 'CLOSED';
export type UrgencyFlag = 'NORMAL' | 'ORANGE' | 'RED' | 'BLOOD_RED';
export type InvoiceStatus = 'PENDING' | 'INVOICED' | 'PAID';
export type ReworkType = 'MINOR' | 'MAJOR';
export type ItemSource = 'ORIGINAL' | 'REWORK' | 'RETURN';
export type ProblemSource = 'OPERATOR' | 'SYSTEM';

export type NotificationType =
  | 'NEW_PO'
  | 'STAGE_ADVANCE'
  | 'PROBLEM_REPORTED'
  | 'DRAWING_REDRAW'
  | 'FLAG_ESCALATED'
  | 'ITEM_REWORK'
  | 'ITEM_DONE'
  | 'FINANCE_PAID';

export type AuditAction =
  | 'PROGRESS_UPDATE'
  | 'STAGE_ADVANCE'
  | 'QC_PASS'
  | 'QC_MINOR_FAIL'
  | 'QC_MAJOR_FAIL'
  | 'DELIVERY_CONFIRM'
  | 'REWORK_SPAWNED'
  | 'RETURN_SPAWNED'
  | 'DRAWING_APPROVED'
  | 'DRAWING_REDRAW'
  | 'ADMIN_OVERRIDE'
  | 'INVOICE_UPDATE'
  | 'EDIT_PO_FIELD'
  | 'FLAG_ESCALATE'
  | 'DELETE_PO'
  | 'PROBLEM_RESOLVED'
  | 'PIN_RESET'
  | 'SELF_PIN_CHANGE'
  | 'USER_CREATED'
  | 'USER_TOGGLED';

export type StageTimestampField =
  | 'drafting_started_at'
  | 'purchasing_started_at'
  | 'production_started_at'
  | 'qc_started_at'
  | 'delivery_started_at'
  | 'done_at';
