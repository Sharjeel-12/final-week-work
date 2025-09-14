import {
  Component, OnDestroy, AfterViewInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PaymentsGatewayService } from '../Services/payments-gateway.service';
import { BillingSummaryDto, CreateIntentResponse } from '../models/billing';

declare const Stripe: any; // Stripe.js global

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-payments.component.html',
  styleUrls: ['./billing-payments.component.scss']
})
export class BillingPaymentsComponent implements AfterViewInit, OnDestroy {
  //  Put your real publishable key here
  private readonly STRIPE_PUBLISHABLE_KEY = "pk_test_51S77guKsnN2QicbA7zcIvFViq7QjaRyKzSVhZameVLayslXa6HendLQl9TpgeLKAbVDvBEvha71BggSbnGof1N9500d5yVhBUp";
// component properties
cashAmount: number | null = null;
cashRef: string = '';
processingCash = false;
  // UI inputs/state
  noteId: number | null = null;
  summary?: BillingSummaryDto;
  amountToPay: number | null = null;
  processing = false;
  message = '';

  // Stripe elements
  @ViewChild('cardHost') cardHost!: ElementRef<HTMLDivElement>;
  private stripe: any | null = null;
  private elements: any | null = null;
  private card: any | null = null;
  cardMounted = false;
  private mountedForNotesId: number | null = null;

  constructor(private payments: PaymentsGatewayService) {}

  ngAfterViewInit(): void {
    // If summary loaded before view init, mount now
    if (this.summary) this.ensureStripeMounted();
  }

  ngOnDestroy(): void {
    this.unmountCard();
  }

  /* ---------- UX helpers ---------- */
  fmt(n: number | null | undefined): string {
    const v = Number(n ?? 0);
    return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }
  private showError(err: unknown): void {
    if (!err) { this.message = 'Unexpected error.'; return; }
    const anyErr: any = err;
    if (anyErr?.error) {
      const e = anyErr.error;
      this.message = typeof e === 'string'
        ? e
        : (e.message || JSON.stringify(e));
      return;
    }
    this.message = anyErr?.message || JSON.stringify(anyErr);
  }
  
// helpers
private clampToBalance(n?: number | null): number {
  const bal = this.summary?.balance ?? 0;
  const v = Math.max(0, Number(n || 0));
  return Math.min(v, bal);
}

// call from the cash button
recordCash() {
  if (!this.summary) { this.showError('Load a Visit Note first.'); return; }
  const amt = this.clampToBalance(this.cashAmount);
  if (amt <= 0) { this.showError('Enter a positive amount not exceeding the balance.'); return; }

  this.processingCash = true;
  this.payments.recordCash(this.summary.notesID, amt, this.cashRef || undefined).subscribe({
    next: _ => {
      this.cashAmount = null;
      this.cashRef = '';
      this.load();    // same method you use after a card payment
      this.processingCash = false;
      this.message = 'Cash recorded.';
    },
    error: e => {
      this.processingCash = false;
      this.showError(e);
    }
  });
}
  /* ---------- Load summary ---------- */
  load(): void {
    if (!this.noteId || this.noteId <= 0) {
      this.message = 'Enter a valid Visit Note ID.';
      return;
    }
    this.message = 'Loading…';
    this.payments.getSummary(this.noteId).subscribe({
      next: (s: BillingSummaryDto) => {
        const changed = this.summary?.notesID !== s.notesID;
        this.summary = s;
        this.amountToPay = s.balance > 0 ? s.balance : null; // default to full
        this.message = '';

        if (changed) {
          // Different note: remount card to avoid stale Elements
          this.unmountCard();
          setTimeout(() => this.ensureStripeMounted()); // next tick
        } else {
          this.ensureStripeMounted();
        }
      },
      error: (e: unknown) => {
        this.summary = undefined;
        this.showError(e);
      }
    });
  }

  /* ---------- Stripe mount cycle ---------- */
  private ensureStripeMounted(): void {
    if (!this.summary || !this.cardHost?.nativeElement) return;

    // Already mounted for this notesID?
    if (this.cardMounted && this.mountedForNotesId === this.summary.notesID) return;

    // Clean previous
    this.unmountCard();

    try {
      if (!this.stripe) {
        if (typeof Stripe !== 'function') {
          this.showError('Stripe.js not loaded. Add <script src="https://js.stripe.com/v3/"></script> to index.html');
          return;
        }
        this.stripe = Stripe(this.STRIPE_PUBLISHABLE_KEY);
        this.elements = this.stripe.elements();
      }
      this.card = this.elements!.create('card', { hidePostalCode: true });
      this.card.mount(this.cardHost.nativeElement);
      this.cardMounted = true;
      this.mountedForNotesId = this.summary.notesID;
    } catch (e) {
      this.showError(e);
    }
  }

  private unmountCard(): void {
    try {
      if (this.card && this.cardMounted) this.card.unmount();
    } catch {}
    this.card = null;
    this.cardMounted = false;
    this.mountedForNotesId = null;
  }

  /* ---------- Pay ---------- */
  canPay(): boolean {
    if (!this.summary || !this.cardMounted || this.processing) return false;
    const amt = Number(this.amountToPay);
    if (!isFinite(amt) || amt <= 0) return false;
    if (amt > this.summary.balance) return false;
    return true;
  }

  async pay(): Promise<void> {
    if (!this.summary) return;
    if (!this.cardMounted || !this.card) {
      this.message = 'Card not ready yet. Please wait a second.';
      this.ensureStripeMounted();
      return;
    }
    if (!this.canPay()) { this.message = 'Invalid amount.'; return; }

    this.processing = true;
    this.message = 'Processing…';

    try {
      // 1) Create intent on backend (supports partial)
      const resp: CreateIntentResponse = await firstValueFrom(
        this.payments.createIntent(this.summary.notesID, Number(this.amountToPay))
      );
      if (!resp?.clientSecret) {
        this.message = 'Payment initialization failed.';
        this.processing = false;
        return;
      }

      // 2) Confirm with Stripe Elements
      const result = await this.stripe!.confirmCardPayment(resp.clientSecret, {
        payment_method: { card: this.card }
      });

      if (result.error) {
        this.message = `Payment failed: ${result.error.message}`;
      } else if (result.paymentIntent?.status === 'succeeded') {
        this.message = 'Payment successful!';
        // Webhook will insert the payment row; refresh shortly
        setTimeout(() => this.load(), 700);
      } else {
        this.message = `Payment status: ${result.paymentIntent?.status}`;
      }
    } catch (e) {
      this.showError(e);
    } finally {
      this.processing = false;
    }
  }
}
