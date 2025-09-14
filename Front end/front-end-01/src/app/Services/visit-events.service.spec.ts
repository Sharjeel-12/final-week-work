import { TestBed } from '@angular/core/testing';

import { VisitEventsService } from './visit-events.service';

describe('VisitEventsService', () => {
  let service: VisitEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
