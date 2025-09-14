import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitNotesComponent } from './visit-notes.component';

describe('VisitNotesComponent', () => {
  let component: VisitNotesComponent;
  let fixture: ComponentFixture<VisitNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitNotesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisitNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
