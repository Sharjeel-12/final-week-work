export interface Rule {
  id: number;
  ruleName: string;
  rulePrice: number;
}

/** The note header (no rule on the header anymore) */
export interface VisitNote {
  notesID: number;
  visitID: number;
  visitNotes: string;
  finalized: boolean;
}

/** Items under a note (multiple rules allowed) */
export interface VisitNoteItem {
  itemID: number;
  notesID: number;
  ruleID: number;
  quantity: number;
  unitPrice: number; // snapshotted at add-time
}

/** DTOs */
export interface CreateVisitNoteDto {
  visitID: number;
  visitNotes: string;
}
export interface UpdateVisitNoteDto {
  notesID: number;
  visitNotes: string;
}

export interface CreateVisitNoteItemDto {
  ruleID: number;
  quantity: number;
}
export interface UpdateVisitNoteItemDto {
  itemID: number;
  quantity: number;
}

/** Billing */
export interface Billing {
  billingID: number;
  notesID: number;
  totalBill: number;
}
export interface CreateBillingDto {
  notesID: number;
  overrideTotal?: number | null;
}

/** Billing preview with line items */
export interface BillingLineDto {
  kind: 'visit' | 'rule';
  description: string;
  quantity?: number | null;
  unitPrice: number;
  lineTotal: number;
}
export interface BillingPreviewDto {
  notesID: number;
  visitID: number;
  lines: BillingLineDto[];
  total: number;
}
