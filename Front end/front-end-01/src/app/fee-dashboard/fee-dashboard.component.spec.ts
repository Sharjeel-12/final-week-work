import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeeDashboardComponent } from './fee-dashboard.component';

describe('FeeDashboardComponent', () => {
  let component: FeeDashboardComponent;
  let fixture: ComponentFixture<FeeDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
