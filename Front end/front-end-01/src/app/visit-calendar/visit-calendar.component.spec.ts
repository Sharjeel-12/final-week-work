import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitCalendarComponent } from './visit-calendar.component';

describe('VisitCalendarComponent', () => {
  let component: VisitCalendarComponent;
  let fixture: ComponentFixture<VisitCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisitCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
