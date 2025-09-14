import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeeklyCalendarComponent } from './weekly-calendar.component';

describe('WeeklyCalendarComponent', () => {
  let component: WeeklyCalendarComponent;
  let fixture: ComponentFixture<WeeklyCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeeklyCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WeeklyCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
