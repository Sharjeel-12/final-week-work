import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingPaymentsComponent } from './billing-payments.component';

describe('BillingPaymentsComponent', () => {
  let component: BillingPaymentsComponent;
  let fixture: ComponentFixture<BillingPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingPaymentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillingPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
