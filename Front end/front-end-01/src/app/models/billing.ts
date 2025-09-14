export interface BillingPayment {
  paymentID: number;
  billingID: number;
  amount: number;
  method: 'cash' | 'card' | string;
  reference?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  createdAt: string; 
}

export interface BillingSummaryDto {
  billingID: number;
  notesID: number;
  total: number;
  paid: number;
  balance: number;
  payments: BillingPayment[];
}

export interface CreateIntentDto {
  notesId: number;
  /** OPTIONAL: send for partial payments */
  amount?: number;
}

export interface CreateIntentResponse {
  clientSecret: string;
}
