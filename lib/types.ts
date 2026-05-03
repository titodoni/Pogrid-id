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
