import { TestBed } from '@angular/core/testing';

import { PaymentsGatewayService } from './payments-gateway.service';

describe('PaymentsGatewayService', () => {
  let service: PaymentsGatewayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentsGatewayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
