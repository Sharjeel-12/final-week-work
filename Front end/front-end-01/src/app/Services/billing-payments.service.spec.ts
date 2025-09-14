import { TestBed } from '@angular/core/testing';

import { BillingPaymentsService } from './billing-payments.service';

describe('BillingPaymentsService', () => {
  let service: BillingPaymentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillingPaymentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
